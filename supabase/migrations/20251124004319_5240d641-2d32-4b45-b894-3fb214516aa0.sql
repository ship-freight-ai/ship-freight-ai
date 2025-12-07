-- Add tracking_url column to bids table
ALTER TABLE bids ADD COLUMN tracking_url TEXT;

-- Add check constraint to ensure tracking_url is a valid URL format if provided
ALTER TABLE bids ADD CONSTRAINT bids_tracking_url_format CHECK (
  tracking_url IS NULL OR 
  tracking_url ~* '^https?://.*'
);