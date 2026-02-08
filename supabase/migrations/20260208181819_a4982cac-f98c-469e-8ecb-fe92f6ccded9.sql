
-- Fix overly permissive changelog policy: restrict write to created_by match
DROP POLICY "Authenticated users can manage changelog" ON public.platform_changelog;

CREATE POLICY "Users can insert changelog entries"
  ON public.platform_changelog FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own changelog entries"
  ON public.platform_changelog FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own changelog entries"
  ON public.platform_changelog FOR DELETE
  USING (auth.uid() = created_by);
