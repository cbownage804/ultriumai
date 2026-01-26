-- Add missing INSERT policy for admins on safesuite_subscriptions
CREATE POLICY "Admins can insert safesuite subscriptions"
ON public.safesuite_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (is_ultrium_employee(auth.uid()));