CREATE TABLE public.ray_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NULL,
  policy_type TEXT NOT NULL,
  title TEXT NOT NULL,
  organization_name TEXT NULL,
  frameworks TEXT[] NOT NULL DEFAULT '{}',
  jurisdiction TEXT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  markdown TEXT NULL,
  compute_credits INT NOT NULL DEFAULT 10,
  model TEXT NULL,
  error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_policies TO authenticated;
GRANT ALL ON public.ray_policies TO service_role;

ALTER TABLE public.ray_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own policies"
  ON public.ray_policies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_policies_user_created_idx ON public.ray_policies(user_id, created_at DESC);

CREATE TRIGGER update_ray_policies_updated_at
  BEFORE UPDATE ON public.ray_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();