-- Fix: helpdesk_technicians should NOT be publicly readable
-- Drop any SELECT policies that apply to anon/public (they currently use USING (true) without a TO restriction)
DROP POLICY IF EXISTS "Authenticated users can view technicians" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Only authenticated users can view technicians" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Technicians are viewable by authenticated users" ON public.helpdesk_technicians;

-- Recreate a single explicit SELECT policy restricted to authenticated users only
CREATE POLICY "helpdesk_technicians_select_authenticated"
ON public.helpdesk_technicians
FOR SELECT
TO authenticated
USING (true);

-- Ensure management stays limited to the record owner (keep if exists, otherwise recreate)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='helpdesk_technicians'
      AND policyname='Users can manage their own technician records'
  ) THEN
    CREATE POLICY "Users can manage their own technician records"
    ON public.helpdesk_technicians
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;