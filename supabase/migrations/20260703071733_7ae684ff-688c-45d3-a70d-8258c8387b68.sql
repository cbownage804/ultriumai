CREATE TABLE public.ray_ioc_index (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL,
  ioc_type text NOT NULL,
  ioc_value text NOT NULL,
  ioc_value_norm text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  occurrence_count integer NOT NULL DEFAULT 1,
  investigation_ids uuid[] NOT NULL DEFAULT '{}',
  last_verdict text NULL,
  last_note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ray_ioc_index_unique UNIQUE (user_id, ioc_type, ioc_value_norm)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_ioc_index TO authenticated;
GRANT ALL ON public.ray_ioc_index TO service_role;

ALTER TABLE public.ray_ioc_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own IOC index"
  ON public.ray_ioc_index
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_ioc_index_user_type_idx ON public.ray_ioc_index (user_id, ioc_type, last_seen_at DESC);
CREATE INDEX ray_ioc_index_lookup_idx ON public.ray_ioc_index (user_id, ioc_value_norm);