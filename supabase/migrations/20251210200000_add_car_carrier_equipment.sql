-- Add car_carrier to equipment_type enum
ALTER TYPE public.equipment_type ADD VALUE IF NOT EXISTS 'car_carrier';

-- Add commodity options for car carrier
COMMENT ON COLUMN loads.equipment_type IS 'Equipment type: dry_van, reefer, flatbed, step_deck, lowboy, tanker, box_truck, power_only, car_carrier';
