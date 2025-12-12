-- Add Velvet Rope vetting columns to carriers table
-- These columns store the CarrierOK/FMCSA verification data

ALTER TABLE carriers ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS dba_name TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS authority_status TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS original_grant_date DATE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS authority_age_years NUMERIC;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS reported_truck_count INT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS safety_rating TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS insurance_agent_email TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS recent_contact_changes BOOLEAN DEFAULT FALSE;

-- Verification timestamps
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS fmcsa_verified_at TIMESTAMPTZ;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS bank_verified_at TIMESTAMPTZ;

-- Onboarding progress tracking
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS onboarding_stage TEXT DEFAULT 'identity' 
  CHECK (onboarding_stage IN ('identity', 'email_verification', 'financials', 'review', 'completed'));
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS rejection_reasons TEXT[];

-- Address fields
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS address_state TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS address_zip TEXT;

-- Index for MC number lookups
CREATE INDEX IF NOT EXISTS idx_carriers_mc_number ON carriers(mc_number);

-- Comments for documentation
COMMENT ON COLUMN carriers.authority_age_years IS 'Calculated years since original_grant_date';
COMMENT ON COLUMN carriers.reported_truck_count IS 'Number of power units from FMCSA/CarrierOK';
COMMENT ON COLUMN carriers.safety_rating IS 'SATISFACTORY, NONE, or UNSATISFACTORY';
COMMENT ON COLUMN carriers.recent_contact_changes IS 'True if contact info changed < 30 days ago (fraud risk)';
COMMENT ON COLUMN carriers.onboarding_stage IS 'Current step in Velvet Rope onboarding';
