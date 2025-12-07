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