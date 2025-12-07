-- Add facility name columns to loads table
ALTER TABLE loads ADD COLUMN origin_facility_name TEXT;
ALTER TABLE loads ADD COLUMN destination_facility_name TEXT;