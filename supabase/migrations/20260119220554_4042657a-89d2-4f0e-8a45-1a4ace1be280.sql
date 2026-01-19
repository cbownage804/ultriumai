-- 1. Create server-side master password storage
CREATE TABLE public.safepass_master_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  iterations integer DEFAULT 600000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.safepass_master_passwords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own master password"
  ON public.safepass_master_passwords
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Create server-side rate limiting for unlock attempts
CREATE TABLE public.safepass_unlock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attempt_count integer DEFAULT 0,
  last_attempt_at timestamptz DEFAULT now(),
  locked_until timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.safepass_unlock_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unlock attempts"
  ON public.safepass_unlock_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role will handle inserts/updates via edge function

-- 3. Fix overly permissive audit log policies
DROP POLICY IF EXISTS "System can insert audit logs" ON public.password_audit_logs;
CREATE POLICY "Users can insert their own audit logs"
  ON public.password_audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert password usage logs" ON public.safepass_usage_logs;
CREATE POLICY "Users can insert their own usage logs"
  ON public.safepass_usage_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Add trigger to update updated_at on master password changes
CREATE OR REPLACE FUNCTION public.update_safepass_master_password_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_safepass_master_passwords_updated_at
  BEFORE UPDATE ON public.safepass_master_passwords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_safepass_master_password_timestamp();