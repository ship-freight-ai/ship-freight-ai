-- Add columns for instant payout tracking
ALTER TABLE carrier_payouts 
ADD COLUMN IF NOT EXISTS stripe_payout_id TEXT,
ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'standard';

-- Add comment for clarity
COMMENT ON COLUMN carrier_payouts.payout_method IS 'Either "instant" or "standard" - indicates payout speed';
COMMENT ON COLUMN carrier_payouts.stripe_payout_id IS 'Stripe Payout ID for instant payouts';
