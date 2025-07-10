-- Remove brandon@ultriumllc.com from admin functions  
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email LIKE '%@ultriumai.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

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

-- Set up brandon@ultriumllc.com as MSP user with enterprise subscription
-- First ensure the profile exists with MSP account type
INSERT INTO public.profiles (id, user_id, email, full_name, account_type, company_name)
SELECT 
  id, 
  id, -- user_id should be the same as id
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'Brandon Howard'),
  'msp'::account_type,
  'UltriumLLC'
FROM auth.users 
WHERE email = 'brandon@ultriumllc.com'
ON CONFLICT (id) DO UPDATE SET
  account_type = 'msp'::account_type,
  company_name = 'UltriumLLC',
  updated_at = now();

-- Set up MSP organization for brandon@ultriumllc.com
INSERT INTO public.msps (id, user_id, name, email, phone, website, status, billing_plan, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'UltriumLLC',
  'brandon@ultriumllc.com',
  '+1-555-0123',
  'https://ultriumllc.com',
  'active',
  'enterprise',
  now(),
  now()
FROM auth.users u
WHERE u.email = 'brandon@ultriumllc.com'
AND NOT EXISTS (SELECT 1 FROM public.msps WHERE user_id = u.id);

-- Ensure user has MSP admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'msp_admin'::app_role
FROM auth.users 
WHERE email = 'brandon@ultriumllc.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Set up enterprise subscription for brandon@ultriumllc.com
INSERT INTO public.subscribers (email, user_id, subscribed, subscription_tier, subscription_end, updated_at)
SELECT 
  email,
  id,
  true,
  'enterprise',
  null, -- No expiration for manually set enterprise
  now()
FROM auth.users 
WHERE email = 'brandon@ultriumllc.com'
ON CONFLICT (email) DO UPDATE SET
  subscribed = true,
  subscription_tier = 'enterprise',
  subscription_end = null,
  updated_at = now();

-- Set enterprise credit limit
INSERT INTO public.user_credits (user_id, credits_used, credits_limit, updated_at)
SELECT 
  id,
  0,
  15000, -- Enterprise credit limit
  now()
FROM auth.users 
WHERE email = 'brandon@ultriumllc.com'
ON CONFLICT (user_id) DO UPDATE SET
  credits_limit = 15000,
  updated_at = now();