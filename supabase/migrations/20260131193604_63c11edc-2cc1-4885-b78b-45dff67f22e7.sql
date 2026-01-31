-- Fix function search_path settings for security compliance

-- Fix is_current_user_admin - change from 'public, auth' to just 'public'
ALTER FUNCTION public.is_current_user_admin() SET search_path = public;

-- Fix log_asset_changes - change from 'public, auth' to just 'public'
ALTER FUNCTION public.log_asset_changes() SET search_path = public;

-- Fix log_ticket_activity - change from 'public, auth' to just 'public'  
ALTER FUNCTION public.log_ticket_activity() SET search_path = public;

-- rls_auto_enable with pg_catalog is intentional for system operations, leave as is