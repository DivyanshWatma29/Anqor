import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { apiFetch } from '../lib/http';

// Mock apiFetch
vi.mock('../lib/http', () => ({
  apiFetch: vi.fn(),
}));

// Mock service worker and push manager
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockGetSubscription = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Mock navigator.serviceWorker
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve({
        pushManager: {
          subscribe: mockSubscribe,
          getSubscription: mockGetSubscription,
        },
      }),
    },
    configurable: true,
  });

  // Mock PushManager support
  Object.defineProperty(window, 'PushManager', {
    value: class MockPushManager {},
    configurable: true,
  });
});

describe('usePushNotifications Hook', () => {
  it('should initialize with correct state', () => {
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.supported).toBe(true);
    expect(result.current.subscribed).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should subscribe to push notifications', async () => {
    const mockSubscription = { endpoint: 'https://example.com/push' };
    mockSubscribe.mockResolvedValueOnce(mockSubscription);
    (apiFetch as any).mockResolvedValueOnce({ publicKey: 'test-public-key' });
    (apiFetch as any).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(result.current.subscribed).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle subscription error', async () => {
    mockSubscribe.mockRejectedValueOnce(new Error('Subscription failed'));
    (apiFetch as any).mockResolvedValueOnce({ publicKey: 'test-public-key' });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.subscribe();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Subscription failed');
      expect(result.current.loading).toBe(false);
    });
  });

  it('should unsubscribe from push notifications', async () => {
    const mockSubscription = {
      endpoint: 'https://example.com/push',
      unsubscribe: mockUnsubscribe,
    };
    mockGetSubscription.mockResolvedValueOnce(mockSubscription);
    mockUnsubscribe.mockResolvedValueOnce(true);
    (apiFetch as any).mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.unsubscribe();
    });

    await waitFor(() => {
      expect(result.current.subscribed).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle unsubscribe error', async () => {
    mockGetSubscription.mockResolvedValueOnce({
      unsubscribe: mockUnsubscribe,
    });
    mockUnsubscribe.mockResolvedValueOnce(true);
    (apiFetch as any).mockRejectedValueOnce(new Error('Unsubscribe failed'));

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await result.current.unsubscribe();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Unsubscribe failed');
      expect(result.current.loading).toBe(false);
    });
  });
});
