
CREATE TABLE public.ray_policy_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.ray_policies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  frameworks TEXT[] NOT NULL DEFAULT '{}',
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  markdown TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (policy_id, version_number)
);

CREATE INDEX idx_ray_policy_versions_policy ON public.ray_policy_versions(policy_id, version_number DESC);
CREATE INDEX idx_ray_policy_versions_user ON public.ray_policy_versions(user_id);

GRANT SELECT, INSERT ON public.ray_policy_versions TO authenticated;
GRANT ALL ON public.ray_policy_versions TO service_role;

ALTER TABLE public.ray_policy_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own policy versions"
  ON public.ray_policy_versions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own policy versions"
  ON public.ray_policy_versions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Snapshot trigger: writes a new version row whenever the policy content
-- meaningfully changes (initial draft or later edits that populate sections).
CREATE OR REPLACE FUNCTION public.ray_policies_snapshot_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  content_changed BOOLEAN;
BEGIN
  -- Only snapshot when policy has real content (skip empty 'generating' rows).
  IF NEW.status NOT IN ('draft', 'approved') THEN
    RETURN NEW;
  END IF;
  IF NEW.sections IS NULL OR jsonb_array_length(COALESCE(NEW.sections, '[]'::jsonb)) = 0 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    content_changed :=
      (COALESCE(OLD.sections::text, '') IS DISTINCT FROM COALESCE(NEW.sections::text, ''))
      OR (COALESCE(OLD.metadata::text, '') IS DISTINCT FROM COALESCE(NEW.metadata::text, ''))
      OR (COALESCE(OLD.title, '') IS DISTINCT FROM COALESCE(NEW.title, ''))
      OR (COALESCE(OLD.markdown, '') IS DISTINCT FROM COALESCE(NEW.markdown, ''));
    IF NOT content_changed THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_num
    FROM public.ray_policy_versions
   WHERE policy_id = NEW.id;

  INSERT INTO public.ray_policy_versions (
    policy_id, user_id, version_number, title, frameworks,
    sections, metadata, markdown, note
  ) VALUES (
    NEW.id, NEW.user_id, next_num, NEW.title, COALESCE(NEW.frameworks, '{}'),
    COALESCE(NEW.sections, '[]'::jsonb), COALESCE(NEW.metadata, '{}'::jsonb),
    NEW.markdown,
    CASE WHEN TG_OP = 'INSERT' THEN 'Initial draft' ELSE NULL END
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ray_policies_snapshot ON public.ray_policies;
CREATE TRIGGER trg_ray_policies_snapshot
AFTER INSERT OR UPDATE ON public.ray_policies
FOR EACH ROW EXECUTE FUNCTION public.ray_policies_snapshot_version();

-- Backfill: create a v1 snapshot for every existing populated policy.
INSERT INTO public.ray_policy_versions (
  policy_id, user_id, version_number, title, frameworks,
  sections, metadata, markdown, note
)
SELECT
  p.id, p.user_id, 1, p.title, COALESCE(p.frameworks, '{}'),
  COALESCE(p.sections, '[]'::jsonb), COALESCE(p.metadata, '{}'::jsonb),
  p.markdown, 'Backfilled from existing policy'
FROM public.ray_policies p
WHERE p.status IN ('draft', 'approved')
  AND jsonb_array_length(COALESCE(p.sections, '[]'::jsonb)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.ray_policy_versions v WHERE v.policy_id = p.id
  );
