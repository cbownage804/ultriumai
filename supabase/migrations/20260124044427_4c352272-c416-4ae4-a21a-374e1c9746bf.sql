-- Subscribers already has proper RLS - just verify no public access policies exist
DROP POLICY IF EXISTS "Allow public read access" ON public.subscribers;
DROP POLICY IF EXISTS "Public read access" ON public.subscribers;
DROP POLICY IF EXISTS "Anyone can read subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Enable read access for all" ON public.subscribers;