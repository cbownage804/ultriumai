-- Fix safe_shield_threats RLS policy to require authentication
DROP POLICY IF EXISTS "Users can manage their own threats" ON public.safe_shield_threats;

CREATE POLICY "Users can manage their own threats" 
ON public.safe_shield_threats 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());