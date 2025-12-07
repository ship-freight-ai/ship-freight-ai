-- Create invite status enum
CREATE TYPE invite_status AS ENUM ('pending', 'claimed', 'expired', 'revoked');

-- Create team_invites table
CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  invite_token TEXT UNIQUE NOT NULL,
  email TEXT,
  seats_allocated INTEGER NOT NULL DEFAULT 1,
  seats_claimed INTEGER NOT NULL DEFAULT 0,
  status invite_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID
);

-- Create indexes for performance
CREATE INDEX idx_team_invites_token ON public.team_invites(invite_token);
CREATE INDEX idx_team_invites_subscription ON public.team_invites(subscription_id);
CREATE INDEX idx_team_invites_status ON public.team_invites(status);

-- Enable RLS on team_invites
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invites
CREATE POLICY "Users can view invites for their subscription"
ON public.team_invites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE subscriptions.id = team_invites.subscription_id
    AND subscriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view invite by token"
ON public.team_invites
FOR SELECT
USING (true);

CREATE POLICY "Subscription owners can create invites"
ON public.team_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE subscriptions.id = team_invites.subscription_id
    AND subscriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Subscription owners can update their invites"
ON public.team_invites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE subscriptions.id = team_invites.subscription_id
    AND subscriptions.user_id = auth.uid()
  )
);

CREATE POLICY "Service role can update invites for claims"
ON public.team_invites
FOR UPDATE
USING (auth.role() = 'service_role');

-- Add seats_used to subscriptions
ALTER TABLE public.subscriptions ADD COLUMN seats_used INTEGER NOT NULL DEFAULT 0;

-- Add subscription tracking to profiles
ALTER TABLE public.profiles ADD COLUMN subscription_id UUID REFERENCES public.subscriptions(id);
ALTER TABLE public.profiles ADD COLUMN claimed_via_invite UUID REFERENCES public.team_invites(id);

-- Create function to auto-expire invites
CREATE OR REPLACE FUNCTION public.expire_old_invites()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.team_invites
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$;