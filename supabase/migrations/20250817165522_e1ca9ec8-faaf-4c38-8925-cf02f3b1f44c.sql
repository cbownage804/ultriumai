-- Comprehensive security fixes for RLS policies
-- Fix critical vulnerabilities in sensitive tables

-- 1. Fix client_portal_sessions - Remove overly permissive system policy
DROP POLICY IF EXISTS "System can manage sessions" ON public.client_portal_sessions;

-- Add secure policies for client_portal_sessions
CREATE POLICY "Users can insert their own sessions"
ON public.client_portal_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.client_portal_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.client_portal_sessions
FOR DELETE  
TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix rmm_agent_checkins - Remove overly permissive system policies
DROP POLICY IF EXISTS "System can insert agent check-ins" ON public.rmm_agent_checkins;
DROP POLICY IF EXISTS "System can update agent check-ins" ON public.rmm_agent_checkins;

-- Service role will bypass RLS for system operations
-- Keep existing SELECT policy for users to view their own check-ins

-- 3. Fix client_portal_announcements - Restrict MSP access properly
DROP POLICY IF EXISTS "MSPs can manage announcements" ON public.client_portal_announcements;

CREATE POLICY "MSPs can manage their client announcements"
ON public.client_portal_announcements
FOR ALL
TO authenticated
USING (
  client_id IN (
    SELECT msp_clients.id
    FROM msp_clients
    JOIN msps ON msps.id = msp_clients.msp_id
    WHERE msps.user_id = auth.uid()
  )
);

-- 4. Fix event_correlations - Remove overly permissive system policy
DROP POLICY IF EXISTS "System can manage event correlations" ON public.event_correlations;

-- Keep existing SELECT policy, service role will handle system writes

-- 5. Fix network_scans - Remove system insert policy with overly broad access
DROP POLICY IF EXISTS "System can insert network scans" ON public.network_scans;
DROP POLICY IF EXISTS "Service role can insert network scans" ON public.network_scans;

-- Keep existing user policies for their own scans

-- 6. Fix admin_audit_trails - Remove overly permissive system policy
DROP POLICY IF EXISTS "System can insert audit trails" ON public.admin_audit_trails;

-- 7. Fix audit_logs - Remove overly permissive system policy  
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- 8. Fix action_execution_logs - Remove overly permissive system policy
DROP POLICY IF EXISTS "System can insert action logs" ON public.action_execution_logs;

-- 9. Fix msp_api_usage - Remove overly permissive system policy
DROP POLICY IF EXISTS "System can insert API usage" ON public.msp_api_usage;

-- Add hardened functions with proper search_path
CREATE OR REPLACE FUNCTION public.validate_connector_key_secure(p_connector_key text)
RETURNS TABLE(connector_id uuid, user_id uuid, is_valid boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sc.id as connector_id,
    sc.user_id,
    true as is_valid
  FROM public.safenet_connectors sc
  WHERE sc.connector_key = p_connector_key
  AND sc.status = 'active';
$$;

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.get_user_account_type(_user_id uuid)
RETURNS account_type
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT account_type FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_msp_or_mssp(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND account_type IN ('msp', 'mssp')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ultrium_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND email LIKE '%@ultriumai.com'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  );
END;
$$;