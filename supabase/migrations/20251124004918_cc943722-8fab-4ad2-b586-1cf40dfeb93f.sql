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