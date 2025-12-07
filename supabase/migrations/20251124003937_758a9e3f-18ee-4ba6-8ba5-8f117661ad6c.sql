-- Add temperature and load_number columns to loads table
ALTER TABLE loads ADD COLUMN temperature_min NUMERIC;
ALTER TABLE loads ADD COLUMN temperature_max NUMERIC;
ALTER TABLE loads ADD COLUMN load_number SERIAL UNIQUE;

-- Create index for load_number for faster lookups
CREATE INDEX idx_loads_load_number ON loads(load_number);