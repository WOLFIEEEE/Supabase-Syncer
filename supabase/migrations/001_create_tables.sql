-- ============================================
-- Supabase Database Syncer - Initial Schema
-- ============================================
-- Run this in your Supabase SQL Editor to create the required tables
-- Navigate to: Project Dashboard > SQL Editor > New Query

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Connections Table
-- Stores encrypted database connection strings
-- ============================================
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    encrypted_url TEXT NOT NULL,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('production', 'development')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);

-- ============================================
-- 2. Sync Jobs Table
-- Tracks synchronization jobs and their status
-- ============================================
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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user_id ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at DESC);

-- ============================================
-- 3. Sync Logs Table
-- Stores detailed logs for each sync job
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL CHECK (level IN ('info', 'warn', 'error')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sync_logs_job_id ON sync_logs(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- ============================================
-- 4. User Settings Table
-- Stores user preferences
-- ============================================
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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- Users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

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

-- Sync Jobs policies
CREATE POLICY "Users can view their own sync jobs"
    ON sync_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync jobs"
    ON sync_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync jobs"
    ON sync_jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync jobs"
    ON sync_jobs FOR DELETE
    USING (auth.uid() = user_id);

-- Sync Logs policies (access via job ownership)
CREATE POLICY "Users can view logs for their own sync jobs"
    ON sync_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sync_jobs 
            WHERE sync_jobs.id = sync_logs.sync_job_id 
            AND sync_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for their own sync jobs"
    ON sync_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sync_jobs 
            WHERE sync_jobs.id = sync_logs.sync_job_id 
            AND sync_jobs.user_id = auth.uid()
        )
    );

-- User Settings policies
CREATE POLICY "Users can view their own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
    ON user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Service Role Access (for system operations)
-- ============================================
-- Note: The service_role key bypasses RLS, so the application
-- can perform admin operations when needed.

-- Grant permissions to authenticated users
GRANT ALL ON connections TO authenticated;
GRANT ALL ON sync_jobs TO authenticated;
GRANT ALL ON sync_logs TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Database schema created successfully!';
    RAISE NOTICE 'Tables created: connections, sync_jobs, sync_logs, user_settings';
    RAISE NOTICE 'Row Level Security enabled on all tables';
END $$;


