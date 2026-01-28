/**
 * Email Notification Service
 * Sends email notifications to users for important events
 * Supports Resend (recommended), SendGrid, or logging
 */

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { logger } from '@/lib/services/logger';

export type EmailNotificationType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'usage_warning'
  | 'limit_reached'
  | 'welcome';

export interface EmailNotificationData {
  userId: string;
  userEmail: string;
  type: EmailNotificationType;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Initialize email service client (Resend)
 */
function getEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Send email notification
 * Uses Resend if configured, otherwise logs to console
 */
export async function sendEmailNotification(data: EmailNotificationData): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Check if user has email notifications enabled
    const { data: limits } = await supabase
      .from('usage_limits')
      .select('email_notifications_enabled')
      .eq('user_id', data.userId)
      .single();

    if (limits && !(limits as { email_notifications_enabled?: boolean }).email_notifications_enabled) {
      logger.info('Email notifications disabled for user', { userId: data.userId });
      return false;
    }

    const resend = getEmailClient();
    const fromEmail = process.env.EMAIL_FROM || 'noreply@suparbase.com';

    if (resend) {
      // Send actual email via Resend
      try {
        await resend.emails.send({
          from: fromEmail,
          to: data.userEmail,
          subject: data.subject,
          text: data.body,
        });

        logger.info('Email sent', { type: data.type, userEmail: data.userEmail, subject: data.subject });

        // Log success
        await (supabase as any)
          .from('email_notifications')
          .insert({
            user_id: data.userId,
            type: data.type,
            subject: data.subject,
            body: data.body,
            status: 'sent',
          });

        return true;
      } catch (emailError) {
        logger.error('Error sending email via Resend', { error: emailError });
        throw emailError;
      }
    } else {
      // Fallback: Log to console (email service not configured)
      logger.info('Email logged (service not configured)', { type: data.type, userEmail: data.userEmail, subject: data.subject });
      logger.info('Email body', { body: data.body });
      logger.warn('Email service not configured. Set RESEND_API_KEY to send actual emails.');

      // Log as "logged" status
      await (supabase as any)
        .from('email_notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          subject: data.subject,
          body: data.body,
          status: 'logged',
        });

      return true;
    }
  } catch (error) {
    logger.error('Error sending email notification', { error });

    // Log failure
    try {
      const supabase = await createClient();
      await (supabase as any)
        .from('email_notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          subject: data.subject,
          body: data.body,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        });
    } catch (logError) {
      logger.error('Error logging failed email', { error: logError });
    }

    return false;
  }
}

/**
 * Send sync started notification
 */
export async function notifySyncStarted(
  userId: string,
  userEmail: string,
  syncJobId: string,
  sourceName: string,
  targetName: string
): Promise<void> {
  await sendEmailNotification({
    userId,
    userEmail,
    type: 'sync_started',
    subject: `Sync Started: ${sourceName} → ${targetName}`,
    body: `Your database sync has started.\n\nSource: ${sourceName}\nTarget: ${targetName}\nJob ID: ${syncJobId}\n\nYou'll receive another email when the sync completes.`,
    metadata: { syncJobId, sourceName, targetName },
  });
}

/**
 * Send sync completed notification
 */
export async function notifySyncCompleted(
  userId: string,
  userEmail: string,
  syncJobId: string,
  sourceName: string,
  targetName: string,
  stats: {
    totalRows: number;
    insertedRows: number;
    updatedRows: number;
    duration: number;
  }
): Promise<void> {
  const durationMinutes = Math.floor(stats.duration / 60000);
  const durationSeconds = Math.floor((stats.duration % 60000) / 1000);
  
  await sendEmailNotification({
    userId,
    userEmail,
    type: 'sync_completed',
    subject: `Sync Completed: ${sourceName} → ${targetName}`,
    body: `Your database sync has completed successfully!\n\nSource: ${sourceName}\nTarget: ${targetName}\nJob ID: ${syncJobId}\n\nResults:\n- Total rows processed: ${stats.totalRows}\n- Rows inserted: ${stats.insertedRows}\n- Rows updated: ${stats.updatedRows}\n- Duration: ${durationMinutes}m ${durationSeconds}s`,
    metadata: { syncJobId, sourceName, targetName, stats },
  });
}

/**
 * Send sync failed notification
 */
export async function notifySyncFailed(
  userId: string,
  userEmail: string,
  syncJobId: string,
  sourceName: string,
  targetName: string,
  error: string
): Promise<void> {
  await sendEmailNotification({
    userId,
    userEmail,
    type: 'sync_failed',
    subject: `Sync Failed: ${sourceName} → ${targetName}`,
    body: `Your database sync has failed.\n\nSource: ${sourceName}\nTarget: ${targetName}\nJob ID: ${syncJobId}\n\nError: ${error}\n\nPlease check the sync logs in the dashboard for more details.`,
    metadata: { syncJobId, sourceName, targetName, error },
  });
}

/**
 * Send usage warning notification
 */
export async function notifyUsageWarning(
  userId: string,
  userEmail: string,
  warningType: 'connections' | 'sync_jobs' | 'data_transfer',
  currentUsage: number,
  limit: number,
  percentage: number
): Promise<void> {
  const typeLabels = {
    connections: 'Connection',
    sync_jobs: 'Sync Job',
    data_transfer: 'Data Transfer',
  };
  
  await sendEmailNotification({
    userId,
    userEmail,
    type: 'usage_warning',
    subject: `Usage Warning: ${typeLabels[warningType]} Limit`,
    body: `You're approaching your ${typeLabels[warningType].toLowerCase()} limit.\n\nCurrent usage: ${currentUsage} / ${limit} (${percentage.toFixed(0)}%)\n\nConsider upgrading your plan if you need higher limits.`,
    metadata: { warningType, currentUsage, limit, percentage },
  });
}

/**
 * Send limit reached notification
 */
export async function notifyLimitReached(
  userId: string,
  userEmail: string,
  limitType: 'connections' | 'sync_jobs' | 'data_transfer',
  limit: number
): Promise<void> {
  const typeLabels = {
    connections: 'Connection',
    sync_jobs: 'Sync Job',
    data_transfer: 'Data Transfer',
  };
  
  await sendEmailNotification({
    userId,
    userEmail,
    type: 'limit_reached',
    subject: `${typeLabels[limitType]} Limit Reached`,
    body: `You've reached your ${typeLabels[limitType].toLowerCase()} limit of ${limit}.\n\nTo continue using suparbase, please:\n1. Delete unused connections/sync jobs, or\n2. Upgrade your plan for higher limits.\n\nYour limits reset at the start of each month.`,
    metadata: { limitType, limit },
  });
}

/**
 * Send welcome email
 */
export async function notifyWelcome(userId: string, userEmail: string, userName?: string): Promise<void> {
  await sendEmailNotification({
    userId,
    userEmail,
    type: 'welcome',
    subject: 'Welcome to suparbase!',
    body: `Welcome to suparbase${userName ? `, ${userName}` : ''}!\n\nYou're all set to start syncing your Supabase databases. Here's what you can do:\n\n1. Add your database connections\n2. Create your first sync job\n3. Keep your databases alive with the keep-alive service\n\nNeed help? Check out our guide at https://suparbase.com/guide\n\nHappy syncing!`,
    metadata: { userName },
  });
}

