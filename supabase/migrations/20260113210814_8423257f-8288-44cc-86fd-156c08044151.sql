-- Add AI classification, sentiment, and priority detection columns to vanguard_service_tickets
ALTER TABLE public.vanguard_service_tickets
ADD COLUMN IF NOT EXISTS ai_detected_category text,
ADD COLUMN IF NOT EXISTS ai_category_confidence integer,
ADD COLUMN IF NOT EXISTS ai_sub_category text,
ADD COLUMN IF NOT EXISTS ai_user_sentiment text,
ADD COLUMN IF NOT EXISTS ai_sentiment_indicators text[],
ADD COLUMN IF NOT EXISTS ai_frustration_level integer,
ADD COLUMN IF NOT EXISTS ai_detected_priority text,
ADD COLUMN IF NOT EXISTS ai_priority_factors text[],
ADD COLUMN IF NOT EXISTS ai_business_impact text,
ADD COLUMN IF NOT EXISTS ai_users_affected text,
ADD COLUMN IF NOT EXISTS ai_keywords text[],
ADD COLUMN IF NOT EXISTS ai_requires_escalation boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_escalation_reason text,
ADD COLUMN IF NOT EXISTS ai_estimated_resolution_time text,
ADD COLUMN IF NOT EXISTS ai_tech_notes text,
ADD COLUMN IF NOT EXISTS ai_similar_issues_hint text;

-- Add index for sentiment-based queries (high frustration tickets)
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_frustration 
ON public.vanguard_service_tickets(ai_frustration_level) 
WHERE ai_frustration_level >= 7;

-- Add index for priority-based queries
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_ai_priority 
ON public.vanguard_service_tickets(ai_detected_priority);

-- Add index for escalation queries
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_escalation 
ON public.vanguard_service_tickets(ai_requires_escalation) 
WHERE ai_requires_escalation = true;