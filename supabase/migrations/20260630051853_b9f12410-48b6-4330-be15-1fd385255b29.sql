
ALTER TABLE public.ray_recommendations
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

ALTER TABLE public.ray_briefs
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS feedback_note text,
  ADD COLUMN IF NOT EXISTS feedback_at timestamptz;

CREATE INDEX IF NOT EXISTS ray_recommendations_user_status_idx
  ON public.ray_recommendations (user_id, status);
