-- =========================================
-- Sync Improvements Migration
-- =========================================
-- This migration adds tables for:
-- 1. Sync backups (for rollback capability)
-- 2. Sync metrics (for observability)
-- 3. Idempotency tracking (for retry safety)
-- =========================================

-- =========================================
-- SYNC BACKUPS TABLE
-- =========================================
-- Stores metadata about backups created before sync operations
-- Actual backup content is stored in Supabase Storage

CREATE TABLE IF NOT EXISTS sync_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  target_connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
  tables TEXT[] NOT NULL DEFAULT '{}',
  backup_path TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  row_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'creating' CHECK (status IN ('creating', 'completed', 'restoring', 'restored', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  restored_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Indexes for sync_backups
CREATE INDEX IF NOT EXISTS idx_sync_backups_user_id ON sync_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_backups_sync_job_id ON sync_backups(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_backups_status ON sync_backups(status);
CREATE INDEX IF NOT EXISTS idx_sync_backups_created_at ON sync_backups(created_at);

-- RLS for sync_backups
ALTER TABLE sync_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups" ON sync_backups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups" ON sync_backups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backups" ON sync_backups
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups" ON sync_backups
  FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- SYNC METRICS TABLE
-- =========================================
-- Stores historical metrics for sync jobs
-- Used for analytics, dashboards, and performance tracking

CREATE TABLE IF NOT EXISTS sync_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Duration metrics
  duration_ms INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Performance metrics
  rows_per_second NUMERIC(10, 2),
  bytes_per_second NUMERIC(15, 2),
  avg_batch_time_ms INTEGER,
  
  -- Table metrics
  tables_processed INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  inserted_rows INTEGER DEFAULT 0,
  updated_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  
  -- Error metrics
  error_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  
  -- Table-level breakdown (JSON)
  table_metrics JSONB DEFAULT '[]'::jsonb,
  
  -- System metrics
  peak_memory_mb NUMERIC(10, 2),
  connection_count INTEGER,
  
  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for sync_metrics
CREATE INDEX IF NOT EXISTS idx_sync_metrics_user_id ON sync_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_sync_job_id ON sync_metrics(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_created_at ON sync_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_metrics_status ON sync_metrics(status);

-- RLS for sync_metrics
ALTER TABLE sync_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics" ON sync_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own metrics" ON sync_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics" ON sync_metrics
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- SYNC TRACES TABLE
-- =========================================
-- Stores distributed tracing data for sync operations
-- Allows detailed debugging and performance analysis

CREATE TABLE IF NOT EXISTS sync_traces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Span details
  operation_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Tags and metadata
  tags JSONB DEFAULT '{}'::jsonb,
  logs JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'error')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for sync_traces
CREATE INDEX IF NOT EXISTS idx_sync_traces_trace_id ON sync_traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_sync_traces_sync_job_id ON sync_traces(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_traces_user_id ON sync_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_traces_created_at ON sync_traces(created_at);

-- RLS for sync_traces
ALTER TABLE sync_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own traces" ON sync_traces
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own traces" ON sync_traces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own traces" ON sync_traces
  FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- IDEMPOTENCY TRACKING TABLE
-- =========================================
-- Tracks processed rows to ensure idempotent retries
-- Acts as backup to Redis-based tracking

CREATE TABLE IF NOT EXISTS sync_idempotency (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_job_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  batch_id TEXT,
  operation TEXT CHECK (operation IN ('insert', 'update', 'skip')),
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Composite unique constraint
  CONSTRAINT unique_sync_row UNIQUE (sync_job_id, table_name, row_id)
);

-- Indexes for sync_idempotency
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_job_id ON sync_idempotency(sync_job_id);
CREATE INDEX IF NOT EXISTS idx_sync_idempotency_processed_at ON sync_idempotency(processed_at);

-- Cleanup function for old idempotency records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sync_idempotency
  WHERE processed_at < NOW() - INTERVAL '24 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Function to get sync metrics summary for a user
CREATE OR REPLACE FUNCTION get_sync_metrics_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_syncs BIGINT,
  successful_syncs BIGINT,
  failed_syncs BIGINT,
  total_rows_synced BIGINT,
  avg_duration_ms NUMERIC,
  avg_rows_per_second NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_syncs,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as successful_syncs,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_syncs,
    COALESCE(SUM(total_rows), 0)::BIGINT as total_rows_synced,
    COALESCE(AVG(duration_ms), 0)::NUMERIC as avg_duration_ms,
    COALESCE(AVG(rows_per_second), 0)::NUMERIC as avg_rows_per_second
  FROM sync_metrics
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old backups
CREATE OR REPLACE FUNCTION cleanup_old_backups(p_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Mark as deleted (soft delete)
  UPDATE sync_backups
  SET deleted_at = NOW()
  WHERE deleted_at IS NULL
    AND created_at < NOW() - (p_days || ' days')::INTERVAL
    AND status IN ('completed', 'restored', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- STORAGE BUCKET (run manually in Supabase dashboard)
-- =========================================
-- Note: Storage bucket creation must be done via Supabase dashboard or API
-- Bucket name: sync-backups
-- Public: false
-- Allowed MIME types: text/plain, application/sql
-- File size limit: 100MB

-- To create via SQL (if using supabase CLI):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('sync-backups', 'sync-backups', false)
-- ON CONFLICT (id) DO NOTHING;

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON TABLE sync_backups IS 'Stores metadata for sync backups used for rollback capability';
COMMENT ON TABLE sync_metrics IS 'Stores historical metrics for sync job performance tracking';
COMMENT ON TABLE sync_traces IS 'Stores distributed tracing data for debugging and analysis';
COMMENT ON TABLE sync_idempotency IS 'Tracks processed rows to ensure idempotent sync retries';

COMMENT ON FUNCTION cleanup_old_idempotency_records() IS 'Removes idempotency records older than 24 hours';
COMMENT ON FUNCTION get_sync_metrics_summary(UUID, INTEGER) IS 'Returns aggregate sync metrics for a user';
COMMENT ON FUNCTION cleanup_old_backups(INTEGER) IS 'Soft deletes backups older than specified days';

