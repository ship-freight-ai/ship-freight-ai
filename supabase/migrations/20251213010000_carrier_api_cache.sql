-- API Cache table for CarrierOK responses
-- Minimizes API calls by caching results for 24 hours

CREATE TABLE IF NOT EXISTS carrier_api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT UNIQUE NOT NULL, -- MC-123456 or DOT-1234567
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('mc', 'dot')),
  response_data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by identifier
CREATE INDEX IF NOT EXISTS idx_carrier_api_cache_identifier ON carrier_api_cache(identifier);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_carrier_api_cache_expires ON carrier_api_cache(expires_at);

-- Enable RLS
ALTER TABLE carrier_api_cache ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read cache (reduces duplicate API calls)
CREATE POLICY "Anyone can read carrier cache"
  ON carrier_api_cache FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update cache
CREATE POLICY "Service role can manage cache"
  ON carrier_api_cache FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE carrier_api_cache IS 'Cache for CarrierOK API responses to minimize billable API calls';
COMMENT ON COLUMN carrier_api_cache.identifier IS 'MC-123456 or DOT-1234567 format';
COMMENT ON COLUMN carrier_api_cache.expires_at IS 'Cache expires after 24 hours';
