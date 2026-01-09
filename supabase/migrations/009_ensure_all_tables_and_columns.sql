-- ============================================================================
-- Comprehensive Migration: Ensure All Tables and Columns Exist
-- ============================================================================
-- This migration ensures all required tables, columns, and indexes exist
-- Run this in your Supabase SQL Editor to fix any missing schema elements
-- Database: postgresql://postgres.vrlggbwwwnhglbyzqpop:6IemATqdKQjEJ777@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENSURE CONNECTIONS TABLE HAS ALL REQUIRED COLUMNS
-- ============================================================================

-- Create connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    encrypted_url TEXT NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('production', 'development')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add keep_alive column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connections' AND column_name = 'keep_alive'
    ) THEN
        ALTER TABLE connections 
        ADD COLUMN keep_alive BOOLEAN DEFAULT false NOT NULL;
        
        RAISE NOTICE 'Added keep_alive column to connections table';
    ELSE
        RAISE NOTICE 'keep_alive column already exists in connections table';
    END IF;
END $$;

-- Add last_pinged_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connections' AND column_name = 'last_pinged_at'
    ) THEN
        ALTER TABLE connections 
        ADD COLUMN last_pinged_at TIMESTAMPTZ;
        
        RAISE NOTICE 'Added last_pinged_at column to connections table';
    ELSE
        RAISE NOTICE 'last_pinged_at column already exists in connections table';
    END IF;
END $$;

-- Create indexes for connections table
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_keep_alive 
    ON connections(keep_alive) 
    WHERE keep_alive = true;

-- Add comments
COMMENT ON COLUMN connections.keep_alive IS 'When true, database will be pinged periodically to prevent Supabase from pausing it';
COMMENT ON COLUMN connections.last_pinged_at IS 'Timestamp of the last successful keep-alive ping';

-- ============================================================================
-- 2. ENSURE SYNC_JOBS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    target_connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('one_way', 'two_way')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused')),
    tables_config JSONB NOT NULL DEFAULT '[]',
    progress JSONB DEFAULT NULL,
    checkpoint JSONB DEFAULT NULL,
    started_at TIMESTAMPTZ DEFAULT NULL,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

-- ============================================================================
-- 3. ENSURE SYNC_LOGS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_job_id ON sync_logs(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- ============================================================================
-- 4. ENSURE SECURITY_EVENTS TABLE EXISTS (FOR LOGGING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  method VARCHAR(10),
  details JSONB,
  request_id VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity_time 
  ON security_events(event_type, severity, created_at DESC);

-- ============================================================================
-- 5. ENSURE SECURITY_ALERTS TABLE EXISTS (FOR LOGGING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  title TEXT NOT NULL,
  description TEXT,
  details JSONB,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- ============================================================================
-- 6. ENSURE PING_LOGS TABLE EXISTS (FOR LOGGING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ping_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
  success BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ping_logs_connection_id ON ping_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_ping_logs_created_at ON ping_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ping_logs_connection_recent 
  ON ping_logs(connection_id, created_at DESC);

-- ============================================================================
-- 7. ENSURE USER_SESSIONS TABLE EXISTS (FOR LOGGING)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_session_token UNIQUE (session_token)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- 8. ENSURE USAGE_LIMITS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    max_connections INTEGER NOT NULL DEFAULT 5,
    max_sync_jobs_per_month INTEGER NOT NULL DEFAULT 10,
    max_data_transfer_mb_per_month INTEGER NOT NULL DEFAULT 1000,
    current_connections INTEGER NOT NULL DEFAULT 0,
    current_sync_jobs_this_month INTEGER NOT NULL DEFAULT 0,
    current_data_transfer_mb_this_month NUMERIC(10, 2) NOT NULL DEFAULT 0,
    usage_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON usage_limits(user_id);

-- ============================================================================
-- 9. ENSURE USAGE_HISTORY TABLE EXISTS
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_usage_history_user_id ON usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_period ON usage_history(period_start, period_end);

-- ============================================================================
-- 10. ENSURE USER_SETTINGS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{
        "confirmProductionActions": true,
        "showRowCounts": true,
        "defaultSyncMode": "one_way",
        "defaultConflictStrategy": "source_wins",
        "autoValidateSchema": true,
        "darkMode": true,
        "compactView": false
    }',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- 11. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. CREATE/REPLACE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own connections" ON connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON connections;

-- Connections policies
CREATE POLICY "Users can view their own connections"
    ON connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
    ON connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
    ON connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
    ON connections FOR DELETE
    USING (auth.uid() = user_id);

-- Security events policies
DROP POLICY IF EXISTS "Users can view their own security events" ON security_events;
DROP POLICY IF EXISTS "System can insert security events" ON security_events;

CREATE POLICY "Users can view their own security events"
  ON security_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (true);

-- Security alerts policies
DROP POLICY IF EXISTS "Users can view their own security alerts" ON security_alerts;
DROP POLICY IF EXISTS "Users can update their own security alerts" ON security_alerts;
DROP POLICY IF EXISTS "System can insert security alerts" ON security_alerts;

CREATE POLICY "Users can view their own security alerts"
  ON security_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security alerts"
  ON security_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security alerts"
  ON security_alerts FOR INSERT
  WITH CHECK (true);

-- Ping logs policies
DROP POLICY IF EXISTS "Users can view their ping logs" ON ping_logs;

CREATE POLICY "Users can view their ping logs" ON ping_logs
  FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM connections WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 13. CREATE/REPLACE TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_connections_updated_at ON connections;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
DROP TRIGGER IF EXISTS update_usage_limits_updated_at ON usage_limits;

-- Create triggers
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_limits_updated_at
    BEFORE UPDATE ON usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. CREATE/REPLACE HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up old security events
CREATE OR REPLACE FUNCTION cleanup_old_security_events(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM security_events
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to clean up old ping logs
CREATE OR REPLACE FUNCTION cleanup_old_ping_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ping_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON connections TO authenticated;
GRANT ALL ON sync_jobs TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
GRANT ALL ON security_events TO authenticated;
GRANT ALL ON security_alerts TO authenticated;
GRANT ALL ON ping_logs TO authenticated;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON usage_limits TO authenticated;
GRANT ALL ON usage_history TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- ============================================================================
-- 16. VERIFICATION AND SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
    keep_alive_exists BOOLEAN;
    last_pinged_exists BOOLEAN;
BEGIN
    -- Check if keep_alive column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connections' AND column_name = 'keep_alive'
    ) INTO keep_alive_exists;
    
    -- Check if last_pinged_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'connections' AND column_name = 'last_pinged_at'
    ) INTO last_pinged_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables verified:';
    RAISE NOTICE '  - connections (keep_alive: %, last_pinged_at: %)', 
        CASE WHEN keep_alive_exists THEN 'EXISTS' ELSE 'MISSING' END,
        CASE WHEN last_pinged_exists THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  - sync_jobs';
    RAISE NOTICE '  - sync_logs';
    RAISE NOTICE '  - security_events';
    RAISE NOTICE '  - security_alerts';
    RAISE NOTICE '  - ping_logs';
    RAISE NOTICE '  - user_sessions';
    RAISE NOTICE '  - usage_limits';
    RAISE NOTICE '  - usage_history';
    RAISE NOTICE '  - user_settings';
    RAISE NOTICE '========================================';
    
    IF NOT keep_alive_exists THEN
        RAISE WARNING 'keep_alive column is still missing! Please check the migration.';
    END IF;
    
    IF NOT last_pinged_exists THEN
        RAISE WARNING 'last_pinged_at column is still missing! Please check the migration.';
    END IF;
END $$;

