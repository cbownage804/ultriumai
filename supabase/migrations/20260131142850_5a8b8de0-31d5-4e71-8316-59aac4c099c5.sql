-- FINAL CLEANUP: Remove remaining broken policies that allow any authenticated user

-- Drop the broken helpdesk_tickets policy (still exists)
DROP POLICY IF EXISTS "MSPs can manage customer tickets" ON public.helpdesk_tickets;

-- Drop the broken rmm_customers policy (old one still exists alongside new one)
DROP POLICY IF EXISTS "MSPs can manage their customers" ON public.rmm_customers;