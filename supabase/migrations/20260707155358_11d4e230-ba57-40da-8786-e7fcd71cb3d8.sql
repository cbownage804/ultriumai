ALTER TABLE public.safeweb_threats
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID NULL;

CREATE INDEX IF NOT EXISTS idx_safeweb_threats_acknowledged_at
  ON public.safeweb_threats(acknowledged_at);