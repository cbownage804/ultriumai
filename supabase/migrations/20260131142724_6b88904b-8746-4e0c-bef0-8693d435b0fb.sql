-- Fix vanguard_survey_responses policy - link via ticket_id to valid tokens
DROP POLICY IF EXISTS "Anyone can insert survey responses" ON public.vanguard_survey_responses;

CREATE POLICY "Valid token holders can submit survey responses"
ON public.vanguard_survey_responses
FOR INSERT
WITH CHECK (
  -- Verify a valid, unexpired token exists for this ticket
  ticket_id IN (
    SELECT ticket_id FROM vanguard_survey_tokens 
    WHERE expires_at > now() AND is_used = false
  )
);