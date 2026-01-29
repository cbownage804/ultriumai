-- Create email automation log table to track sent emails and prevent duplicates
CREATE TABLE IF NOT EXISTS public.email_automation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL,
  product TEXT,
  metadata JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_email_automation_log_user_type ON public.email_automation_log (user_id, email_type, sent_at DESC);
CREATE INDEX idx_email_automation_log_sent_at ON public.email_automation_log (sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_automation_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (used by edge functions)
CREATE POLICY "Service role only" ON public.email_automation_log
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.email_automation_log IS 'Tracks automated emails sent to users for deduplication and analytics';