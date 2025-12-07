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