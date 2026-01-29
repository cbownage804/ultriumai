-- Vanguard Cortex AI Production Tables
-- Final migration to remove all mock data from AI command center modules

-- =====================================================
-- 1. EMAIL AUTOMATION ENGINE
-- =====================================================

-- Email threads for AI processing
CREATE TABLE public.vanguard_email_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  company TEXT,
  preview TEXT NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'auto_responded', 'pending_review', 'ticket_created')),
  ai_confidence INTEGER DEFAULT 0,
  ai_category TEXT,
  ai_sentiment TEXT DEFAULT 'neutral',
  ai_suggested_response TEXT,
  ticket_id TEXT,
  thread_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email automation rules
CREATE TABLE public.vanguard_email_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  condition TEXT NOT NULL,
  action TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  triggered_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 2. ESCALATION SUITE
-- =====================================================

-- Escalation tickets for human intervention
CREATE TABLE public.vanguard_escalation_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  company TEXT,
  type TEXT NOT NULL CHECK (type IN ('callback', 'video', 'screen_share', 'human_agent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  assigned_agent TEXT,
  conversation_summary TEXT NOT NULL,
  ai_confidence INTEGER DEFAULT 0,
  sentiment TEXT DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Available agents for escalation assignment
CREATE TABLE public.vanguard_escalation_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away', 'offline')),
  active_escalations INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. KB ARTICLE GENERATOR
-- =====================================================

-- KB article drafts generated from patterns
CREATE TABLE public.vanguard_kb_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),
  generated_from TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 4. PATTERN DETECTION AUTO KB
-- =====================================================

-- Detected patterns from ticket analysis
CREATE TABLE public.vanguard_kb_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  ticket_count INTEGER DEFAULT 0,
  affected_category TEXT NOT NULL,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  recommended_action TEXT,
  suggested_kb_title TEXT,
  auto_kb_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE public.vanguard_email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_email_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_escalation_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_escalation_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_kb_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_kb_patterns ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Email threads
CREATE POLICY "Users can manage own email threads" ON public.vanguard_email_threads FOR ALL USING (auth.uid() = user_id);

-- Email automation rules
CREATE POLICY "Users can manage own email rules" ON public.vanguard_email_automation_rules FOR ALL USING (auth.uid() = user_id);

-- Escalation tickets
CREATE POLICY "Users can manage own escalation tickets" ON public.vanguard_escalation_tickets FOR ALL USING (auth.uid() = user_id);

-- Escalation agents
CREATE POLICY "Users can manage own escalation agents" ON public.vanguard_escalation_agents FOR ALL USING (auth.uid() = user_id);

-- KB drafts
CREATE POLICY "Users can manage own KB drafts" ON public.vanguard_kb_drafts FOR ALL USING (auth.uid() = user_id);

-- KB patterns
CREATE POLICY "Users can manage own KB patterns" ON public.vanguard_kb_patterns FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- Updated_at triggers
-- =====================================================

CREATE TRIGGER update_vanguard_email_threads_updated_at BEFORE UPDATE ON public.vanguard_email_threads FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_email_automation_rules_updated_at BEFORE UPDATE ON public.vanguard_email_automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_escalation_tickets_updated_at BEFORE UPDATE ON public.vanguard_escalation_tickets FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_escalation_agents_updated_at BEFORE UPDATE ON public.vanguard_escalation_agents FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_kb_drafts_updated_at BEFORE UPDATE ON public.vanguard_kb_drafts FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();
CREATE TRIGGER update_vanguard_kb_patterns_updated_at BEFORE UPDATE ON public.vanguard_kb_patterns FOR EACH ROW EXECUTE FUNCTION public.update_vanguard_updated_at();