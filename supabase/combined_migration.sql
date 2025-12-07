-- Combined migrations for Supabase
-- Generated: 2025-12-04T18:25:56.625Z
-- Total migrations: 22


-- ========================================
-- Migration: 20251107011634_3ad60020-c2aa-42e2-9de9-20d5ff3b0f4f.sql
-- ========================================

-- Create user roles enum and tables
CREATE TYPE public.app_role AS ENUM ('admin', 'shipper', 'carrier');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  role public.app_role,
  company_name TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'site',
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Newsletter public insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);


-- ========================================
-- Migration: 20251107040902_2b413ab8-1216-4231-8a06-0b73bcaa99ba.sql
-- ========================================

-- Create security definer function to check user roles
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add RLS policies to user_roles table
-- Allow users to view their own roles
CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins manage all roles" ON public.user_roles
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add INSERT policy to profiles table so users can create their profile during registration
CREATE POLICY "Users create own profile" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);


-- ========================================
-- Migration: 20251107041641_96c38903-0e48-4f77-bcc0-4a5221bae202.sql
-- ========================================

-- Add SELECT policy to newsletter_subscribers table to prevent email harvesting
-- Only admins can view subscriber emails
CREATE POLICY "Only admins view subscribers" ON public.newsletter_subscribers
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));


-- ========================================
-- Migration: 20251109184606_b9ac53de-3126-4a06-ab5d-9702fa0541a0.sql
-- ========================================

-- Create enum types for various statuses
CREATE TYPE load_status AS ENUM (
  'draft',
  'posted',
  'bidding',
  'booked',
  'in_transit',
  'delivered',
  'completed',
  'cancelled'
);

CREATE TYPE bid_status AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'countered',
  'expired'
);

CREATE TYPE equipment_type AS ENUM (
  'dry_van',
  'reefer',
  'flatbed',
  'step_deck',
  'lowboy',
  'tanker',
  'box_truck',
  'power_only'
);

CREATE TYPE document_type AS ENUM (
  'pod',
  'bol',
  'rate_confirmation',
  'insurance',
  'mc_authority',
  'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'held_in_escrow',
  'released',
  'completed',
  'failed',
  'disputed'
);

CREATE TYPE verification_status AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

-- Carriers table
CREATE TABLE public.carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  mc_number TEXT,
  dot_number TEXT,
  insurance_expiry DATE,
  insurance_amount DECIMAL(12,2),
  equipment_types equipment_type[] DEFAULT '{}',
  service_areas TEXT[] DEFAULT '{}',
  verification_status verification_status DEFAULT 'unverified',
  capacity INTEGER DEFAULT 1,
  rating DECIMAL(3,2) DEFAULT 0,
  total_loads INTEGER DEFAULT 0,
  on_time_percentage DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Loads table
CREATE TABLE public.loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipper_id UUID NOT NULL REFERENCES auth.users(id),
  carrier_id UUID REFERENCES auth.users(id),
  origin_address TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  origin_state TEXT NOT NULL,
  origin_zip TEXT NOT NULL,
  origin_lat DECIMAL(10,8),
  origin_lng DECIMAL(11,8),
  destination_address TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  destination_state TEXT NOT NULL,
  destination_zip TEXT NOT NULL,
  destination_lat DECIMAL(10,8),
  destination_lng DECIMAL(11,8),
  pickup_date DATE NOT NULL,
  delivery_date DATE NOT NULL,
  equipment_type equipment_type NOT NULL,
  weight DECIMAL(10,2),
  length DECIMAL(6,2),
  width DECIMAL(6,2),
  height DECIMAL(6,2),
  commodity TEXT,
  special_requirements TEXT,
  posted_rate DECIMAL(10,2),
  booked_rate DECIMAL(10,2),
  distance_miles DECIMAL(8,2),
  status load_status DEFAULT 'draft',
  ai_confidence_score DECIMAL(5,2),
  source_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES auth.users(id),
  bid_amount DECIMAL(10,2) NOT NULL,
  status bid_status DEFAULT 'pending',
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(load_id, carrier_id)
);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  document_type document_type NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tracking updates table
CREATE TABLE public.tracking_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  carrier_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL,
  location_address TEXT,
  location_city TEXT,
  location_state TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  shipper_id UUID NOT NULL REFERENCES auth.users(id),
  carrier_id UUID NOT NULL REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status payment_status DEFAULT 'pending',
  escrow_held_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dispute_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carriers
CREATE POLICY "Carriers can view their own profile"
  ON public.carriers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Carriers can insert their own profile"
  ON public.carriers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Carriers can update their own profile"
  ON public.carriers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Shippers can view verified carriers"
  ON public.carriers FOR SELECT
  USING (verification_status = 'verified');

-- RLS Policies for loads
CREATE POLICY "Shippers can view their own loads"
  ON public.loads FOR SELECT
  USING (auth.uid() = shipper_id);

CREATE POLICY "Carriers can view posted loads"
  ON public.loads FOR SELECT
  USING (status IN ('posted', 'bidding'));

CREATE POLICY "Assigned carriers can view their loads"
  ON public.loads FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Shippers can create loads"
  ON public.loads FOR INSERT
  WITH CHECK (auth.uid() = shipper_id);

CREATE POLICY "Shippers can update their own loads"
  ON public.loads FOR UPDATE
  USING (auth.uid() = shipper_id);

CREATE POLICY "Shippers can delete their own loads"
  ON public.loads FOR DELETE
  USING (auth.uid() = shipper_id AND status IN ('draft', 'posted'));

-- RLS Policies for bids
CREATE POLICY "Carriers can view their own bids"
  ON public.bids FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Shippers can view bids on their loads"
  ON public.bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loads
      WHERE loads.id = bids.load_id
      AND loads.shipper_id = auth.uid()
    )
  );

CREATE POLICY "Carriers can create bids"
  ON public.bids FOR INSERT
  WITH CHECK (auth.uid() = carrier_id);

CREATE POLICY "Carriers can update their own bids"
  ON public.bids FOR UPDATE
  USING (auth.uid() = carrier_id AND status = 'pending');

CREATE POLICY "Shippers can update bids on their loads"
  ON public.bids FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.loads
      WHERE loads.id = bids.load_id
      AND loads.shipper_id = auth.uid()
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Load participants can view load documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loads
      WHERE loads.id = documents.load_id
      AND (loads.shipper_id = auth.uid() OR loads.carrier_id = auth.uid())
    )
  );

CREATE POLICY "Users can upload documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages they sent"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view messages sent to them"
  ON public.messages FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- RLS Policies for tracking_updates
CREATE POLICY "Carriers can create tracking updates"
  ON public.tracking_updates FOR INSERT
  WITH CHECK (auth.uid() = carrier_id);

CREATE POLICY "Carriers can view their tracking updates"
  ON public.tracking_updates FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Shippers can view tracking for their loads"
  ON public.tracking_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.loads
      WHERE loads.id = tracking_updates.load_id
      AND loads.shipper_id = auth.uid()
    )
  );

-- RLS Policies for payments
CREATE POLICY "Shippers can view their payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = shipper_id);

CREATE POLICY "Carriers can view their payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = carrier_id);

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loads_updated_at
  BEFORE UPDATE ON public.loads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('carrier-documents', 'carrier-documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Load participants can view load documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1 FROM public.documents
      JOIN public.loads ON loads.id = documents.load_id
      WHERE documents.file_url = storage.objects.name
      AND (loads.shipper_id = auth.uid() OR loads.carrier_id = auth.uid())
    )
  );

-- Storage policies for carrier-documents bucket
CREATE POLICY "Carriers can upload their documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'carrier-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Carriers can view their documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'carrier-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all carrier documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'carrier-documents' AND
    public.has_role(auth.uid(), 'admin')
  );

-- Create indexes for performance
CREATE INDEX idx_loads_shipper_id ON public.loads(shipper_id);
CREATE INDEX idx_loads_carrier_id ON public.loads(carrier_id);
CREATE INDEX idx_loads_status ON public.loads(status);
CREATE INDEX idx_loads_pickup_date ON public.loads(pickup_date);
CREATE INDEX idx_bids_load_id ON public.bids(load_id);
CREATE INDEX idx_bids_carrier_id ON public.bids(carrier_id);
CREATE INDEX idx_messages_load_id ON public.messages(load_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_tracking_load_id ON public.tracking_updates(load_id);
CREATE INDEX idx_payments_load_id ON public.payments(load_id);
CREATE INDEX idx_carriers_user_id ON public.carriers(user_id);
CREATE INDEX idx_carriers_verification_status ON public.carriers(verification_status);


-- ========================================
-- Migration: 20251109190407_2ba83b0b-f5d4-44ec-b00c-f2bd902d3368.sql
-- ========================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;


-- ========================================
-- Migration: 20251109190705_ccb2421b-94c1-42e6-8ebb-d222488a0a3e.sql
-- ========================================

-- Add version tracking to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_document_id uuid REFERENCES public.documents(id),
ADD COLUMN IF NOT EXISTS rejected_reason text,
ADD COLUMN IF NOT EXISTS approved_by uuid,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Update RLS policies for document approval
CREATE POLICY "Admins can approve documents"
ON public.documents
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster version lookups
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON public.documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_documents_load_id ON public.documents(load_id);


-- ========================================
-- Migration: 20251109201327_4ced2c5c-270a-449f-9205-a1dbfcfaf358.sql
-- ========================================

-- Create admin views for platform metrics (views don't need RLS, access is controlled via functions)
CREATE OR REPLACE VIEW public.platform_metrics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'shipper') as total_shippers,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'carrier') as total_carriers,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.loads) as total_loads,
  (SELECT COUNT(*) FROM public.loads WHERE status = 'in_transit') as active_loads,
  (SELECT COUNT(*) FROM public.loads WHERE status = 'completed') as completed_loads,
  (SELECT COUNT(*) FROM public.payments WHERE status = 'disputed') as active_disputes,
  (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM public.carriers WHERE verification_status = 'pending') as pending_verifications;

-- Create security definer function to get platform metrics (admin only)
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN (SELECT row_to_json(platform_metrics.*) FROM public.platform_metrics);
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);


-- ========================================
-- Migration: 20251109201352_93ec7ed9-27ac-4267-8a68-edd94d26d5d4.sql
-- ========================================

-- Create admin views for platform metrics (views don't need RLS, access is controlled via functions)
CREATE OR REPLACE VIEW public.platform_metrics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'shipper') as total_shippers,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'carrier') as total_carriers,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.loads) as total_loads,
  (SELECT COUNT(*) FROM public.loads WHERE status = 'in_transit') as active_loads,
  (SELECT COUNT(*) FROM public.loads WHERE status = 'completed') as completed_loads,
  (SELECT COUNT(*) FROM public.payments WHERE status = 'disputed') as active_disputes,
  (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM public.carriers WHERE verification_status = 'pending') as pending_verifications;

-- Create security definer function to get platform metrics (admin only)
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN (SELECT row_to_json(platform_metrics.*) FROM public.platform_metrics);
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);


-- ========================================
-- Migration: 20251109201834_8d29dffc-cb69-4186-9cda-70cfd930d945.sql
-- ========================================

-- Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.platform_metrics;

-- Create a secure function that gets metrics without exposing auth.users
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics json;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Build metrics without exposing auth.users directly
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_shippers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'shipper'),
    'total_carriers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'carrier'),
    'total_admins', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'),
    'total_loads', (SELECT COUNT(*) FROM public.loads),
    'active_loads', (SELECT COUNT(*) FROM public.loads WHERE status = 'in_transit'),
    'completed_loads', (SELECT COUNT(*) FROM public.loads WHERE status = 'completed'),
    'active_disputes', (SELECT COUNT(*) FROM public.payments WHERE status = 'disputed'),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed'),
    'pending_verifications', (SELECT COUNT(*) FROM public.carriers WHERE verification_status = 'pending')
  ) INTO metrics;

  RETURN metrics;
END;
$$;


-- ========================================
-- Migration: 20251109210515_88913c4a-3900-4963-accc-e71e8bd71a2a.sql
-- ========================================

-- Fix function search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;


-- ========================================
-- Migration: 20251109231818_62eaedd8-6815-4663-87b8-a3229f8e9d32.sql
-- ========================================

-- Create subscriptions table to track user subscription status
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_product_id TEXT,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('shipper', 'carrier')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  seats INTEGER NOT NULL DEFAULT 1 CHECK (seats >= 1 AND seats <= 100),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (via edge functions)
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ========================================
-- Migration: 20251109235545_5e5b947b-9162-4e72-b4db-aefbdff5cc03.sql
-- ========================================

-- Enable realtime for subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Create subscription analytics function
CREATE OR REPLACE FUNCTION public.get_subscription_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  analytics json;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'total_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status IN ('active', 'trialing')),
    'active_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
    'trial_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trialing'),
    'canceled_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE cancel_at_period_end = true),
    'past_due_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'past_due'),
    'shipper_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE plan_type = 'shipper' AND status IN ('active', 'trialing')),
    'carrier_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE plan_type = 'carrier' AND status IN ('active', 'trialing')),
    'monthly_revenue', (
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.billing_cycle = 'monthly' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN 189 * s.seats
              WHEN s.plan_type = 'carrier' THEN 49 * s.seats
              ELSE 0
            END
          WHEN s.billing_cycle = 'annual' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN (1814.40 * s.seats) / 12
              WHEN s.plan_type = 'carrier' THEN (470.40 * s.seats) / 12
              ELSE 0
            END
          ELSE 0
        END
      ), 0)
      FROM public.subscriptions s
      WHERE s.status IN ('active', 'trialing')
    ),
    'annual_revenue', (
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.billing_cycle = 'monthly' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN 189 * s.seats * 12
              WHEN s.plan_type = 'carrier' THEN 49 * s.seats * 12
              ELSE 0
            END
          WHEN s.billing_cycle = 'annual' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN 1814.40 * s.seats
              WHEN s.plan_type = 'carrier' THEN 470.40 * s.seats
              ELSE 0
            END
          ELSE 0
        END
      ), 0)
      FROM public.subscriptions s
      WHERE s.status IN ('active', 'trialing')
    ),
    'total_seats', (SELECT COALESCE(SUM(seats), 0) FROM public.subscriptions WHERE status IN ('active', 'trialing')),
    'avg_seats_per_subscription', (
      SELECT COALESCE(AVG(seats), 0) 
      FROM public.subscriptions 
      WHERE status IN ('active', 'trialing')
    )
  ) INTO analytics;

  RETURN analytics;
END;
$function$;


-- ========================================
-- Migration: 20251110001052_a2983627-eaf8-404e-91eb-4fb04d06d86a.sql
-- ========================================

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


-- ========================================
-- Migration: 20251110003914_40467ecf-cfd4-466f-b348-48533da43a64.sql
-- ========================================

-- Add performance indexes for production scale
-- Loads table indexes
CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX IF NOT EXISTS idx_loads_carrier_id ON loads(carrier_id) WHERE carrier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_shipper_id ON loads(shipper_id);
CREATE INDEX IF NOT EXISTS idx_loads_equipment_type ON loads(equipment_type);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_load_id ON messages(load_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Bids table indexes
CREATE INDEX IF NOT EXISTS idx_bids_load_id_status ON bids(load_id, status);
CREATE INDEX IF NOT EXISTS idx_bids_carrier_id ON bids(carrier_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at DESC);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_shipper_status ON payments(shipper_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_carrier_status ON payments(carrier_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_load_id ON payments(load_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Enable realtime for loads table
ALTER PUBLICATION supabase_realtime ADD TABLE loads;


-- ========================================
-- Migration: 20251110023139_c3d84541-d57f-4f85-b623-423ae6134872.sql
-- ========================================

-- Create function to expire old bids
CREATE OR REPLACE FUNCTION public.expire_old_bids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.bids
  SET status = 'rejected'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$function$;

-- Create function to auto-release old payments
CREATE OR REPLACE FUNCTION public.auto_release_old_payments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_record RECORD;
  payment_ids uuid[] := ARRAY[]::uuid[];
  payment_count int := 0;
BEGIN
  -- Find payments that should be auto-released
  -- (in escrow for 7+ days after delivery)
  FOR payment_record IN
    SELECT p.id, p.load_id
    FROM public.payments p
    INNER JOIN public.loads l ON l.id = p.load_id
    WHERE p.status = 'escrow'
    AND l.status = 'delivered'
    AND p.escrow_held_at < (now() - interval '7 days')
  LOOP
    payment_ids := array_append(payment_ids, payment_record.id);
    payment_count := payment_count + 1;
  END LOOP;

  RETURN json_build_object(
    'payment_ids', payment_ids,
    'count', payment_count
  );
END;
$function$;


-- ========================================
-- Migration: 20251124003513_83ada341-6fdb-4c66-b212-2bf3fd7530d3.sql
-- ========================================

-- Add facility name columns to loads table
ALTER TABLE loads ADD COLUMN origin_facility_name TEXT;
ALTER TABLE loads ADD COLUMN destination_facility_name TEXT;


-- ========================================
-- Migration: 20251124003937_758a9e3f-18ee-4ba6-8ba5-8f117661ad6c.sql
-- ========================================

-- Add temperature and load_number columns to loads table
ALTER TABLE loads ADD COLUMN temperature_min NUMERIC;
ALTER TABLE loads ADD COLUMN temperature_max NUMERIC;
ALTER TABLE loads ADD COLUMN load_number SERIAL UNIQUE;

-- Create index for load_number for faster lookups
CREATE INDEX idx_loads_load_number ON loads(load_number);


-- ========================================
-- Migration: 20251124004319_5240d641-2d32-4b45-b894-3fb214516aa0.sql
-- ========================================

-- Add tracking_url column to bids table
ALTER TABLE bids ADD COLUMN tracking_url TEXT;

-- Add check constraint to ensure tracking_url is a valid URL format if provided
ALTER TABLE bids ADD CONSTRAINT bids_tracking_url_format CHECK (
  tracking_url IS NULL OR 
  tracking_url ~* '^https?://.*'
);


-- ========================================
-- Migration: 20251124004918_cc943722-8fab-4ad2-b586-1cf40dfeb93f.sql
-- ========================================

-- Phase 5: Messaging & Scalability Improvements

-- 1. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver_created ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_load_created ON public.messages(load_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_bids_load_carrier ON public.bids(load_id, carrier_id);
CREATE INDEX IF NOT EXISTS idx_bids_carrier_status ON public.bids(carrier_id, status);
CREATE INDEX IF NOT EXISTS idx_loads_shipper_status ON public.loads(shipper_id, status);
CREATE INDEX IF NOT EXISTS idx_loads_carrier_status ON public.loads(carrier_id, status);

-- 2. Drop existing messaging RLS policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages sent to them" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages they sent" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages they received" ON public.messages;

-- 3. Create new RLS policies that restrict messaging to bidders only
-- Shippers can send messages to carriers who have bid on their loads
CREATE POLICY "Shippers can send to bidders"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.loads l
    INNER JOIN public.bids b ON b.load_id = l.id
    WHERE l.id = messages.load_id
    AND l.shipper_id = auth.uid()
    AND b.carrier_id = messages.receiver_id
  )
);

-- Carriers can send messages to shippers whose loads they've bid on
CREATE POLICY "Carriers can send to load owners"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.loads l
    INNER JOIN public.bids b ON b.load_id = l.id
    WHERE l.id = messages.load_id
    AND b.carrier_id = auth.uid()
    AND l.shipper_id = messages.receiver_id
  )
);

-- Users can view messages they sent (if they're part of the bid relationship)
CREATE POLICY "Users can view their sent messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  AND (
    -- Shipper sent message to bidding carrier
    EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.bids b ON b.load_id = l.id
      WHERE l.id = messages.load_id
      AND l.shipper_id = auth.uid()
      AND b.carrier_id = messages.receiver_id
    )
    OR
    -- Carrier sent message to load owner they bid on
    EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.bids b ON b.load_id = l.id
      WHERE l.id = messages.load_id
      AND b.carrier_id = auth.uid()
      AND l.shipper_id = messages.receiver_id
    )
  )
);

-- Users can view messages sent to them (if they're part of the bid relationship)
CREATE POLICY "Users can view their received messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = receiver_id
  AND (
    -- Shipper received message from bidding carrier
    EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.bids b ON b.load_id = l.id
      WHERE l.id = messages.load_id
      AND l.shipper_id = auth.uid()
      AND b.carrier_id = messages.sender_id
    )
    OR
    -- Carrier received message from load owner
    EXISTS (
      SELECT 1 FROM public.loads l
      INNER JOIN public.bids b ON b.load_id = l.id
      WHERE l.id = messages.load_id
      AND b.carrier_id = auth.uid()
      AND l.shipper_id = messages.sender_id
    )
  )
);

-- Users can mark their received messages as read
CREATE POLICY "Users can update received messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);


-- ========================================
-- Migration: 20251124010511_9a5c10e4-e36d-4961-a81a-3bbb7687ea36.sql
-- ========================================

-- Create ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID REFERENCES public.loads(id) ON DELETE CASCADE NOT NULL,
  carrier_id UUID NOT NULL,
  shipper_id UUID NOT NULL,
  overall_rating NUMERIC(3,2) CHECK (overall_rating >= 1 AND overall_rating <= 5) NOT NULL,
  on_time BOOLEAN NOT NULL,
  communication_rating NUMERIC(3,2) CHECK (communication_rating >= 1 AND communication_rating <= 5),
  condition_rating NUMERIC(3,2) CHECK (condition_rating >= 1 AND condition_rating <= 5),
  professionalism_rating NUMERIC(3,2) CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(load_id, shipper_id)
);

-- Create indexes for performance
CREATE INDEX idx_ratings_carrier_id ON public.ratings(carrier_id);
CREATE INDEX idx_ratings_created_at ON public.ratings(created_at DESC);
CREATE INDEX idx_ratings_load_id ON public.ratings(load_id);

-- Enable Row Level Security
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Shippers can create ratings for their completed loads
CREATE POLICY "Shippers can create ratings for their loads"
ON public.ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = shipper_id AND
  EXISTS (
    SELECT 1 FROM public.loads 
    WHERE loads.id = load_id 
    AND loads.shipper_id = auth.uid()
    AND loads.status = 'completed'
  )
);

-- RLS Policy: Everyone can view ratings (public trust factor)
CREATE POLICY "Anyone can view ratings"
ON public.ratings
FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Admins can manage all ratings
CREATE POLICY "Admins can manage ratings"
ON public.ratings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update carrier stats when rating is submitted
CREATE OR REPLACE FUNCTION public.update_carrier_stats_on_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.carriers SET
    rating = (
      SELECT ROUND(AVG(overall_rating)::numeric, 2) 
      FROM public.ratings 
      WHERE carrier_id = NEW.carrier_id
    ),
    on_time_percentage = (
      SELECT ROUND((COUNT(*) FILTER (WHERE on_time = true) * 100.0 / NULLIF(COUNT(*), 0))::numeric, 2)
      FROM public.ratings 
      WHERE carrier_id = NEW.carrier_id
    ),
    total_loads = (
      SELECT COUNT(*) 
      FROM public.ratings 
      WHERE carrier_id = NEW.carrier_id
    ),
    updated_at = NOW()
  WHERE user_id = NEW.carrier_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update carrier stats
CREATE TRIGGER trigger_update_carrier_stats_on_rating
AFTER INSERT OR UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_carrier_stats_on_rating();

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON public.ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- ========================================
-- Migration: 20251124011439_22bb29a4-36f5-4de6-a971-03ce692321ad.sql
-- ========================================

-- Add notification preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bid_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS load_update_notifications BOOLEAN DEFAULT true;


-- ========================================
-- Migration: 20251124013612_097f90ab-0f6a-4f65-bb18-0099c00e1130.sql
-- ========================================

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

