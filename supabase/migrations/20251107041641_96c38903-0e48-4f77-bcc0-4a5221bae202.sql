-- Add SELECT policy to newsletter_subscribers table to prevent email harvesting
-- Only admins can view subscriber emails
CREATE POLICY "Only admins view subscribers" ON public.newsletter_subscribers
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));