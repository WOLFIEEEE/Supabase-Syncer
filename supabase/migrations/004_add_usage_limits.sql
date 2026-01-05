-- ============================================
-- Usage Limits and Tracking
-- ============================================

-- Usage limits table - stores user usage limits and current usage
CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Limits
    max_connections INTEGER NOT NULL DEFAULT 5,
    max_sync_jobs_per_month INTEGER NOT NULL DEFAULT 10,
    max_data_transfer_mb_per_month INTEGER NOT NULL DEFAULT 1000,
    -- Current usage (resets monthly)
    current_connections INTEGER NOT NULL DEFAULT 0,
    current_sync_jobs_this_month INTEGER NOT NULL DEFAULT 0,
    current_data_transfer_mb_this_month NUMERIC(10, 2) NOT NULL DEFAULT 0,
    -- Tracking period
    usage_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Settings
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON usage_limits(user_id);

-- Usage history table - tracks historical usage for analytics
CREATE TABLE IF NOT EXISTS usage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    total_connections INTEGER NOT NULL DEFAULT 0,
    total_sync_jobs INTEGER NOT NULL DEFAULT 0,
    total_data_transfer_mb NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_usage_history_user_id ON usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_period ON usage_history(period_start, period_end);

-- Email notifications log - tracks sent emails
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'sync_started', 'sync_completed', 'sync_failed', 'usage_warning', 'limit_reached'
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at ON email_notifications(sent_at DESC);

-- RLS Policies
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Usage limits policies
CREATE POLICY "Users can view their own usage limits"
    ON usage_limits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage limits settings"
    ON usage_limits FOR UPDATE
    USING (auth.uid() = user_id);

-- System can insert/update usage (via service role)
-- Note: Application will use service role for tracking usage

-- Usage history policies
CREATE POLICY "Users can view their own usage history"
    ON usage_history FOR SELECT
    USING (auth.uid() = user_id);

-- Email notifications policies
CREATE POLICY "Users can view their own email notifications"
    ON email_notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Function to reset monthly usage (can be called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
    -- Archive current month's usage
    INSERT INTO usage_history (
        user_id,
        period_start,
        period_end,
        total_connections,
        total_sync_jobs,
        total_data_transfer_mb
    )
    SELECT 
        user_id,
        usage_period_start,
        NOW(),
        current_connections,
        current_sync_jobs_this_month,
        current_data_transfer_mb_this_month
    FROM usage_limits
    WHERE usage_period_start < date_trunc('month', NOW());
    
    -- Reset current usage
    UPDATE usage_limits
    SET 
        current_sync_jobs_this_month = 0,
        current_data_transfer_mb_this_month = 0,
        usage_period_start = date_trunc('month', NOW()),
        updated_at = NOW()
    WHERE usage_period_start < date_trunc('month', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment sync job count
CREATE OR REPLACE FUNCTION increment_sync_job_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE usage_limits
    SET 
        current_sync_jobs_this_month = current_sync_jobs_this_month + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- If no row exists, create one
    IF NOT FOUND THEN
        INSERT INTO usage_limits (
            user_id,
            max_connections,
            max_sync_jobs_per_month,
            max_data_transfer_mb_per_month,
            current_connections,
            current_sync_jobs_this_month,
            current_data_transfer_mb_this_month,
            usage_period_start,
            email_notifications_enabled
        )
        VALUES (
            p_user_id,
            5,  -- default max connections
            10, -- default max sync jobs per month
            1000, -- default max data transfer MB per month
            0,
            1,  -- increment to 1
            0,
            date_trunc('month', NOW()),
            true
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON usage_limits TO authenticated;
GRANT ALL ON usage_history TO authenticated;
GRANT ALL ON email_notifications TO authenticated;

