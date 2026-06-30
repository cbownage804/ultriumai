CREATE TABLE IF NOT EXISTS public.ray_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_tenant_id text,
  account_email text,
  status text NOT NULL DEFAULT 'pending',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[],
  last_sync_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_integrations TO authenticated;
GRANT ALL ON public.ray_integrations TO service_role;

ALTER TABLE public.ray_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own ray_integrations"
ON public.ray_integrations FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.ray_integrations_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ray_integrations_touch ON public.ray_integrations;
CREATE TRIGGER ray_integrations_touch
BEFORE UPDATE ON public.ray_integrations
FOR EACH ROW EXECUTE FUNCTION public.ray_integrations_touch();

CREATE INDEX IF NOT EXISTS ray_integrations_user_provider_idx
  ON public.ray_integrations (user_id, provider);