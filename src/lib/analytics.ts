import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const ANALYTICS_ENABLED = Boolean(POSTHOG_KEY);

let initialized = false;

export const ANALYTICS_EVENTS = {
  APP_OPENED: 'app_opened',
  PAGE_VIEWED: 'page_viewed',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  EMAIL_VERIFICATION_COMPLETED: 'email_verification_completed',
  LOGIN_COMPLETED: 'login_completed',
  FEATURE_PREDICT_VIEWED: 'feature_predict_viewed',
  FEATURE_BULK_VIEWED: 'feature_bulk_viewed',
  FEATURE_ANALYTICS_VIEWED: 'feature_analytics_viewed',
  DOCUMENT_UPLOAD_STARTED: 'document_upload_started',
  DOCUMENT_EXTRACTION_COMPLETED: 'document_extraction_completed',
  DOCUMENT_EXTRACTION_FAILED: 'document_extraction_failed',
  CLAIM_PREDICTION_SUBMITTED: 'claim_prediction_submitted',
  CLAIM_PREDICTION_COMPLETED: 'claim_prediction_completed',
  CLAIM_PREDICTION_FAILED: 'claim_prediction_failed',
  BULK_PROCESSING_STARTED: 'bulk_processing_started',
  BULK_PROCESSING_COMPLETED: 'bulk_processing_completed',
  BULK_PROCESSING_FAILED: 'bulk_processing_failed',
  OFFLINE_ACTION_QUEUED: 'offline_action_queued',
} as const;

export function initAnalytics() {
  if (!ANALYTICS_ENABLED || initialized) return;

  posthog.init(POSTHOG_KEY!, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    persistence: 'localStorage+cookie',
    autocapture: true,
    capture_pageleave: true,
    loaded: (client) => {
      client.capture(ANALYTICS_EVENTS.APP_OPENED, { source: 'web' });
    },
  });

  initialized = true;
}

export function analyticsIdentify(user: { id: string; email?: string; name?: string; role?: string }) {
  if (!ANALYTICS_ENABLED) return;
  posthog.identify(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
  });
}

export function analyticsReset() {
  if (!ANALYTICS_ENABLED) return;
  posthog.reset();
}

export function analyticsTrack(event: string, properties?: Record<string, unknown>) {
  if (!ANALYTICS_ENABLED) return;
  posthog.capture(event, properties);
}

export function analyticsPage(path: string, properties?: Record<string, unknown>) {
  analyticsTrack(ANALYTICS_EVENTS.PAGE_VIEWED, {
    path,
    ...properties,
  });
}
