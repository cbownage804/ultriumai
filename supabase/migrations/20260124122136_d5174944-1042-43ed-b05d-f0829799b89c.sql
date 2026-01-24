-- Create strict owner-only policies for msp_clients
-- MSP owners can only access clients belonging to their own MSP

CREATE POLICY "msp_clients_select_own" ON public.msp_clients
FOR SELECT TO authenticated
USING (
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

CREATE POLICY "msp_clients_insert_own" ON public.msp_clients
FOR INSERT TO authenticated
WITH CHECK (
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

CREATE POLICY "msp_clients_update_own" ON public.msp_clients
FOR UPDATE TO authenticated
USING (
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);

CREATE POLICY "msp_clients_delete_own" ON public.msp_clients
FOR DELETE TO authenticated
USING (
  msp_id IN (SELECT id FROM public.msps WHERE user_id = auth.uid())
);