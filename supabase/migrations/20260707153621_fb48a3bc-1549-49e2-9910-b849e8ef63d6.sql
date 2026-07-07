
CREATE TABLE public.wrayth_autorun_allowlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id UUID REFERENCES public.wrayth_devices(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX wrayth_autorun_allowlist_unique_scope
  ON public.wrayth_autorun_allowlist (user_id, COALESCE(device_id::text, ''), location, name);

CREATE INDEX wrayth_autorun_allowlist_user_idx
  ON public.wrayth_autorun_allowlist (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrayth_autorun_allowlist TO authenticated;
GRANT ALL ON public.wrayth_autorun_allowlist TO service_role;

ALTER TABLE public.wrayth_autorun_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own autorun allowlist"
  ON public.wrayth_autorun_allowlist
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
