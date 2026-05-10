import { captureFrontendException, captureFrontendMessage } from './monitoring';

type RefreshPromise = Promise<Response> | null;

let refreshPromise: RefreshPromise = null;
const pendingQueue: Array<() => void> = [];

async function refreshToken(): Promise<Response> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = fetch('/api/v1/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  try {
    const response = await refreshPromise;
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    // Notify all pending requests to retry
    pendingQueue.forEach((resolve) => resolve());
    pendingQueue.length = 0;
    return response;
  } catch (error) {
    // Clear queue on failure
    pendingQueue.length = 0;
    throw error;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(input, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init?.headers || {}),
      },
    });

    if (response.status === 401 && !input.includes('/auth/')) {
      // Try to refresh token
      try {
        // Wait for any ongoing refresh or start a new one
        if (!refreshPromise) {
          refreshToken();
        }

        // Create a promise that resolves when refresh is done
        const waitForRefresh = new Promise<void>((resolve) => {
          pendingQueue.push(resolve);
        });

        await waitForRefresh;

        // Retry the original request
        const retryResponse = await fetch(input, {
          credentials: 'include',
          ...init,
          headers: {
            ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(init?.headers || {}),
          },
        });

        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => null);
          const message = errorData?.error || errorData?.message || retryResponse.statusText || 'Request failed';
          throw new Error(message);
        }

        return retryResponse.json() as Promise<T>;
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error || errorData?.message || response.statusText || 'Request failed';
      captureFrontendMessage('API request failed', {
        url: input,
        method: init?.method || 'GET',
        status: response.status,
        responseMessage: message,
      });
      throw new Error(message);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    captureFrontendException(error, {
      url: input,
      method: init?.method || 'GET',
      requestHasBody: Boolean(init?.body),
    });
    throw error;
  }
}
