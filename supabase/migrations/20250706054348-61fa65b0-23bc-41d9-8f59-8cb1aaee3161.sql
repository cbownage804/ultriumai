-- Add ultrium_admin role for UltriumAI employees
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ultrium_admin';

-- Create function to check if user is UltriumAI employee
CREATE OR REPLACE FUNCTION public.is_ultrium_employee(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND email LIKE '%@ultriumai.com'
  );
$$;

-- Update handle_new_user function to auto-assign ultrium_admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Create/update profile with account type from metadata
  INSERT INTO public.profiles (id, email, full_name, account_type, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type, 'business'::account_type),
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    account_type = COALESCE((NEW.raw_user_meta_data->>'account_type')::account_type, 'business'::account_type),
    company_name = NEW.raw_user_meta_data->>'company_name',
    updated_at = now();
  
  -- Assign role based on account type or email domain
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN NEW.email LIKE '%@ultriumai.com' THEN 'ultrium_admin'::app_role
      WHEN (NEW.raw_user_meta_data->>'account_type') = 'msp' THEN 'msp_admin'::app_role
      WHEN (NEW.raw_user_meta_data->>'account_type') = 'mssp' THEN 'mssp_admin'::app_role
      ELSE 'user'::app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Update profiles RLS to allow UltriumAI employees to see all profiles
CREATE POLICY "UltriumAI employees can view all profiles"
ON public.profiles
FOR SELECT
USING (is_ultrium_employee(auth.uid()));

CREATE POLICY "UltriumAI employees can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_ultrium_employee(auth.uid()));

-- Update msp_clients RLS to allow UltriumAI employees to manage all clients
CREATE POLICY "UltriumAI employees can manage all MSP clients"
ON public.msp_clients
FOR ALL
USING (is_ultrium_employee(auth.uid()));

-- Update msps RLS to allow UltriumAI employees to manage all MSPs
CREATE POLICY "UltriumAI employees can manage all MSPs"
ON public.msps
FOR ALL
USING (is_ultrium_employee(auth.uid()));

-- Update custom_gpts RLS to allow UltriumAI employees to see all GPTs
CREATE POLICY "UltriumAI employees can view all GPTs"
ON public.custom_gpts
FOR SELECT
USING (is_ultrium_employee(auth.uid()));

-- Update user_credits RLS to allow UltriumAI employees to manage all credits
CREATE POLICY "UltriumAI employees can manage all user credits"
ON public.user_credits
FOR ALL
USING (is_ultrium_employee(auth.uid()));

-- Update subscribers RLS to allow UltriumAI employees to manage all subscriptions
CREATE POLICY "UltriumAI employees can manage all subscriptions"
ON public.subscribers
FOR ALL
USING (is_ultrium_employee(auth.uid()));