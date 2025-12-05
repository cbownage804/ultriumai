-- Add new fields to support_tickets for Vanguard AI Service Desk
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_auto_responded BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_response_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS security_category TEXT,
ADD COLUMN IF NOT EXISTS vanguard_source TEXT,
ADD COLUMN IF NOT EXISTS user_feedback TEXT,
ADD COLUMN IF NOT EXISTS tech_action TEXT;

-- Create index for AI processing
CREATE INDEX IF NOT EXISTS idx_support_tickets_ai_status ON public.support_tickets(ai_processing_status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_security_category ON public.support_tickets(security_category);

-- Create vanguard_ai_feedback table for tracking AI effectiveness
CREATE TABLE IF NOT EXISTS public.vanguard_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  ai_solution_used BOOLEAN DEFAULT false,
  user_confirmed_resolved BOOLEAN,
  tech_modified_solution BOOLEAN DEFAULT false,
  resolution_time_minutes INTEGER,
  confidence_score INTEGER,
  feedback_notes TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on vanguard_ai_feedback
ALTER TABLE public.vanguard_ai_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vanguard_ai_feedback
CREATE POLICY "Users can view their own AI feedback" 
ON public.vanguard_ai_feedback 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st 
    WHERE st.id = ticket_id AND st.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert AI feedback for their tickets" 
ON public.vanguard_ai_feedback 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets st 
    WHERE st.id = ticket_id AND st.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own AI feedback" 
ON public.vanguard_ai_feedback 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st 
    WHERE st.id = ticket_id AND st.user_id = auth.uid()
  )
);

-- Create vanguard_service_tickets table for Vanguard-specific tickets
CREATE TABLE IF NOT EXISTS public.vanguard_service_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  security_category TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  requester_name TEXT,
  requester_email TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  ai_suggested_solution TEXT,
  ai_confidence_score INTEGER,
  ai_processing_status TEXT DEFAULT 'pending',
  ai_auto_responded BOOLEAN DEFAULT false,
  ai_response_sent_at TIMESTAMPTZ,
  ai_summary TEXT,
  auto_resolved BOOLEAN DEFAULT false,
  user_feedback TEXT,
  tech_action TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  related_security_event_id UUID,
  related_scan_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on vanguard_service_tickets
ALTER TABLE public.vanguard_service_tickets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vanguard_service_tickets
CREATE POLICY "Users can view their own Vanguard tickets" 
ON public.vanguard_service_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create Vanguard tickets" 
ON public.vanguard_service_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Vanguard tickets" 
ON public.vanguard_service_tickets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Vanguard tickets" 
ON public.vanguard_service_tickets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for vanguard_service_tickets
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_user_id ON public.vanguard_service_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_status ON public.vanguard_service_tickets(status);
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_priority ON public.vanguard_service_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_vanguard_tickets_ai_status ON public.vanguard_service_tickets(ai_processing_status);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_vanguard_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_vanguard_service_tickets_updated_at
BEFORE UPDATE ON public.vanguard_service_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_vanguard_ticket_updated_at();