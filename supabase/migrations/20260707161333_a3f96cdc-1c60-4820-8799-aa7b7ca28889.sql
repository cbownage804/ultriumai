-- Tenant-scope published KB article reads so MSPs don't see each other's internal documentation.
DROP POLICY IF EXISTS "helpdesk_kb_articles_select_authenticated_published" ON public.helpdesk_kb_articles;

CREATE POLICY "helpdesk_kb_articles_select_published_tenant_scoped"
ON public.helpdesk_kb_articles
FOR SELECT
TO authenticated
USING (
  is_published = true
  AND (
    -- Author themselves
    auth.uid() = author_id
    -- Platform staff can see all published articles
    OR public.is_ultrium_employee(auth.uid())
    -- Author has no MSP affiliation (platform-wide / non-tenant content)
    OR NOT EXISTS (
      SELECT 1 FROM public.msp_staff a
      WHERE a.user_id = author_id AND a.is_active = true
    )
    -- Viewer shares an MSP with the author
    OR EXISTS (
      SELECT 1
      FROM public.msp_staff viewer
      JOIN public.msp_staff author ON author.msp_id = viewer.msp_id
      WHERE viewer.user_id = auth.uid()
        AND viewer.is_active = true
        AND author.user_id = helpdesk_kb_articles.author_id
        AND author.is_active = true
    )
  )
);