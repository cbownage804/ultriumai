-- Enable RLS on business_customers
ALTER TABLE public.business_customers ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.business_customers;
DROP POLICY IF EXISTS "Public read access" ON public.business_customers;

-- Create strict owner-only policies for business_customers
CREATE POLICY "Users can view their own business customer records"
ON public.business_customers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own business customer records"
ON public.business_customers
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable RLS on security_api_keys
ALTER TABLE public.security_api_keys ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.security_api_keys;
DROP POLICY IF EXISTS "Public read access" ON public.security_api_keys;

-- Create strict owner-only policies for security_api_keys
CREATE POLICY "Users can view their own security API keys"
ON public.security_api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own security API keys"
ON public.security_api_keys
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);