
CREATE TABLE public.ray_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_id UUID,
  title TEXT NOT NULL,
  summary TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assignee TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_cases TO authenticated;
GRANT ALL ON public.ray_cases TO service_role;
ALTER TABLE public.ray_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cases" ON public.ray_cases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ray_case_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.ray_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, item_type, ref_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_case_items TO authenticated;
GRANT ALL ON public.ray_case_items TO service_role;
ALTER TABLE public.ray_case_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own case items" ON public.ray_case_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.ray_case_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.ray_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_case_notes TO authenticated;
GRANT ALL ON public.ray_case_notes TO service_role;
ALTER TABLE public.ray_case_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own case notes" ON public.ray_case_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_cases_user_status_idx ON public.ray_cases(user_id, status, opened_at DESC);
CREATE INDEX ray_case_items_case_idx ON public.ray_case_items(case_id);
CREATE INDEX ray_case_notes_case_idx ON public.ray_case_notes(case_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.ray_cases_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER ray_cases_touch_trg BEFORE UPDATE ON public.ray_cases
  FOR EACH ROW EXECUTE FUNCTION public.ray_cases_touch();
