-- Enable RLS on helpdesk_canned_responses if not already enabled
ALTER TABLE public.helpdesk_canned_responses ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Anyone can view canned responses" ON public.helpdesk_canned_responses;
DROP POLICY IF EXISTS "Public read access" ON public.helpdesk_canned_responses;

-- Create security definer function to check if user is MSP staff
CREATE OR REPLACE FUNCTION public.is_msp_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if user owns an MSP
    SELECT 1 FROM public.msps WHERE user_id = check_user_id
    UNION
    -- Check if user is active MSP staff
    SELECT 1 FROM public.msp_staff WHERE user_id = check_user_id AND is_active = true
  )
$$;

-- Only MSP users can view canned responses
CREATE POLICY "MSP users can view canned responses"
ON public.helpdesk_canned_responses
FOR SELECT
TO authenticated
USING (public.is_msp_user(auth.uid()));

-- Only MSP users can create canned responses
CREATE POLICY "MSP users can create canned responses"
ON public.helpdesk_canned_responses
FOR INSERT
TO authenticated
WITH CHECK (public.is_msp_user(auth.uid()));

-- Only MSP users can update canned responses
CREATE POLICY "MSP users can update canned responses"
ON public.helpdesk_canned_responses
FOR UPDATE
TO authenticated
USING (public.is_msp_user(auth.uid()));

-- Only MSP users can delete canned responses
CREATE POLICY "MSP users can delete canned responses"
ON public.helpdesk_canned_responses
FOR DELETE
TO authenticated
USING (public.is_msp_user(auth.uid()));