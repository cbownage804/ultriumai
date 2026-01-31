-- Add missing columns to existing knowledge_base_articles table
ALTER TABLE public.knowledge_base_articles 
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS author_id UUID,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Add missing columns to tickets table for advanced features
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS merged_into_id UUID,
ADD COLUMN IF NOT EXISTS merged_ticket_ids UUID[],
ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_ticket_id UUID,
ADD COLUMN IF NOT EXISTS is_subtask BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subtask_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_id UUID;

-- Create ticket_ai_analysis if not exists
CREATE TABLE IF NOT EXISTS public.ticket_ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  suggested_category TEXT,
  category_confidence NUMERIC(3,2),
  suggested_priority TEXT,
  priority_confidence NUMERIC(3,2),
  priority_factors JSONB,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated', 'urgent')),
  sentiment_score NUMERIC(3,2),
  escalation_recommended BOOLEAN DEFAULT false,
  estimated_resolution_hours NUMERIC(6,2),
  similar_ticket_ids UUID[],
  suggested_responses JSONB,
  suggested_kb_articles UUID[],
  model_version TEXT,
  processed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Canned responses
CREATE TABLE IF NOT EXISTS public.canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  shortcut TEXT,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client contracts
CREATE TABLE IF NOT EXISTS public.client_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  contract_name TEXT NOT NULL,
  contract_type TEXT DEFAULT 'hours' CHECK (contract_type IN ('hours', 'incidents', 'unlimited', 'project')),
  start_date DATE NOT NULL,
  end_date DATE,
  total_hours NUMERIC(8,2),
  used_hours NUMERIC(8,2) DEFAULT 0,
  rollover_hours NUMERIC(8,2) DEFAULT 0,
  total_incidents INTEGER,
  used_incidents INTEGER DEFAULT 0,
  monthly_rate NUMERIC(10,2),
  overage_rate NUMERIC(10,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
  auto_renew BOOLEAN DEFAULT false,
  renewal_terms JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ticket approvals
CREATE TABLE IF NOT EXISTS public.ticket_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID,
  user_id UUID NOT NULL,
  approval_type TEXT NOT NULL,
  requested_by UUID NOT NULL,
  approver_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  request_reason TEXT,
  response_reason TEXT,
  request_data JSONB,
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- On-call schedules
CREATE TABLE IF NOT EXISTS public.oncall_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  schedule_name TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  escalation_timeout_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- On-call rotations
CREATE TABLE IF NOT EXISTS public.oncall_rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID,
  technician_id UUID NOT NULL,
  technician_name TEXT NOT NULL,
  technician_email TEXT,
  technician_phone TEXT,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  rotation_type TEXT DEFAULT 'primary' CHECK (rotation_type IN ('primary', 'secondary', 'backup')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Dispatch appointments
CREATE TABLE IF NOT EXISTS public.dispatch_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_id UUID,
  technician_id UUID NOT NULL,
  technician_name TEXT NOT NULL,
  client_id UUID,
  appointment_type TEXT DEFAULT 'onsite' CHECK (appointment_type IN ('onsite', 'remote', 'phone', 'meeting')),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  travel_time_minutes INTEGER,
  notes TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Live chat conversations
CREATE TABLE IF NOT EXISTS public.live_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID,
  contact_id UUID,
  visitor_name TEXT,
  visitor_email TEXT,
  assigned_technician_id UUID,
  assigned_technician_name TEXT,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'resolved', 'transferred', 'missed')),
  channel TEXT DEFAULT 'widget' CHECK (channel IN ('widget', 'portal', 'teams', 'slack')),
  ticket_id UUID,
  started_at TIMESTAMPTZ DEFAULT now(),
  first_response_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Live chat messages
CREATE TABLE IF NOT EXISTS public.live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'technician', 'bot', 'system')),
  sender_name TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'typing')),
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Remote sessions
CREATE TABLE IF NOT EXISTS public.remote_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ticket_id UUID,
  agent_id UUID,
  client_id UUID,
  technician_id UUID,
  technician_name TEXT,
  session_type TEXT DEFAULT 'remote_control' CHECK (session_type IN ('remote_control', 'screen_share', 'file_transfer', 'chat')),
  provider TEXT DEFAULT 'rustdesk' CHECK (provider IN ('rustdesk', 'teamviewer', 'anydesk', 'connectwise', 'splashtop', 'custom')),
  session_id TEXT,
  session_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connecting', 'active', 'disconnected', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Community posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  author_client_id UUID,
  author_contact_id UUID,
  author_name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'published' CHECK (status IN ('pending', 'published', 'flagged', 'archived')),
  is_pinned BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Community replies
CREATE TABLE IF NOT EXISTS public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID,
  author_name TEXT NOT NULL,
  author_client_id UUID,
  author_contact_id UUID,
  is_staff_reply BOOLEAN DEFAULT false,
  content TEXT NOT NULL,
  is_accepted_answer BOOLEAN DEFAULT false,
  upvote_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.ticket_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oncall_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oncall_rotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispatch_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own ticket ai" ON public.ticket_ai_analysis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own canned responses" ON public.canned_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own contracts" ON public.client_contracts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own approvals" ON public.ticket_approvals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own oncall schedules" ON public.oncall_schedules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own dispatch" ON public.dispatch_appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own live chat" ON public.live_chat_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own remote sessions" ON public.remote_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own community" ON public.community_posts FOR ALL USING (auth.uid() = user_id);

-- Policies for child tables (via parent ownership)
CREATE POLICY "Users access own rotations" ON public.oncall_rotations FOR ALL
USING (EXISTS (SELECT 1 FROM public.oncall_schedules s WHERE s.id = schedule_id AND s.user_id = auth.uid()));

CREATE POLICY "Users access own chat messages" ON public.live_chat_messages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.live_chat_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

CREATE POLICY "Users access own community replies" ON public.community_replies FOR ALL
USING (EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND p.user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_ai_sentiment ON public.ticket_ai_analysis(sentiment, escalation_recommended);
CREATE INDEX IF NOT EXISTS idx_oncall_rotations_time ON public.oncall_rotations(schedule_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_dispatch_time ON public.dispatch_appointments(technician_id, scheduled_start);
CREATE INDEX IF NOT EXISTS idx_live_chat_status ON public.live_chat_conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_kb_search ON public.knowledge_base_articles USING GIN(search_vector) WHERE search_vector IS NOT NULL;