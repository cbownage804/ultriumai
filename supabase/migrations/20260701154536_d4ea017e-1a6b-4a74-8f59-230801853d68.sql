ALTER TABLE public.ray_recommendations ADD COLUMN IF NOT EXISTS objective text;
CREATE UNIQUE INDEX IF NOT EXISTS ray_recommendations_active_objective_uniq
  ON public.ray_recommendations (user_id, objective)
  WHERE objective IS NOT NULL AND completed_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS ray_recommendations_objective_idx
  ON public.ray_recommendations (user_id, objective)
  WHERE objective IS NOT NULL;