-- Add Stripe Connect fields to carriers table
ALTER TABLE public.carriers
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted BOOLEAN DEFAULT false;

-- Create table for tracking platform transfers
CREATE TABLE IF NOT EXISTS public.carrier_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID NOT NULL REFERENCES public.carriers(user_id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  carrier_amount_cents INTEGER NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.carrier_payouts ENABLE ROW LEVEL SECURITY;

-- Carriers can view their own payouts
CREATE POLICY "Carriers can view own payouts"
ON public.carrier_payouts
FOR SELECT
USING (
  carrier_id IN (
    SELECT user_id FROM public.carriers WHERE user_id = auth.uid()
  )
);

-- Shippers can view payouts for their loads
CREATE POLICY "Shippers can view payouts for their loads"
ON public.carrier_payouts
FOR SELECT
USING (
  payment_id IN (
    SELECT id FROM public.payments WHERE shipper_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_carrier_payouts_updated_at
BEFORE UPDATE ON public.carrier_payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_carrier_payouts_carrier_id ON public.carrier_payouts(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_payouts_payment_id ON public.carrier_payouts(payment_id);
CREATE INDEX IF NOT EXISTS idx_carriers_connect_account ON public.carriers(stripe_connect_account_id);