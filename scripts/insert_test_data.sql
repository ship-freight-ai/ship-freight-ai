-- Insert test user profiles and subscriptions
-- Run this in the Supabase SQL Editor after creating the auth users

-- Shipper profile
INSERT INTO public.profiles (user_id, email, full_name, company_name, role)
VALUES ('96a65e92-cdf6-4052-b444-195f3298241e', 'test-shipper@shipai.com', 'Test Shipper', 'Test Shipping Co', 'shipper')
ON CONFLICT (user_id) DO NOTHING;

-- Shipper subscription (1-year trial, 5 seats)
INSERT INTO public.subscriptions (
  user_id, stripe_customer_id, stripe_subscription_id, plan_type, 
  billing_cycle, seats, status, current_period_start, current_period_end,
  trial_start, trial_end, cancel_at_period_end
)
VALUES (
  '96a65e92-cdf6-4052-b444-195f3298241e',
  'cus_trial_96a65e92',
  'sub_trial_96a65e92',
  'shipper',
  'annual',
  5,
  'trialing',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW() + INTERVAL '1 year',
  false
)
ON CONFLICT (user_id) DO NOTHING;

-- Carrier profile
INSERT INTO public.profiles (user_id, email, full_name, company_name, role)
VALUES ('66bd1e32-82b6-4a90-b4ab-f6fb873295f8', 'test-carrier@shipai.com', 'Test Carrier', 'Test Carrier LLC', 'carrier')
ON CONFLICT (user_id) DO NOTHING;

-- Carrier subscription (1-year trial, 5 seats)
INSERT INTO public.subscriptions (
  user_id, stripe_customer_id, stripe_subscription_id, plan_type, 
  billing_cycle, seats, status, current_period_start, current_period_end,
  trial_start, trial_end, cancel_at_period_end
)
VALUES (
  '66bd1e32-82b6-4a90-b4ab-f6fb873295f8',
  'cus_trial_66bd1e32',
  'sub_trial_66bd1e32',
  'carrier',
  'annual',
  5,
  'trialing',
  NOW(),
  NOW() + INTERVAL '1 year',
  NOW(),
  NOW() + INTERVAL '1 year',
  false
)
ON CONFLICT (user_id) DO NOTHING;

-- Carrier company profile
INSERT INTO public.carriers (
  user_id, company_name, dot_number, mc_number, equipment_types,
  service_areas, capacity, rating, total_loads, on_time_percentage,
  verification_status, insurance_amount, insurance_expiry
)
VALUES (
  '66bd1e32-82b6-4a90-b4ab-f6fb873295f8',
  'Test Carrier LLC',
  '123456',
  'MC123456',
  ARRAY['dry_van', 'reefer', 'flatbed']::equipment_type[],
  ARRAY['CA', 'NV', 'AZ', 'TX'],
  10,
  5.0,
  0,
  100,
  'verified',
  1000000,
  (NOW() + INTERVAL '1 year')::date
)
ON CONFLICT (user_id) DO NOTHING;

-- Verify the data
SELECT 'Profiles created:' as status, COUNT(*) as count FROM public.profiles;
SELECT 'Subscriptions created:' as status, COUNT(*) as count FROM public.subscriptions;
SELECT 'Carriers created:' as status, COUNT(*) as count FROM public.carriers;
