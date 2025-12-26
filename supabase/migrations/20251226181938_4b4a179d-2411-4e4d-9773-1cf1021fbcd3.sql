-- Fix compliance_frameworks RLS - ensure only authenticated users can access
-- First drop any existing policies that might allow public access
DROP POLICY IF EXISTS "Only authenticated users can view compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Anyone can view compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Public can view compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Authenticated users can view compliance frameworks" ON public.compliance_frameworks;

-- Ensure RLS is enabled
ALTER TABLE public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

-- Create policy that ONLY allows authenticated users
CREATE POLICY "Authenticated users can view compliance frameworks"
ON public.compliance_frameworks
FOR SELECT
TO authenticated
USING (true);