-- Migration: Add Ping Logs Table
-- Stores history of keep-alive pings for monitoring and debugging

-- Create ping_logs table
CREATE TABLE IF NOT EXISTS ping_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
  success BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for efficient querying by connection
CREATE INDEX IF NOT EXISTS idx_ping_logs_connection_id 
ON ping_logs(connection_id);

-- Create index for efficient querying by time (for cleanup and stats)
CREATE INDEX IF NOT EXISTS idx_ping_logs_created_at 
ON ping_logs(created_at DESC);

-- Create composite index for querying recent pings by connection
CREATE INDEX IF NOT EXISTS idx_ping_logs_connection_recent 
ON ping_logs(connection_id, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE ping_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view ping logs for their own connections
CREATE POLICY "Users can view their ping logs" ON ping_logs
  FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM connections WHERE user_id = auth.uid()
    )
  );

-- Function to clean up old ping logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_ping_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM ping_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE ping_logs IS 'Stores keep-alive ping history for monitoring';
COMMENT ON COLUMN ping_logs.duration_ms IS 'Time taken for the ping in milliseconds';
COMMENT ON COLUMN ping_logs.error_message IS 'Error message if ping failed';




