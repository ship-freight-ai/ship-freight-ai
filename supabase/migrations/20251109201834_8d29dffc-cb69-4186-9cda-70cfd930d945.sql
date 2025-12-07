-- Drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.platform_metrics;

-- Create a secure function that gets metrics without exposing auth.users
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  metrics json;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Build metrics without exposing auth.users directly
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_shippers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'shipper'),
    'total_carriers', (SELECT COUNT(*) FROM public.profiles WHERE role = 'carrier'),
    'total_admins', (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'),
    'total_loads', (SELECT COUNT(*) FROM public.loads),
    'active_loads', (SELECT COUNT(*) FROM public.loads WHERE status = 'in_transit'),
    'completed_loads', (SELECT COUNT(*) FROM public.loads WHERE status = 'completed'),
    'active_disputes', (SELECT COUNT(*) FROM public.payments WHERE status = 'disputed'),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed'),
    'pending_verifications', (SELECT COUNT(*) FROM public.carriers WHERE verification_status = 'pending')
  ) INTO metrics;

  RETURN metrics;
END;
$$;