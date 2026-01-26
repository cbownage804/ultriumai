-- Create trusted devices table for "Remember this device for 24 hours"
CREATE TABLE public.mfa_trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  trusted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_mfa_trusted_devices_user_fingerprint ON public.mfa_trusted_devices(user_id, device_fingerprint);
CREATE INDEX idx_mfa_trusted_devices_expires ON public.mfa_trusted_devices(expires_at);

-- Enable RLS
ALTER TABLE public.mfa_trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own trusted devices
CREATE POLICY "Users can view their own trusted devices"
ON public.mfa_trusted_devices FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trusted devices"
ON public.mfa_trusted_devices FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted devices"
ON public.mfa_trusted_devices FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Block anonymous access
CREATE POLICY "mfa_trusted_devices_deny_anon"
ON public.mfa_trusted_devices FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke from anon and public, grant to authenticated
REVOKE ALL ON public.mfa_trusted_devices FROM anon, public;
GRANT SELECT, INSERT, DELETE ON public.mfa_trusted_devices TO authenticated;

-- Comment for documentation
COMMENT ON TABLE public.mfa_trusted_devices IS 
  'Stores trusted devices for MFA bypass. Devices are trusted for 24 hours after successful TOTP verification. Fingerprint is a hash of browser/device characteristics.';