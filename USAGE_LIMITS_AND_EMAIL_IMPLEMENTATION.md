# Usage Limits and Email Notifications Implementation

## Overview

This document describes the implementation of usage limits and email notifications for suparbase.

## Features Implemented

### 1. Usage Limits System

#### Database Schema
- **Table**: `usage_limits` - Tracks user limits and current usage
- **Table**: `usage_history` - Historical usage data for analytics
- **Migration**: `supabase/migrations/004_add_usage_limits.sql`

#### Default Limits (Beta Phase)
- **Connections**: 5 per user
- **Sync Jobs**: 10 per month
- **Data Transfer**: 1000 MB (1 GB) per month

#### Service
- **File**: `lib/services/usage-limits.ts`
- Functions:
  - `getUserUsageLimits()` - Get or create usage limits for user
  - `checkConnectionLimit()` - Check if user can create connection
  - `checkSyncJobLimit()` - Check if user can create sync job
  - `checkDataTransferLimit()` - Check if data transfer is allowed
  - `incrementSyncJobCount()` - Increment sync job counter
  - `incrementDataTransfer()` - Track data transfer
  - `updateConnectionCount()` - Update connection count

#### API Integration
- **Connections API** (`app/api/connections/route.ts`):
  - Checks connection limit before creating
  - Updates connection count on create/delete
  
- **Sync API** (`app/api/sync/route.ts`):
  - Checks sync job limit before creating
  - Increments sync job count on creation

- **Usage API** (`app/api/usage/route.ts`):
  - GET endpoint to fetch current usage statistics
  - Returns usage percentages and warnings

### 2. Email Notifications System

#### Database Schema
- **Table**: `email_notifications` - Logs all sent emails
- Tracks: type, subject, body, status, error messages

#### Service
- **File**: `lib/services/email-notifications.ts`
- Functions:
  - `sendEmailNotification()` - Base email sending function
  - `notifySyncStarted()` - Sync job started
  - `notifySyncCompleted()` - Sync job completed successfully
  - `notifySyncFailed()` - Sync job failed
  - `notifyUsageWarning()` - Approaching usage limit
  - `notifyLimitReached()` - Usage limit reached
  - `notifyWelcome()` - Welcome email for new users

#### Email Types
1. **sync_started** - When a sync job begins
2. **sync_completed** - When a sync job completes successfully
3. **sync_failed** - When a sync job fails
4. **usage_warning** - When approaching usage limits (80%+)
5. **limit_reached** - When a usage limit is reached
6. **welcome** - Welcome email for new users

#### Integration Points
- **Sync Start** (`app/api/sync/route.ts`): Sends email when sync job is created
- **Sync Complete/Fail** (`app/api/sync/[id]/start/route.ts`): Sends email on completion or failure

## Database Migration

Run the migration in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/004_add_usage_limits.sql
```

This creates:
- `usage_limits` table
- `usage_history` table
- `email_notifications` table
- RLS policies
- Helper functions

## Configuration

### Default Limits
Currently hardcoded in `lib/services/usage-limits.ts`:
```typescript
const DEFAULT_LIMITS = {
  maxConnections: 5,
  maxSyncJobsPerMonth: 10,
  maxDataTransferMbPerMonth: 1000, // 1GB
};
```

### Email Service
Currently logs emails to database. To enable actual email sending:

1. **Option 1**: Use Supabase's built-in email (configured in Supabase dashboard)
2. **Option 2**: Integrate with Resend, SendGrid, or similar service
3. **Option 3**: Use SMTP directly

Update `lib/services/email-notifications.ts` `sendEmailNotification()` function to integrate with your email provider.

## API Endpoints

### GET /api/usage
Returns current usage statistics for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "connections": { "current": 2, "limit": 5, "percentage": 40 },
      "syncJobs": { "current": 3, "limit": 10, "percentage": 30 },
      "dataTransfer": { "current": 250.5, "limit": 1000, "percentage": 25 }
    },
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-02-01T00:00:00Z"
    },
    "settings": {
      "emailNotificationsEnabled": true
    },
    "warnings": []
  }
}
```

## Usage in Frontend

### Check Usage Limits
```typescript
const response = await fetch('/api/usage');
const { data } = await response.json();
// data.usage contains current usage and limits
// data.warnings contains any approaching limits
```

### Handle Limit Errors
When creating connections or sync jobs, check for 403 status:
```typescript
if (response.status === 403) {
  const { error, usage, limits } = await response.json();
  // Show error message and usage info
}
```

## Monthly Reset

Usage limits reset automatically at the start of each month. The `getUserUsageLimits()` function checks if the period has changed and resets counters.

For manual reset (e.g., via cron), call:
```sql
SELECT reset_monthly_usage();
```

## Future Enhancements

1. **Billing Integration**: Connect usage limits to subscription tiers
2. **Custom Limits**: Allow admins to set custom limits per user
3. **Usage Analytics**: Dashboard showing historical usage trends
4. **Email Templates**: Rich HTML email templates
5. **Webhook Support**: Send webhooks for usage events
6. **Real-time Notifications**: In-app notifications for usage warnings

## Testing

1. **Test Connection Limit**:
   - Create connections until limit is reached
   - Verify error message and usage info

2. **Test Sync Job Limit**:
   - Create sync jobs until monthly limit is reached
   - Verify error message

3. **Test Email Notifications**:
   - Check `email_notifications` table for logged emails
   - Verify email content and metadata

4. **Test Monthly Reset**:
   - Manually update `usage_period_start` to previous month
   - Call `getUserUsageLimits()` and verify reset

## Notes

- Email notifications are currently logged but not actually sent. Integrate with an email service provider to enable actual sending.
- Usage limits are enforced server-side in API routes.
- All usage data is user-scoped and protected by RLS policies.
- Monthly usage resets automatically when period changes.


