-- Migration: Add Keep-Alive Feature
-- This adds columns to track keep-alive status for database connections
-- to prevent Supabase free tier databases from being paused due to inactivity

-- Add keep_alive column (default false)
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS keep_alive BOOLEAN DEFAULT false NOT NULL;

-- Add last_pinged_at column to track when database was last pinged
ALTER TABLE connections 
ADD COLUMN IF NOT EXISTS last_pinged_at TIMESTAMPTZ;

-- Create index for efficient querying of connections needing pings
CREATE INDEX IF NOT EXISTS idx_connections_keep_alive 
ON connections(keep_alive) 
WHERE keep_alive = true;

-- Comment for documentation
COMMENT ON COLUMN connections.keep_alive IS 'When true, database will be pinged periodically to prevent Supabase from pausing it';
COMMENT ON COLUMN connections.last_pinged_at IS 'Timestamp of the last successful keep-alive ping';



