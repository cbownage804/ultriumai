-- AI Chat conversations table
CREATE TABLE IF NOT EXISTS public.helpdesk_chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  client_id uuid,
  user_email text,
  user_name text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  status text DEFAULT 'active', -- active, resolved, escalated
  resolution_type text, -- ai_resolved, ticket_created, abandoned
  created_ticket_id uuid,
  satisfaction_rating integer,
  ai_resolved boolean DEFAULT false,
  language_detected text,
  messages_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS public.helpdesk_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.helpdesk_chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL, -- user, assistant, system
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Canned responses table
CREATE TABLE IF NOT EXISTS public.helpdesk_canned_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  shortcut text, -- e.g., "/password" triggers password reset response
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sentiment tracking table (for trend dashboard)
CREATE TABLE IF NOT EXISTS public.helpdesk_sentiment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid,
  conversation_id uuid,
  sentiment text NOT NULL, -- frustrated, urgent, confused, neutral, appreciative
  frustration_level integer,
  recorded_at timestamptz DEFAULT now(),
  source text DEFAULT 'ticket', -- ticket, chat, feedback
  client_id uuid
);

-- Proactive issue patterns table
CREATE TABLE IF NOT EXISTS public.helpdesk_issue_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name text NOT NULL,
  pattern_description text,
  detection_criteria jsonb NOT NULL,
  affected_category text,
  occurrence_count integer DEFAULT 0,
  last_occurrence timestamptz,
  severity text DEFAULT 'medium',
  auto_alert boolean DEFAULT false,
  alert_threshold integer DEFAULT 5,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Ticket handoff history
CREATE TABLE IF NOT EXISTS public.helpdesk_ticket_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  from_technician_id uuid,
  to_technician_id uuid,
  handoff_reason text,
  ai_generated_summary text,
  context_notes text,
  handoff_at timestamptz DEFAULT now()
);

-- Add translation and prediction fields to tickets
ALTER TABLE public.vanguard_service_tickets
ADD COLUMN IF NOT EXISTS original_language text,
ADD COLUMN IF NOT EXISTS translated_title text,
ADD COLUMN IF NOT EXISTS translated_description text,
ADD COLUMN IF NOT EXISTS ai_escalation_probability integer,
ADD COLUMN IF NOT EXISTS ai_escalation_factors text[],
ADD COLUMN IF NOT EXISTS ai_duplicate_of uuid,
ADD COLUMN IF NOT EXISTS ai_duplicate_confidence integer,
ADD COLUMN IF NOT EXISTS ai_handoff_summary text;

-- Enable RLS
ALTER TABLE public.helpdesk_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_sentiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_issue_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_ticket_handoffs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Chat conversations public access" ON public.helpdesk_chat_conversations FOR ALL USING (true);
CREATE POLICY "Chat messages public access" ON public.helpdesk_chat_messages FOR ALL USING (true);
CREATE POLICY "Canned responses viewable by all" ON public.helpdesk_canned_responses FOR SELECT USING (is_active = true);
CREATE POLICY "Canned responses admin manage" ON public.helpdesk_canned_responses FOR ALL USING (true);
CREATE POLICY "Sentiment logs access" ON public.helpdesk_sentiment_logs FOR ALL USING (true);
CREATE POLICY "Issue patterns access" ON public.helpdesk_issue_patterns FOR ALL USING (true);
CREATE POLICY "Handoffs access" ON public.helpdesk_ticket_handoffs FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON public.helpdesk_chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON public.helpdesk_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_logs_date ON public.helpdesk_sentiment_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_issue_patterns_category ON public.helpdesk_issue_patterns(affected_category);

-- Sample canned responses
INSERT INTO public.helpdesk_canned_responses (title, content, category, tags, keywords, shortcut) VALUES
('Password Reset Instructions', 'To reset your password:\n\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your inbox for the reset link\n5. Follow the link to create a new password\n\nIf you don''t receive the email within 5 minutes, check your spam folder.', 'security', ARRAY['password', 'reset', 'login'], ARRAY['forgot password', 'reset password', 'can''t login'], '/password'),
('VPN Connection Steps', 'To connect to VPN:\n\n1. Open the VPN client application\n2. Enter your username and password\n3. Click "Connect"\n4. Wait for the connection to establish\n\nTroubleshooting:\n- Restart the VPN client\n- Check your internet connection\n- Try a different VPN server', 'network', ARRAY['vpn', 'remote', 'connection'], ARRAY['vpn not working', 'connect vpn', 'remote access'], '/vpn'),
('Ticket Received Acknowledgment', 'Thank you for contacting IT Support. We have received your request and a technician will be assigned shortly.\n\nTicket Reference: [TICKET_ID]\nExpected Response Time: [SLA_TIME]\n\nFor urgent issues, please call the IT Helpdesk directly.', 'general', ARRAY['acknowledgment', 'received'], ARRAY['ticket received', 'confirmation'], '/ack')
ON CONFLICT DO NOTHING;