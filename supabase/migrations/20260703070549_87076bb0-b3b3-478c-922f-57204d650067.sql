CREATE TABLE public.ray_board_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NULL,
  period_days integer NOT NULL DEFAULT 30,
  title text NOT NULL DEFAULT 'Board Report',
  status text NOT NULL DEFAULT 'running',
  content text NULL,
  investigation_ids uuid[] NOT NULL DEFAULT '{}',
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_ray_compute integer NOT NULL DEFAULT 5,
  model text NULL,
  error text NULL,
  duration_ms integer NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ray_board_reports TO authenticated;
GRANT ALL ON public.ray_board_reports TO service_role;

ALTER TABLE public.ray_board_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own board reports"
  ON public.ray_board_reports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX ray_board_reports_user_idx ON public.ray_board_reports (user_id, created_at DESC);