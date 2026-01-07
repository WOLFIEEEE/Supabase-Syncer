-- ============================================================================
-- Security Events Table
-- ============================================================================
-- Stores security-related events for monitoring and auditing

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

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_security_events_type_severity_time 
  ON security_events(event_type, severity, created_at DESC);

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own security events
CREATE POLICY "Users can view their own security events"
  ON security_events FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert any security event (using service role)
CREATE POLICY "System can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Security Alerts Table
-- ============================================================================
-- Stores security alerts that need attention

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_acknowledged ON security_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- Enable RLS
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own security alerts"
  ON security_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security alerts"
  ON security_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security alerts"
  ON security_alerts FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Automatic Cleanup Function
-- ============================================================================

-- Function to clean up old security events (keep 90 days by default)
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

-- ============================================================================
-- Helper Views
-- ============================================================================

-- View for security event summary by type (last 24 hours)
CREATE OR REPLACE VIEW security_events_summary_24h AS
SELECT 
  event_type,
  severity,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT ip_address) as unique_ips
FROM security_events
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY count DESC;

-- View for failed auth attempts by IP (potential brute force)
CREATE OR REPLACE VIEW potential_brute_force_ips AS
SELECT 
  ip_address,
  COUNT(*) as attempt_count,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM security_events
WHERE event_type = 'auth_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) >= 5
ORDER BY attempt_count DESC;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE security_events IS 'Stores security-related events for monitoring and auditing';
COMMENT ON TABLE security_alerts IS 'Stores security alerts that need attention';
COMMENT ON VIEW security_events_summary_24h IS 'Summary of security events in the last 24 hours';
COMMENT ON VIEW potential_brute_force_ips IS 'IPs with multiple failed auth attempts in the last hour';

