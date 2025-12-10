-- Add new columns to loads table
ALTER TABLE "public"."loads" 
ADD COLUMN "is_public" boolean DEFAULT true,
ADD COLUMN "pickup_ref" text,
ADD COLUMN "requires_eld" boolean DEFAULT false;

-- Comment on columns
COMMENT ON COLUMN "public"."loads"."is_public" IS 'Whether the load is visible on the public load board';
COMMENT ON COLUMN "public"."loads"."pickup_ref" IS 'Private pickup reference number visible only to shipper and booked carrier';
COMMENT ON COLUMN "public"."loads"."requires_eld" IS 'Whether ELD tracking is mandatory for this load';
