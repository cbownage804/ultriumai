
-- =====================================================
-- CRITICAL SECURITY FIX: Restrict master password access
-- =====================================================

-- 1. Drop the insecure policy that applies to 'public' role (includes anon!)
DROP POLICY IF EXISTS "Users can manage their own master password" ON public.safepass_master_passwords;

-- 2. Create secure policies that ONLY apply to authenticated users
CREATE POLICY "Authenticated users can view own master password"
  ON public.safepass_master_passwords
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own master password"
  ON public.safepass_master_passwords
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own master password"
  ON public.safepass_master_passwords
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own master password"
  ON public.safepass_master_passwords
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- SECURITY FIX: Ensure profiles table denies anon access
-- =====================================================

-- Explicitly deny anonymous access to profiles (safety measure)
-- This is technically redundant since policies only target 'authenticated', 
-- but provides defense-in-depth
CREATE POLICY "Deny anonymous access to profiles"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Explicitly deny anonymous access to master passwords
CREATE POLICY "Deny anonymous access to master passwords"
  ON public.safepass_master_passwords
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);
