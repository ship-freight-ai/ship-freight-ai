-- Enable realtime for subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;

-- Create subscription analytics function
CREATE OR REPLACE FUNCTION public.get_subscription_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  analytics json;
BEGIN
  -- Check if user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'total_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status IN ('active', 'trialing')),
    'active_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'active'),
    'trial_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'trialing'),
    'canceled_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE cancel_at_period_end = true),
    'past_due_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status = 'past_due'),
    'shipper_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE plan_type = 'shipper' AND status IN ('active', 'trialing')),
    'carrier_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE plan_type = 'carrier' AND status IN ('active', 'trialing')),
    'monthly_revenue', (
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.billing_cycle = 'monthly' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN 189 * s.seats
              WHEN s.plan_type = 'carrier' THEN 49 * s.seats
              ELSE 0
            END
          WHEN s.billing_cycle = 'annual' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN (1814.40 * s.seats) / 12
              WHEN s.plan_type = 'carrier' THEN (470.40 * s.seats) / 12
              ELSE 0
            END
          ELSE 0
        END
      ), 0)
      FROM public.subscriptions s
      WHERE s.status IN ('active', 'trialing')
    ),
    'annual_revenue', (
      SELECT COALESCE(SUM(
        CASE 
          WHEN s.billing_cycle = 'monthly' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN 189 * s.seats * 12
              WHEN s.plan_type = 'carrier' THEN 49 * s.seats * 12
              ELSE 0
            END
          WHEN s.billing_cycle = 'annual' THEN 
            CASE 
              WHEN s.plan_type = 'shipper' THEN 1814.40 * s.seats
              WHEN s.plan_type = 'carrier' THEN 470.40 * s.seats
              ELSE 0
            END
          ELSE 0
        END
      ), 0)
      FROM public.subscriptions s
      WHERE s.status IN ('active', 'trialing')
    ),
    'total_seats', (SELECT COALESCE(SUM(seats), 0) FROM public.subscriptions WHERE status IN ('active', 'trialing')),
    'avg_seats_per_subscription', (
      SELECT COALESCE(AVG(seats), 0) 
      FROM public.subscriptions 
      WHERE status IN ('active', 'trialing')
    )
  ) INTO analytics;

  RETURN analytics;
END;
$function$;