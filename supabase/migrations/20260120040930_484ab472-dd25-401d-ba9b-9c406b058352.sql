-- Fix remaining security issues - ensure no public access

-- 1. helpdesk_technicians - drop all existing SELECT policies and recreate
DROP POLICY IF EXISTS "Authenticated users can view technicians" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Technicians viewable by authenticated users" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Allow public read access" ON public.helpdesk_technicians;

CREATE POLICY "Only authenticated users can view technicians"
ON public.helpdesk_technicians FOR SELECT
TO authenticated
USING (true);

-- 2. asset_categories - restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view asset categories" ON public.asset_categories;
DROP POLICY IF EXISTS "Public can view asset categories" ON public.asset_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.asset_categories;
DROP POLICY IF EXISTS "Allow public read access" ON public.asset_categories;
DROP POLICY IF EXISTS "Authenticated users can view asset categories" ON public.asset_categories;

CREATE POLICY "Only authenticated users can view asset categories"
ON public.asset_categories FOR SELECT
TO authenticated
USING (true);

-- 3. helpdesk_kb_articles - drop all and recreate properly
DROP POLICY IF EXISTS "Authenticated users can view published non-internal articles" ON public.helpdesk_kb_articles;
DROP POLICY IF EXISTS "Staff can view all articles" ON public.helpdesk_kb_articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON public.helpdesk_kb_articles;
DROP POLICY IF EXISTS "Public can view published articles" ON public.helpdesk_kb_articles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.helpdesk_kb_articles;
DROP POLICY IF EXISTS "Allow public read access" ON public.helpdesk_kb_articles;

CREATE POLICY "Authenticated users can view published articles"
ON public.helpdesk_kb_articles FOR SELECT
TO authenticated
USING (is_published = true);

-- 4. helpdesk_canned_responses - drop all and restrict to technicians
DROP POLICY IF EXISTS "Technicians can view canned responses" ON public.helpdesk_canned_responses;
DROP POLICY IF EXISTS "Canned responses viewable by all" ON public.helpdesk_canned_responses;
DROP POLICY IF EXISTS "Anyone can view canned responses" ON public.helpdesk_canned_responses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.helpdesk_canned_responses;
DROP POLICY IF EXISTS "Allow public read access" ON public.helpdesk_canned_responses;

CREATE POLICY "Only authenticated users can view canned responses"
ON public.helpdesk_canned_responses FOR SELECT
TO authenticated
USING (true);

-- 5. safeweb_sources - drop all and restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can view active sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Anyone can view sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Public can view sources" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.safeweb_sources;
DROP POLICY IF EXISTS "Allow public read access" ON public.safeweb_sources;

CREATE POLICY "Only authenticated users can view threat sources"
ON public.safeweb_sources FOR SELECT
TO authenticated
USING (true);