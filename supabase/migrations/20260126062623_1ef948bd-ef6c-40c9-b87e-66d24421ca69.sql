-- Fix WebAuthn credentials: Add counter validation to prevent cloning
-- The counter must always increase to detect cloned authenticators

ALTER TABLE public.safepass_webauthn_credentials 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0;

-- Create function to validate and increment counter (anti-cloning measure)
CREATE OR REPLACE FUNCTION public.validate_webauthn_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Counter must always increase (anti-cloning protection)
  IF OLD.counter IS NOT NULL AND NEW.counter IS NOT NULL THEN
    IF NEW.counter <= OLD.counter THEN
      RAISE EXCEPTION 'WebAuthn counter validation failed: potential cloned authenticator detected';
    END IF;
  END IF;
  
  -- Track usage
  NEW.last_used_at := now();
  NEW.use_count := COALESCE(OLD.use_count, 0) + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_webauthn_counter_trigger ON public.safepass_webauthn_credentials;
CREATE TRIGGER validate_webauthn_counter_trigger
  BEFORE UPDATE ON public.safepass_webauthn_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_webauthn_counter();

-- Fix compliance_evidence: Make records immutable (append-only)
-- Replace the permissive ALL policy with restricted policies

DROP POLICY IF EXISTS "Users can manage their own compliance evidence" ON public.compliance_evidence;

-- Users can only INSERT new evidence
CREATE POLICY "compliance_evidence_insert_only"
ON public.compliance_evidence FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can SELECT their own evidence
CREATE POLICY "compliance_evidence_select_own"
ON public.compliance_evidence FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- No UPDATE allowed - evidence is immutable
-- No DELETE allowed - evidence must be preserved for audit trail

-- Block anon access
DROP POLICY IF EXISTS "deny_anon_compliance_evidence" ON public.compliance_evidence;
CREATE POLICY "deny_anon_compliance_evidence"
ON public.compliance_evidence FOR ALL
TO anon
USING (false)
WITH CHECK (false);

REVOKE ALL ON public.compliance_evidence FROM anon, public;
GRANT SELECT, INSERT ON public.compliance_evidence TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE public.compliance_evidence IS 
  'Immutable compliance evidence storage. Records can only be created and viewed, never modified or deleted, to maintain audit integrity.';