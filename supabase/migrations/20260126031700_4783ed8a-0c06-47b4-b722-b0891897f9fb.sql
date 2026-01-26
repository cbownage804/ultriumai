-- Add missing DELETE policy for safepass_breach_scans
CREATE POLICY "Users can delete their own breach scans"
ON public.safepass_breach_scans
FOR DELETE
USING (auth.uid() = user_id);