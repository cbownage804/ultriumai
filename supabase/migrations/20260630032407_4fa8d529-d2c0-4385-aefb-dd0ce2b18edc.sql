
-- 1. Encrypted TOTP secrets stored per vault account
CREATE TABLE public.vault_totp_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_entry_id UUID,
  service_name TEXT NOT NULL,
  service_domain TEXT,
  account_label TEXT,
  issuer TEXT,
  secret_ciphertext TEXT NOT NULL,
  secret_iv TEXT NOT NULL,
  secret_salt TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'SHA1',
  digits INTEGER NOT NULL DEFAULT 6,
  period INTEGER NOT NULL DEFAULT 30,
  backup_codes_ciphertext TEXT,
  backup_codes_iv TEXT,
  recovery_method TEXT NOT NULL DEFAULT 'none',
  notes TEXT,
  last_used_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_totp_secrets TO authenticated;
GRANT ALL ON public.vault_totp_secrets TO service_role;

ALTER TABLE public.vault_totp_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own TOTP secrets"
  ON public.vault_totp_secrets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_vault_totp_secrets_user ON public.vault_totp_secrets(user_id);
CREATE INDEX idx_vault_totp_secrets_entry ON public.vault_totp_secrets(password_entry_id);

CREATE TRIGGER trg_vault_totp_secrets_updated_at
  BEFORE UPDATE ON public.vault_totp_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_safepass_updated_at();

-- 2. Ray's queue of accounts that should turn MFA on
CREATE TABLE public.vault_mfa_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_entry_id UUID,
  service_name TEXT NOT NULL,
  service_domain TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  reason TEXT,
  mfa_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
  setup_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  dismissed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_domain, password_entry_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_mfa_recommendations TO authenticated;
GRANT ALL ON public.vault_mfa_recommendations TO service_role;

ALTER TABLE public.vault_mfa_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own MFA recommendations"
  ON public.vault_mfa_recommendations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_vault_mfa_recs_user_status ON public.vault_mfa_recommendations(user_id, status);

CREATE TRIGGER trg_vault_mfa_recs_updated_at
  BEFORE UPDATE ON public.vault_mfa_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_safepass_updated_at();

-- 3. 2FA Health Score snapshots
CREATE TABLE public.vault_mfa_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  protected_count INTEGER NOT NULL DEFAULT 0,
  unprotected_count INTEGER NOT NULL DEFAULT 0,
  critical_unprotected INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_mfa_health_snapshots TO authenticated;
GRANT ALL ON public.vault_mfa_health_snapshots TO service_role;

ALTER TABLE public.vault_mfa_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own MFA health history"
  ON public.vault_mfa_health_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own MFA health snapshots"
  ON public.vault_mfa_health_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_vault_mfa_health_user_time ON public.vault_mfa_health_snapshots(user_id, captured_at DESC);
