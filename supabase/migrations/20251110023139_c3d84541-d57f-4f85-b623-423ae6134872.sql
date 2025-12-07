-- Create function to expire old bids
CREATE OR REPLACE FUNCTION public.expire_old_bids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.bids
  SET status = 'rejected'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$function$;

-- Create function to auto-release old payments
CREATE OR REPLACE FUNCTION public.auto_release_old_payments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  payment_record RECORD;
  payment_ids uuid[] := ARRAY[]::uuid[];
  payment_count int := 0;
BEGIN
  -- Find payments that should be auto-released
  -- (in escrow for 7+ days after delivery)
  FOR payment_record IN
    SELECT p.id, p.load_id
    FROM public.payments p
    INNER JOIN public.loads l ON l.id = p.load_id
    WHERE p.status = 'escrow'
    AND l.status = 'delivered'
    AND p.escrow_held_at < (now() - interval '7 days')
  LOOP
    payment_ids := array_append(payment_ids, payment_record.id);
    payment_count := payment_count + 1;
  END LOOP;

  RETURN json_build_object(
    'payment_ids', payment_ids,
    'count', payment_count
  );
END;
$function$;