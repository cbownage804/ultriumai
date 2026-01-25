-- Lock down publicly readable tables flagged by security scan
-- Tables: asset_categories, compliance_frameworks, helpdesk_kb_articles

BEGIN;

/* =========================
   asset_categories
   ========================= */
-- Remove anonymous/public read access
DROP POLICY IF EXISTS "Everyone can read asset categories" ON public.asset_categories;

-- Ensure an authenticated policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='asset_categories'
      AND policyname='asset_categories_select_authenticated'
  ) THEN
    -- Keep access limited to authenticated users (no anon/public)
    CREATE POLICY "asset_categories_select_authenticated"
    ON public.asset_categories
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

/* =========================
   compliance_frameworks
   ========================= */
-- Remove anonymous/public read access policies
DROP POLICY IF EXISTS "Everyone can read compliance frameworks" ON public.compliance_frameworks;
DROP POLICY IF EXISTS "Authenticated users can read compliance frameworks" ON public.compliance_frameworks;

-- Ensure an authenticated policy exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='compliance_frameworks'
      AND policyname='compliance_frameworks_select_authenticated'
  ) THEN
    CREATE POLICY "compliance_frameworks_select_authenticated"
    ON public.compliance_frameworks
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;

/* =========================
   helpdesk_kb_articles
   ========================= */
-- Remove public access to KB articles
DROP POLICY IF EXISTS "Published KB articles are viewable by all" ON public.helpdesk_kb_articles;

-- Keep/ensure published KB articles are readable only when authenticated
DROP POLICY IF EXISTS "Authenticated users can view published articles" ON public.helpdesk_kb_articles;
CREATE POLICY "helpdesk_kb_articles_select_authenticated_published"
ON public.helpdesk_kb_articles
FOR SELECT
TO authenticated
USING (is_published = true);

COMMIT;