-- Create admin views for platform metrics (views don't need RLS, access is controlled via functions)
CREATE OR REPLACE VIEW public.platform_metrics AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'shipper') as total_shippers,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'carrier') as total_carriers,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.loads) as total_loads,
  (SELECT COUNT(*) FROM public.loads WHERE status = 'in_transit') as active_loads,
  (SELECT COUNT(*) FROM public.loads WHERE status = 'completed') as completed_loads,
  (SELECT COUNT(*) FROM public.payments WHERE status = 'disputed') as active_disputes,
  (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM public.carriers WHERE verification_status = 'pending') as pending_verifications;

-- Create security definer function to get platform metrics (admin only)
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN (SELECT row_to_json(platform_metrics.*) FROM public.platform_metrics);
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);