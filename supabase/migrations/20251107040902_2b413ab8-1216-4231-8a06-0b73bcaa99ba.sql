-- Create security definer function to check user roles
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add RLS policies to user_roles table
-- Allow users to view their own roles
CREATE POLICY "Users view own roles" ON public.user_roles
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins manage all roles" ON public.user_roles
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add INSERT policy to profiles table so users can create their profile during registration
CREATE POLICY "Users create own profile" ON public.profiles
FOR INSERT 
WITH CHECK (auth.uid() = user_id);