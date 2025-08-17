-- Fix critical security vulnerability in pricing_plans table
-- Remove public access and restrict to authenticated users only

-- Drop the vulnerable policy that allows public access
DROP POLICY IF EXISTS "Everyone can read pricing plans" ON public.pricing_plans;

-- Create secure replacement policy - only authenticated users can read pricing plans
CREATE POLICY "Authenticated users can read pricing plans"
ON public.pricing_plans
FOR SELECT
TO authenticated
USING (true);

-- Keep the existing admin policy for management
-- (Already exists: "Admins can manage pricing plans")