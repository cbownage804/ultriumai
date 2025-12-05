-- Fix RLS on profiles table
-- First ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create secure policies - users can only access their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

-- Fix RLS on security_settings table - ensure it's properly locked down
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they're restrictive (not permissive)
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.security_settings;
CREATE POLICY "Users can view their own security settings" 
ON public.security_settings 
FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own security settings" ON public.security_settings;
CREATE POLICY "Users can update their own security settings" 
ON public.security_settings 
FOR UPDATE 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own security settings" ON public.security_settings;
CREATE POLICY "Users can insert their own security settings" 
ON public.security_settings 
FOR INSERT 
WITH CHECK (user_id = auth.uid());