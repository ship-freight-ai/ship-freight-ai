-- Drop the restrictive policy
DROP POLICY IF EXISTS "Shippers can delete their own loads" ON public.loads;

-- Create a new permissive policy
CREATE POLICY "Shippers can delete their own loads"
  ON public.loads FOR DELETE
  USING (auth.uid() = shipper_id);
