-- Create technician skills/expertise table for smart routing
CREATE TABLE IF NOT EXISTS public.helpdesk_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  email text,
  is_active boolean DEFAULT true,
  -- Skills and expertise
  specializations text[] DEFAULT '{}',
  skill_levels jsonb DEFAULT '{}', -- e.g., {"network": 5, "security": 4, "hardware": 3}
  certifications text[] DEFAULT '{}',
  -- Workload metrics
  current_ticket_count integer DEFAULT 0,
  max_concurrent_tickets integer DEFAULT 10,
  avg_resolution_time_minutes integer,
  -- Availability
  availability_status text DEFAULT 'available', -- available, busy, away, offline
  shift_start time,
  shift_end time,
  timezone text DEFAULT 'UTC',
  -- Performance metrics
  tickets_resolved_total integer DEFAULT 0,
  tickets_resolved_this_month integer DEFAULT 0,
  avg_satisfaction_rating numeric(3,2),
  first_response_avg_minutes integer,
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.helpdesk_technicians ENABLE ROW LEVEL SECURITY;

-- Policies for technician management
CREATE POLICY "Technicians are viewable by authenticated users"
  ON public.helpdesk_technicians FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage technicians"
  ON public.helpdesk_technicians FOR ALL
  USING (true);

-- Create knowledge base articles table
CREATE TABLE IF NOT EXISTS public.helpdesk_kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  category text NOT NULL,
  subcategory text,
  tags text[] DEFAULT '{}',
  keywords text[] DEFAULT '{}',
  -- Usage metrics
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  times_linked_to_tickets integer DEFAULT 0,
  -- Status
  is_published boolean DEFAULT true,
  is_internal boolean DEFAULT false, -- internal = tech-only
  -- Metadata
  author_id uuid,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.helpdesk_kb_articles ENABLE ROW LEVEL SECURITY;

-- Policies for KB
CREATE POLICY "Published KB articles are viewable by all"
  ON public.helpdesk_kb_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage KB articles"
  ON public.helpdesk_kb_articles FOR ALL
  USING (true);

-- Add AI routing fields to tickets
ALTER TABLE public.vanguard_service_tickets
ADD COLUMN IF NOT EXISTS ai_recommended_technician_id uuid REFERENCES public.helpdesk_technicians(id),
ADD COLUMN IF NOT EXISTS ai_routing_reason text,
ADD COLUMN IF NOT EXISTS ai_routing_confidence integer,
ADD COLUMN IF NOT EXISTS ai_suggested_kb_articles uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_kb_article_relevance jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_predicted_sla_hours numeric(5,2),
ADD COLUMN IF NOT EXISTS ai_sla_confidence integer,
ADD COLUMN IF NOT EXISTS ai_sla_factors text[],
ADD COLUMN IF NOT EXISTS ai_complexity_score integer,
ADD COLUMN IF NOT EXISTS actual_resolution_hours numeric(5,2);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_technicians_availability ON public.helpdesk_technicians(availability_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_technicians_skills ON public.helpdesk_technicians USING GIN(specializations);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON public.helpdesk_kb_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON public.helpdesk_kb_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kb_articles_keywords ON public.helpdesk_kb_articles USING GIN(keywords);

-- Insert sample technicians
INSERT INTO public.helpdesk_technicians (user_id, display_name, email, specializations, skill_levels, certifications, availability_status)
VALUES 
  (gen_random_uuid(), 'Alex Chen', 'alex.chen@ultrium.ai', ARRAY['network', 'security', 'firewall'], '{"network": 5, "security": 5, "hardware": 3, "software": 4}', ARRAY['CCNA', 'Security+', 'CEH'], 'available'),
  (gen_random_uuid(), 'Sarah Johnson', 'sarah.johnson@ultrium.ai', ARRAY['software', 'email', 'microsoft365'], '{"network": 3, "security": 3, "software": 5, "email": 5}', ARRAY['MCSE', 'Azure Administrator'], 'available'),
  (gen_random_uuid(), 'Mike Torres', 'mike.torres@ultrium.ai', ARRAY['hardware', 'printer', 'mobile'], '{"hardware": 5, "printer": 5, "mobile": 4, "network": 3}', ARRAY['A+', 'Network+'], 'available'),
  (gen_random_uuid(), 'Emily Wong', 'emily.wong@ultrium.ai', ARRAY['security', 'account', 'data'], '{"security": 5, "account": 5, "data": 4, "network": 4}', ARRAY['CISSP', 'CISM'], 'available')
ON CONFLICT DO NOTHING;

-- Insert sample KB articles
INSERT INTO public.helpdesk_kb_articles (title, content, excerpt, category, subcategory, tags, keywords)
VALUES 
  ('How to Reset Your Password', 'Step-by-step guide to reset your password using self-service portal...', 'Reset your password in 3 easy steps', 'security', 'password', ARRAY['password', 'reset', 'account'], ARRAY['forgot password', 'can''t login', 'locked out', 'password expired']),
  ('VPN Connection Troubleshooting', 'Common VPN issues and how to resolve them...', 'Fix VPN connectivity problems', 'network', 'vpn', ARRAY['vpn', 'connection', 'remote'], ARRAY['vpn not working', 'can''t connect vpn', 'remote access']),
  ('Outlook Email Configuration', 'Configure Outlook for your corporate email...', 'Set up Outlook email client', 'email', 'outlook', ARRAY['outlook', 'email', 'configuration'], ARRAY['setup outlook', 'email not syncing', 'add email account']),
  ('Printer Setup Guide', 'How to add and configure network printers...', 'Connect to office printers', 'hardware', 'printer', ARRAY['printer', 'setup', 'network'], ARRAY['add printer', 'printer not working', 'can''t print']),
  ('Two-Factor Authentication Setup', 'Enable 2FA for enhanced security...', 'Secure your account with 2FA', 'security', 'mfa', ARRAY['2fa', 'mfa', 'security'], ARRAY['enable 2fa', 'authenticator app', 'verification code'])
ON CONFLICT DO NOTHING;