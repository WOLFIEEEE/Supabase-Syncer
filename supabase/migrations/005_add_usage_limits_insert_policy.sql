-- ============================================
-- Add INSERT policy for usage_limits
-- ============================================
-- This allows users to create their own usage limits record
-- when they first use the system

-- Policy: Users can insert their own usage limits
CREATE POLICY "Users can insert their own usage limits"
    ON usage_limits FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Also add INSERT policy for email_notifications (if needed)
CREATE POLICY "System can insert email notifications for users"
    ON email_notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for usage_history (for system to archive usage)
CREATE POLICY "System can insert usage history for users"
    ON usage_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);


