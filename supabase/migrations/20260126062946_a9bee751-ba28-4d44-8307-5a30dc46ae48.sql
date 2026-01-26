-- Clean up duplicate anon denial policies on safepass_entries
DROP POLICY IF EXISTS "Block anonymous safepass_entries access" ON public.safepass_entries;
DROP POLICY IF EXISTS "deny_anon_safepass_entries" ON public.safepass_entries;
-- Keep only one clean policy
DROP POLICY IF EXISTS "safepass_entries_block_anon" ON public.safepass_entries;
CREATE POLICY "safepass_entries_deny_anon"
ON public.safepass_entries FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure proper grants
REVOKE ALL ON public.safepass_entries FROM anon, public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safepass_entries TO authenticated;

-- Add security comments for documentation
COMMENT ON TABLE public.safepass_entries IS 
  'Zero-knowledge password vault entries. Encryption is client-side only - server never sees plaintext passwords. Keys are derived from user master password using PBKDF2 (600k iterations) and never stored.';

COMMENT ON TABLE public.profiles IS 
  'User profile data with strict RLS - each user can only access their own profile. Admins (UltriumAI employees) have read/update access for support purposes.';