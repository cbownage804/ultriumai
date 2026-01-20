-- Fix safeweb_sources - restrict to authenticated users only (shared resource)
DROP POLICY IF EXISTS "Anyone can view sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Public can view sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Authenticated users can view sources" ON public.safeweb_sources;

CREATE POLICY "Authenticated users can view active sources"
ON public.safeweb_sources FOR SELECT
TO authenticated
USING (is_active = true);