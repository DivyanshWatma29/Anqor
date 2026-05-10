import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsPage, analyticsTrack, ANALYTICS_EVENTS } from '@/lib/analytics';

const featureEvents: Record<string, string> = {
  '/predict': ANALYTICS_EVENTS.FEATURE_PREDICT_VIEWED,
  '/bulk-check': ANALYTICS_EVENTS.FEATURE_BULK_VIEWED,
  '/analytics': ANALYTICS_EVENTS.FEATURE_ANALYTICS_VIEWED,
};

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    analyticsPage(location.pathname, { search: location.search });
    const featureEvent = featureEvents[location.pathname];
    if (featureEvent) {
      analyticsTrack(featureEvent, { path: location.pathname });
    }
  }, [location.pathname, location.search]);

  return null;
}
