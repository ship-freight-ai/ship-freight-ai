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