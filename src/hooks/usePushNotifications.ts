import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/http';

export interface PushSubscriptionState {
  supported: boolean;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing web push notifications
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    supported: 'serviceWorker' in navigator && 'PushManager' in window,
    subscribed: false,
    loading: false,
    error: null,
  });

  // Check initial subscription status
  useEffect(() => {
    if (!state.supported) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({ ...prev, subscribed: !!subscription }));
      } catch (err) {
        console.error('Push subscription check failed:', err);
      }
    };

    checkSubscription();
  }, [state.supported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!state.supported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get VAPID public key from server
      const { publicKey } = await apiFetch<{ publicKey: string }>('/api/v1/notifications/vapid-public-key');

      const registration = await navigator.serviceWorker.ready;

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Send subscription to server
      await apiFetch('/api/v1/notifications/subscribe-push', {
        method: 'POST',
        body: JSON.stringify({ subscription }),
      });

      setState(prev => ({ ...prev, subscribed: true, loading: false }));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
      setState(prev => ({ ...prev, error, loading: false }));
      return false;
    }
  }, [state.supported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!state.supported) return false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify server
      await apiFetch('/api/v1/notifications/unsubscribe-push', {
        method: 'POST',
      });

      setState(prev => ({ ...prev, subscribed: false, loading: false }));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unsubscribe failed';
      setState(prev => ({ ...prev, error, loading: false }));
      return false;
    }
  }, [state.supported]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
