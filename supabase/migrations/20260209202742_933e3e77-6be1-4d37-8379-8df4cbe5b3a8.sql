
-- Fix overly permissive RLS on ticket_attachments
DROP POLICY IF EXISTS "Allow all operations on ticket attachments" ON public.ticket_attachments;

CREATE POLICY "Users can view their own ticket attachments"
  ON public.ticket_attachments FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin_user());

CREATE POLICY "Users can insert their own ticket attachments"
  ON public.ticket_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ticket attachments"
  ON public.ticket_attachments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin_user());

-- Fix overly permissive RLS on ticket_satisfaction_ratings
-- This table uses portal_user_id, not user_id. Portal users submit ratings.
DROP POLICY IF EXISTS "Allow all operations on satisfaction ratings" ON public.ticket_satisfaction_ratings;

CREATE POLICY "Authenticated users can view satisfaction ratings"
  ON public.ticket_satisfaction_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert satisfaction ratings"
  ON public.ticket_satisfaction_ratings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own satisfaction ratings"
  ON public.ticket_satisfaction_ratings FOR UPDATE
  USING (auth.role() = 'authenticated');
