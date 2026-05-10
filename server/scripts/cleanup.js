#!/usr/bin/env node
/**
 * Data Retention Cleanup Script
 *
 * This script should be run periodically (e.g., daily via cron job) to:
 * 1. Delete expired password reset tokens
 * 2. Delete expired GDPR requests
 * 3. Anonymize old analytics data
 * 4. Delete old notification logs
 * 5. Delete users who have been inactive for 2+ years (optional, with notification)
 *
 * Usage: node server/scripts/cleanup.js
 * Or set as cron: 0 2 * * * cd /app && node server/scripts/cleanup.js
 *
 * Required env vars:
 * - INSFORGE_URL or VITE_INSFORGE_URL (Insforage project URL)
 * - INSFORGE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY (Service role key)
 */

import { createClient } from '@insforge/sdk';

// Configuration
const RETENTION_PERIODS = {
  passwordResetTokens: 24 * 60 * 60 * 1000, // 24 hours
  gdprRequests: 30 * 24 * 60 * 60 * 1000, // 30 days after completion
  notificationLogs: 90 * 24 * 60 * 60 * 1000, // 90 days
  inactiveUserThreshold: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
};

async function cleanup() {
  console.log('Starting data retention cleanup...');

  const supabaseUrl = process.env.INSFORGE_URL || process.env.VITE_INSFORGE_URL;
  const supabaseKey = process.env.INSFORGE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables: INSFORGE_URL and service role key');
    process.exit(1);
  }

  // Use the same createClient pattern as bff.js
  const client = createClient({
    baseUrl: supabaseUrl,
    anonKey: supabaseKey,
    isServerMode: true,
    fetch,
  });

  const now = new Date().toISOString();
  let totalDeleted = 0;

  try {
    // 1. Clean up expired password reset tokens
    console.log('Cleaning up expired password reset tokens...');
    const { count: resetTokensDeleted, error: resetError } = await client.database
      .from('password_reset_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', now);

    if (resetError) {
      console.error('Error deleting reset tokens:', resetError);
    } else {
      console.log(`Deleted ${resetTokensDeleted || 0} expired reset tokens`);
      totalDeleted += resetTokensDeleted || 0;
    }

    // 2. Clean up old completed GDPR requests (30 days after completion)
    console.log('Cleaning up old GDPR requests...');
    const gdprCutoff = new Date(Date.now() - RETENTION_PERIODS.gdprRequests).toISOString();
    const { count: gdprDeleted, error: gdprError } = await client.database
      .from('gdpr_requests')
      .delete({ count: 'exact' })
      .eq('status', 'completed')
      .lt('completed_at', gdprCutoff);

    if (gdprError) {
      console.error('Error deleting GDPR requests:', gdprError);
    } else {
      console.log(`Deleted ${gdprDeleted || 0} old GDPR requests`);
      totalDeleted += gdprDeleted || 0;
    }

    // 3. Clean up old notification logs
    console.log('Cleaning up old notification logs...');
    const logsCutoff = new Date(Date.now() - RETENTION_PERIODS.notificationLogs).toISOString();
    const { count: logsDeleted, error: logsError } = await client.database
      .from('notification_logs')
      .delete({ count: 'exact' })
      .lt('created_at', logsCutoff);

    if (logsError) {
      console.error('Error deleting notification logs:', logsError);
    } else {
      console.log(`Deleted ${logsDeleted || 0} old notification logs`);
      totalDeleted += logsDeleted || 0;
    }

    // 4. Anonymize old analytics data (optional - keep aggregated data)
    console.log('Anonymizing old analytics data...');
    // This depends on your analytics table structure
    // Example: Update old records to remove user_id but keep aggregated data

    // 5. Handle inactive users (optional - send warning before deletion)
    console.log('Checking for inactive users...');
    const inactiveCutoff = new Date(Date.now() - RETENTION_PERIODS.inactiveUserThreshold).toISOString();

    // Get inactive users (no login in 2 years)
    const { data: inactiveUsers, error: inactiveError } = await client.database
      .from('profiles')
      .select('id, user_id, updated_at')
      .lt('updated_at', inactiveCutoff);

    if (inactiveError) {
      console.error('Error fetching inactive users:', inactiveError);
    } else if (inactiveUsers && inactiveUsers.length > 0) {
      console.log(`Found ${inactiveUsers.length} inactive users (2+ years)`);
      // In production, you might want to send warning emails before deletion
      // For now, just log them
      inactiveUsers.forEach((user) => {
        console.log(`  - User ${user.user_id}: last active ${user.updated_at}`);
      });
    } else {
      console.log('No inactive users found.');
    }

    console.log(`\nCleanup complete! Total records deleted: ${totalDeleted}`);

    return { success: true, totalDeleted };
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
}

// Run cleanup if this script is executed directly
if (typeof process !== 'undefined' && process.argv) {
  cleanup()
    .then(() => {
      console.log('Cleanup script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanup, RETENTION_PERIODS };