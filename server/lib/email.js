import { Resend } from 'resend';
import * as templates from './email-templates.js';

// In-memory store for sent notifications (idempotency)
// In production, use a database table (notification_logs)
const sentNotifications = new Map(); // key: idempotencyKey, value: { timestamp, response }

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of sentNotifications.entries()) {
    if (now - entry.timestamp > 24 * 60 * 60 * 1000) { // Keep for 24 hours
      sentNotifications.delete(key);
    }
  }
}, 60 * 60 * 1000);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

if (!resend) {
  console.warn('[Email] RESEND_API_KEY not set. Using mock email service.');
}

/**
 * Send email with idempotency key to prevent duplicates
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.idempotencyKey - Unique key to prevent duplicates
 * @param {boolean} options.isMarketing - Whether this is a marketing email (requires unsubscribe)
 * @returns {Promise<Object>} - Result with success flag
 */
export async function sendEmail({ to, subject, html, text, idempotencyKey, isMarketing = false }) {
  // Check for duplicate (idempotency)
  if (idempotencyKey && sentNotifications.has(idempotencyKey)) {
    console.log(`[Email] Duplicate notification blocked: ${idempotencyKey}`);
    return { success: true, duplicate: true, message: 'Already sent' };
  }

  // Check if user is unsubscribed (for marketing emails)
  if (isMarketing && await isUnsubscribed(to)) {
    console.log(`[Email] User ${to} is unsubscribed. Skipping marketing email.`);
    return { success: true, unsubscribed: true };
  }

  const from = process.env.RESEND_FROM_EMAIL || 'Anqor <noreply@anqor.com>';
  const emailData = { from, to, subject, html, text };

  try {
    let result;
    if (resend) {
      result = await resend.emails.send(emailData);
      if (result.error) throw new Error(result.error.message);
    } else {
      // Mock service for development
      console.log('[Mock Email] Sending email:');
      console.log('  To:', to);
      console.log('  Subject:', subject);
      console.log('  From:', from);
      result = { id: `mock_${Date.now()}` };
    }

    // Store idempotency key to prevent duplicates
    if (idempotencyKey) {
      sentNotifications.set(idempotencyKey, {
        timestamp: Date.now(),
        result,
      });
    }

    return { success: true, id: result.id, duplicate: false };
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    // Graceful failure - don't throw, return error
    return { success: false, error: error.message };
  }
}

/**
 * Check if a user is unsubscribed from marketing emails
 * In production, check a database table (user_preferences)
 */
async function isUnsubscribed(email) {
  // TODO: Implement database check
  // For now, return false (no one unsubscribed)
  return false;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email, resetUrl, name) {
  const template = templates.getPasswordResetEmail(resetUrl, name);
  const idempotencyKey = `password_reset:${email}:${Date.now()}`;
  return sendEmail({
    to: email,
    ...template,
    idempotencyKey,
    isMarketing: false, // Transactional email
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email, name) {
  const template = templates.getWelcomeEmail(name, email);
  const idempotencyKey = `welcome:${email}`;
  return sendEmail({
    to: email,
    ...template,
    idempotencyKey,
    isMarketing: true,
  });
}

/**
 * Send claim alert email
 */
export async function sendClaimAlertEmail(email, name, claimId, prediction, riskScore) {
  const template = templates.getClaimAlertEmail(name, claimId, prediction, riskScore);
  const idempotencyKey = `claim_alert:${claimId}:${email}`;
  return sendEmail({
    to: email,
    ...template,
    idempotencyKey,
    isMarketing: false, // Transactional
  });
}

/**
 * Store notification log (for database persistence)
 * In production, insert into notification_logs table
 */
export function logNotification({ type, recipient, subject, idempotencyKey, status, error }) {
  // TODO: Insert into database
  console.log(`[Notification Log] ${type} to ${recipient}: ${status}`);
}

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendClaimAlertEmail,
  logNotification,
};
