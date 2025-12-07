-- Add notification preferences to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bid_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS load_update_notifications BOOLEAN DEFAULT true;