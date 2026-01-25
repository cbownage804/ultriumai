-- Create user_product_access table for managing product subscriptions
CREATE TABLE public.user_product_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product TEXT NOT NULL CHECK (product IN ('ai_studio', 'safesuite', 'vanguard')),
  access_level TEXT NOT NULL DEFAULT 'free' CHECK (access_level IN ('free', 'pro', 'business', 'enterprise')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product)
);

-- Enable RLS
ALTER TABLE public.user_product_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own product access
CREATE POLICY "Users can view their own product access"
ON public.user_product_access
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own product access (for self-signup)
CREATE POLICY "Users can create their own product access"
ON public.user_product_access
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can update/delete (handled via service role)
-- Users cannot modify their own access levels

-- Create index for faster lookups
CREATE INDEX idx_user_product_access_user_id ON public.user_product_access(user_id);
CREATE INDEX idx_user_product_access_product ON public.user_product_access(product);

-- Create trigger for updated_at
CREATE TRIGGER update_user_product_access_updated_at
BEFORE UPDATE ON public.user_product_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-grant free access to all products on signup
CREATE OR REPLACE FUNCTION public.grant_default_product_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Grant free access to all three products
  INSERT INTO public.user_product_access (user_id, product, access_level)
  VALUES 
    (NEW.id, 'ai_studio', 'free'),
    (NEW.id, 'safesuite', 'free'),
    (NEW.id, 'vanguard', 'free')
  ON CONFLICT (user_id, product) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-grant access when a new user signs up
CREATE TRIGGER on_auth_user_created_grant_product_access
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.grant_default_product_access();