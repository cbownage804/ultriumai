-- Create table for storing WebAuthn credentials for SafePass hardware key support
CREATE TABLE IF NOT EXISTS public.safepass_webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  attestation_object TEXT,
  name TEXT NOT NULL DEFAULT 'Security Key',
  authenticator_type TEXT NOT NULL DEFAULT 'cross-platform',
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  
  CONSTRAINT valid_authenticator_type CHECK (authenticator_type IN ('cross-platform', 'platform'))
);

-- Enable RLS
ALTER TABLE public.safepass_webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Users can only access their own credentials
CREATE POLICY "Users can view their own WebAuthn credentials"
  ON public.safepass_webauthn_credentials
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own WebAuthn credentials"
  ON public.safepass_webauthn_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WebAuthn credentials"
  ON public.safepass_webauthn_credentials
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WebAuthn credentials"
  ON public.safepass_webauthn_credentials
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_safepass_webauthn_user_id 
  ON public.safepass_webauthn_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_safepass_webauthn_credential_id 
  ON public.safepass_webauthn_credentials(credential_id);

-- Add comment
COMMENT ON TABLE public.safepass_webauthn_credentials IS 'Stores WebAuthn/FIDO2 credentials for hardware security key authentication in SafePass';