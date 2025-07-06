-- Create account type enum (new)
CREATE TYPE public.account_type AS ENUM ('business', 'msp', 'mssp');

-- Update existing profiles table to add account type and company info
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS account_type account_type DEFAULT 'business',
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_account_type(_user_id UUID)
RETURNS account_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT account_type FROM public.profiles WHERE id = _user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_msp_or_mssp(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = _user_id 
    AND account_type IN ('msp', 'mssp')
  );
$$;

-- Add new role types to existing app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'msp_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mssp_admin';

-- Update the handle_new_user function to set account type based on signup data
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
  
  -- Assign role based on account type
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    CASE 
      WHEN (NEW.raw_user_meta_data->>'account_type') = 'msp' THEN 'msp_admin'::app_role
      WHEN (NEW.raw_user_meta_data->>'account_type') = 'mssp' THEN 'mssp_admin'::app_role
      ELSE 'user'::app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;