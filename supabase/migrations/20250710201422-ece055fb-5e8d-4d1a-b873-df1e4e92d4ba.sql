-- Fix the msp_billing_summary view to use SECURITY INVOKER
-- This ensures RLS policies are enforced based on the querying user
DROP VIEW IF EXISTS public.msp_billing_summary;

CREATE VIEW public.msp_billing_summary
WITH (security_invoker = true) AS
SELECT 
  msp_id,
  billing_period,
  service_type,
  SUM(quantity) as total_quantity,
  SUM(total_cost) as total_cost,
  COUNT(*) as transaction_count,
  MIN(created_at) as period_start,
  MAX(created_at) as period_end
FROM public.msp_billing_usage
GROUP BY msp_id, billing_period, service_type;