
-- Workplace Embeds: Teams & Slack integration foundation

CREATE TABLE IF NOT EXISTS public.workplace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('microsoft_teams','slack')),
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected','pending','connected','error','disconnected')),
  workspace_id TEXT,
  workspace_name TEXT,
  tenant_id TEXT,
  bot_user_id TEXT,
  encrypted_tokens JSONB,
  scopes TEXT[],
  installed_by UUID REFERENCES auth.users(id),
  last_error TEXT,
  last_event_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workplace_integrations TO authenticated;
GRANT ALL ON public.workplace_integrations TO service_role;
ALTER TABLE public.workplace_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workplace_integrations_owner_all"
  ON public.workplace_integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.workplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.workplace_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_user_id TEXT,
  external_user_name TEXT,
  channel_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  content TEXT,
  kb_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workplace_messages TO authenticated;
GRANT ALL ON public.workplace_messages TO service_role;
ALTER TABLE public.workplace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workplace_messages_owner_all"
  ON public.workplace_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workplace_messages_integration ON public.workplace_messages(integration_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.workplace_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.integration_events TO authenticated;
GRANT ALL ON public.integration_events TO service_role;
ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_events_owner_select"
  ON public.integration_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "integration_events_owner_insert"
  ON public.integration_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_integration_events_user ON public.integration_events(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_workplace_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_workplace_integrations_updated ON public.workplace_integrations;
CREATE TRIGGER trg_workplace_integrations_updated
  BEFORE UPDATE ON public.workplace_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_workplace_integrations_updated_at();
