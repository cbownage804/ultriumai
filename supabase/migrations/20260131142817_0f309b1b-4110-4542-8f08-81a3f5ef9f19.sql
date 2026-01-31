-- SECURITY FIX: Add user_id to rmm_customers for proper data isolation
-- This table currently has no ownership tracking

-- Add user_id column to rmm_customers
ALTER TABLE public.rmm_customers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rmm_customers_user_id ON public.rmm_customers(user_id);

-- Now fix the RLS policies
-- The old policy was dropped in the previous migration, create new secure one
CREATE POLICY "Users can manage their own RMM customers"
ON public.rmm_customers
FOR ALL
USING (
  user_id = auth.uid()
  OR public.is_admin_user()
);

-- Fix rmm_devices policy
DROP POLICY IF EXISTS "MSPs can manage customer devices" ON public.rmm_devices;

CREATE POLICY "Users can manage devices of their customers"
ON public.rmm_devices
FOR ALL
USING (
  customer_id IN (
    SELECT id FROM rmm_customers WHERE user_id = auth.uid()
  )
  OR public.is_admin_user()
);