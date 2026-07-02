
CREATE TABLE public.ray_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  requires_org boolean NOT NULL DEFAULT false,
  min_tier text NOT NULL DEFAULT 'free',
  enabled boolean NOT NULL DEFAULT true,
  version text NOT NULL DEFAULT '1.0.0',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ray_skills TO anon, authenticated;
GRANT ALL ON public.ray_skills TO service_role;
ALTER TABLE public.ray_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ray_skills readable by all"
  ON public.ray_skills FOR SELECT USING (enabled = true);

CREATE TABLE public.ray_skill_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  skill_slug text NOT NULL,
  input_message text NOT NULL,
  classifier_confidence numeric,
  response_summary text,
  status text NOT NULL DEFAULT 'ok',
  error text,
  latency_ms integer,
  source text NOT NULL DEFAULT 'in_app',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ray_skill_invocations TO authenticated;
GRANT ALL ON public.ray_skill_invocations TO service_role;
ALTER TABLE public.ray_skill_invocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own invocations"
  ON public.ray_skill_invocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own invocations"
  ON public.ray_skill_invocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX ray_skill_invocations_user_created_idx
  ON public.ray_skill_invocations (user_id, created_at DESC);

CREATE TABLE public.wrayth_kb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  source_url text,
  created_by uuid,
  updated_by uuid,
  published boolean NOT NULL DEFAULT true,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_kb TO authenticated;
GRANT ALL ON public.wrayth_kb TO service_role;
ALTER TABLE public.wrayth_kb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read kb" ON public.wrayth_kb FOR SELECT
  USING (
    published = true AND EXISTS (
      SELECT 1 FROM public.org_team_members m
      WHERE m.organization_id = wrayth_kb.org_id AND m.user_id = auth.uid()
    )
  );
CREATE POLICY "org admins can insert kb" ON public.wrayth_kb FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_team_members m
      WHERE m.organization_id = wrayth_kb.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','org_admin')
    )
  );
CREATE POLICY "org admins can update kb" ON public.wrayth_kb FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_team_members m
      WHERE m.organization_id = wrayth_kb.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','org_admin')
    )
  );
CREATE POLICY "org admins can delete kb" ON public.wrayth_kb FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_team_members m
      WHERE m.organization_id = wrayth_kb.org_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner','admin','org_admin')
    )
  );

CREATE INDEX wrayth_kb_org_idx ON public.wrayth_kb (org_id, published);
CREATE INDEX wrayth_kb_fts_idx ON public.wrayth_kb
  USING gin (to_tsvector('english', title || ' ' || content));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER wrayth_kb_updated_at
  BEFORE UPDATE ON public.wrayth_kb
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ray_skills_updated_at
  BEFORE UPDATE ON public.ray_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ray_skills (slug, name, description, category, keywords) VALUES
  ('threat',    'Threat Skill',    'Analyzes emails, links, and attachments for phishing or malicious content.', 'security',   ARRAY['phishing','email','link','safe','suspicious','headers','domain','spoof','attachment']),
  ('device',    'Device Skill',    'Answers questions about enrolled devices, posture, BitLocker, RDP, local admins, updates.', 'devices',  ARRAY['device','bitlocker','rdp','admin','update','patch','defender','firewall','laptop','pc']),
  ('identity',  'Identity Skill',  'Explains security score changes, breach exposure, weak/reused passwords, MFA status.',       'identity', ARRAY['score','breach','password','mfa','identity','leak','exposed','weak','reused']),
  ('knowledge', 'Knowledge Skill', 'Answers from the organization knowledge base and Wrayth product knowledge.',                 'knowledge',ARRAY['how do i','install','setup','policy','procedure','kb','doc','article','vpn','expenses']);
