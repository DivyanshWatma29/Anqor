import * as Sentry from '@sentry/node';

const SERVER_DSN = process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN;
const SERVER_ENV = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SERVER_RELEASE = process.env.SENTRY_RELEASE;

let initialized = false;

export function initServerMonitoring() {
  if (initialized || !SERVER_DSN) return;

  Sentry.init({
    dsn: SERVER_DSN,
    environment: SERVER_ENV,
    release: SERVER_RELEASE,
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });

  initialized = true;
}

export function captureServerException(error, context = {}) {
  if (!SERVER_DSN) {
    console.error('Server exception:', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }
    Sentry.captureException(error);
  });
}

export function captureServerMessage(message, context = {}) {
  if (!SERVER_DSN) {
    console.warn(message, context);
    return;
  }

  Sentry.withScope((scope) => {
    for (const [key, value] of Object.entries(context)) {
      scope.setExtra(key, value);
    }
    Sentry.captureMessage(message, 'error');
  });
}

export { Sentry };
