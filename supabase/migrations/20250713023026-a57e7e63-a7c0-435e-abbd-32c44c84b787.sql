-- Final batch of function fixes

-- Update user license counts function
CREATE OR REPLACE FUNCTION public.update_user_license_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update assigned_users count in client assignments based on active user assignments
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    UPDATE public.msp_client_license_assignments
    SET assigned_users = (
      SELECT COUNT(*) 
      FROM public.msp_user_license_assignments 
      WHERE client_id = msp_client_license_assignments.client_id 
      AND is_active = true
    )
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Is Ultrium employee function
CREATE OR REPLACE FUNCTION public.is_ultrium_employee(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND email LIKE '%@ultriumai.com'
  );
$function$;

-- Update client email configs function
CREATE OR REPLACE FUNCTION public.update_client_email_configs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Get helpdesk role function
CREATE OR REPLACE FUNCTION public.get_helpdesk_role(_user_id uuid, _context_id uuid DEFAULT NULL::uuid)
RETURNS helpdesk_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  -- Check if user is MSP owner
  SELECT 'msp_admin'::helpdesk_role
  FROM public.msps 
  WHERE user_id = _user_id
  UNION ALL
  
  -- Check if user is MSP staff
  SELECT role
  FROM public.msp_staff
  WHERE user_id = _user_id AND is_active = true
  UNION ALL
  
  -- Check if user is client user
  SELECT role
  FROM public.client_users
  WHERE user_id = _user_id AND is_active = true
  AND (CASE WHEN _context_id IS NOT NULL THEN client_id = _context_id ELSE true END)
  
  LIMIT 1;
$function$;

-- Update RMM updated at function
CREATE OR REPLACE FUNCTION public.update_rmm_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;