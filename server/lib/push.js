import webpush from 'web-push';

// VAPID keys - generate once and store in env vars
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

// In-memory store for push subscriptions (use database in production)
const pushSubscriptions = new Map(); // key: userId, value: { subscription, lastUsed }

// Clean up old subscriptions every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, sub] of pushSubscriptions.entries()) {
    if (now - sub.lastUsed > 30 * 24 * 60 * 60 * 1000) { // 30 days inactive
      pushSubscriptions.delete(userId);
    }
  }
}, 60 * 60 * 1000);

// Initialize web-push with VAPID keys
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@anqor.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[Push] VAPID keys not set. Push notifications disabled.');
  // Generate keys for development (don't do this in production)
  if (process.env.NODE_ENV !== 'production') {
    const vapidKeys = webpush.generateVAPIDKeys();
    console.log('[Push] Generated VAPID keys for development:');
    console.log('  VAPID_PUBLIC_KEY:', vapidKeys.publicKey);
    console.log('  VAPID_PRIVATE_KEY:', vapidKeys.privateKey);
    webpush.setVapidDetails(
      'mailto:noreply@anqor.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  }
}

/**
 * Store a push subscription for a user
 */
export function storePushSubscription(userId, subscription) {
  pushSubscriptions.set(userId, {
    subscription,
    lastUsed: Date.now(),
  });
  // TODO: Persist to database (push_subscriptions table)
  return true;
}

/**
 * Remove push subscription for a user
 */
export function removePushSubscription(userId) {
  pushSubscriptions.delete(userId);
  // TODO: Remove from database
  return true;
}

/**
 * Get push subscription for a user
 */
function getPushSubscription(userId) {
  const sub = pushSubscriptions.get(userId);
  if (sub) {
    sub.lastUsed = Date.now();
    return sub.subscription;
  }
  return null;
}

/**
 * Send push notification with duplicate prevention
 * @param {string} userId - Target user ID
 * @param {Object} payload - Notification payload { title, body, url, icon }
 * @param {string} idempotencyKey - Unique key to prevent duplicates
 * @returns {Promise<Object>} - Result
 */
export async function sendPushNotification(userId, payload, idempotencyKey) {
  // Check for duplicate
  if (idempotencyKey && hasSentNotification(idempotencyKey)) {
    console.log(`[Push] Duplicate notification blocked: ${idempotencyKey}`);
    return { success: true, duplicate: true };
  }

  const subscription = getPushSubscription(userId);
  if (!subscription) {
    return { success: false, error: 'No push subscription found' };
  }

  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    // Record sent notification
    if (idempotencyKey) {
      recordSentNotification(idempotencyKey);
    }

    return { success: true, result };
  } catch (error) {
    console.error('[Push] Failed to send notification:', error);

    // Handle expired/invalid subscription (graceful failure)
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`[Push] Subscription expired for user ${userId}. Removing.`);
      removePushSubscription(userId);
      return { success: false, error: 'Subscription expired', removed: true };
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send notification to multiple users
 */
export async function sendPushNotificationToUsers(userIds, payload, idempotencyKeyPrefix) {
  const results = [];
  for (const userId of userIds) {
    const idempotencyKey = `${idempotencyKeyPrefix}:${userId}`;
    const result = await sendPushNotification(userId, payload, idempotencyKey);
    results.push({ userId, ...result });
  }
  return results;
}

// In-memory store for sent notifications (idempotency)
// In production, use a database table (notification_logs)
const sentNotificationKeys = new Map(); // key: idempotencyKey, value: timestamp

function hasSentNotification(key) {
  return sentNotificationKeys.has(key);
}

function recordSentNotification(key) {
  sentNotificationKeys.set(key, Date.now());
  // Clean up after 24 hours
  setTimeout(() => sentNotificationKeys.delete(key), 24 * 60 * 60 * 1000);
}

/**
 * Get VAPID public key (for client-side subscription)
 */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY || webpush.generateVAPIDKeys().publicKey;
}

/**
 * Check if push notifications are enabled
 */
export function isPushEnabled() {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) || process.env.NODE_ENV !== 'production';
}
