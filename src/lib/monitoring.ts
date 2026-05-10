import * as Sentry from '@sentry/react';

const FRONTEND_DSN = import.meta.env.VITE_SENTRY_DSN;
const FRONTEND_ENV = import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE;
const FRONTEND_RELEASE = import.meta.env.VITE_SENTRY_RELEASE;

let initialized = false;

export function initFrontendMonitoring() {
  if (initialized || !FRONTEND_DSN) return;

  Sentry.init({
    dsn: FRONTEND_DSN,
    environment: FRONTEND_ENV,
    release: FRONTEND_RELEASE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });

  initialized = true;
}

export function captureFrontendException(error: unknown, context?: Record<string, unknown>) {
  if (!FRONTEND_DSN) {
    console.error('Frontend exception:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureFrontendMessage(message: string, context?: Record<string, unknown>) {
  if (!FRONTEND_DSN) {
    console.warn(message, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message, 'error');
  });
}

export { Sentry };
