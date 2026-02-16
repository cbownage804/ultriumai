
-- Allow admins to view all bug reports
CREATE POLICY "Admins can view all bug reports"
ON public.bug_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update any bug report
CREATE POLICY "Admins can update all bug reports"
ON public.bug_reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
);
