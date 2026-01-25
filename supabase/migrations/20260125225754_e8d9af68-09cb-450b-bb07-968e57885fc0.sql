-- Security Hardening Migration for Test User Readiness (Fixed v2)

-- 1. Fix subscribers table - remove overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.subscribers;

-- 2. Fix audit_logs - make immutable (no UPDATE/DELETE for regular users)
DROP POLICY IF EXISTS "Users can update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can delete audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only admins can delete audit logs" ON public.audit_logs;

-- Ensure audit logs are insert-only for regular users  
CREATE POLICY "Users can insert own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only admins can delete audit logs
CREATE POLICY "Only admins can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (is_ultrium_employee(auth.uid()));

-- 3. Fix msp_billing_usage - ensure clients can't modify usage (msp_id is TEXT type)
DROP POLICY IF EXISTS "msp_billing_usage_owner_delete" ON public.msp_billing_usage;
DROP POLICY IF EXISTS "msp_billing_usage_owner_update" ON public.msp_billing_usage;
DROP POLICY IF EXISTS "MSP owners can update billing usage" ON public.msp_billing_usage;
DROP POLICY IF EXISTS "MSP owners can delete billing usage" ON public.msp_billing_usage;

-- Only MSP owners can modify billing usage
CREATE POLICY "MSP owners can update billing usage"
ON public.msp_billing_usage
FOR UPDATE
TO authenticated
USING (
  msp_id IN (SELECT id::text FROM msps WHERE user_id = auth.uid())
  OR is_ultrium_employee(auth.uid())
);

CREATE POLICY "MSP owners can delete billing usage"
ON public.msp_billing_usage
FOR DELETE
TO authenticated
USING (
  msp_id IN (SELECT id::text FROM msps WHERE user_id = auth.uid())
  OR is_ultrium_employee(auth.uid())
);