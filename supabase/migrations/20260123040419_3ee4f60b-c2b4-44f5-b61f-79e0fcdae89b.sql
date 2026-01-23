-- Check if knowledge_base_articles exists and create if not
CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  is_internal BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  related_articles UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS if not exists (safe to rerun)
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view published articles" ON public.knowledge_base_articles;
DROP POLICY IF EXISTS "Users can manage their articles" ON public.knowledge_base_articles;

CREATE POLICY "Users can view published articles" ON public.knowledge_base_articles
  FOR SELECT USING (is_published = true OR user_id = auth.uid());
CREATE POLICY "Users can manage their articles" ON public.knowledge_base_articles
  FOR ALL USING (user_id = auth.uid());

-- ================================================
-- Notification Queue - For all notifications
-- ================================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'in_app',
  channel TEXT NOT NULL DEFAULT 'app',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notification_queue;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notification_queue;

CREATE POLICY "Users can view their notifications" ON public.notification_queue
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their notifications" ON public.notification_queue
  FOR UPDATE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notification_queue(created_at DESC);

-- ================================================
-- Analytics Aggregates - For dashboard stats
-- ================================================
CREATE TABLE IF NOT EXISTS public.analytics_aggregates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,2) DEFAULT 0,
  dimensions JSONB DEFAULT '{}',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_aggregates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their analytics" ON public.analytics_aggregates;
DROP POLICY IF EXISTS "Users can manage their analytics" ON public.analytics_aggregates;

CREATE POLICY "Users can view their analytics" ON public.analytics_aggregates
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their analytics" ON public.analytics_aggregates
  FOR ALL USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_analytics_user_type ON public.analytics_aggregates(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON public.analytics_aggregates(period_start, period_end);