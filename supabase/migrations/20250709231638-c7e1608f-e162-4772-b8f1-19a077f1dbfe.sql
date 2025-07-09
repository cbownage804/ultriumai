-- User Activity Tracking
CREATE TABLE public.user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  location_country TEXT,
  location_city TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Revenue Analytics Tracking
CREATE TABLE public.revenue_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  mrr DECIMAL(10,2) DEFAULT 0,
  arr DECIMAL(10,2) DEFAULT 0,
  new_customers INTEGER DEFAULT 0,
  churned_customers INTEGER DEFAULT 0,
  churn_rate DECIMAL(5,2) DEFAULT 0,
  ltv DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Health Monitoring
CREATE TABLE public.system_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'healthy',
  threshold_warning DECIMAL(10,2),
  threshold_critical DECIMAL(10,2),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workflow Automations
CREATE TABLE public.workflow_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automated Alerts
CREATE TABLE public.automated_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  recipient_emails TEXT[],
  recipient_phones TEXT[],
  trigger_conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data Export Requests (GDPR Compliance)
CREATE TABLE public.data_export_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL, -- 'export' or 'deletion'
  status TEXT NOT NULL DEFAULT 'pending',
  requested_data_types TEXT[],
  export_file_path TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for User Activity Logs
CREATE POLICY "Users can view their own activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs" 
ON public.user_activity_logs 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "System can insert activity logs" 
ON public.user_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for Revenue Analytics
CREATE POLICY "Admins can view revenue analytics" 
ON public.revenue_analytics 
FOR ALL 
USING (is_current_user_admin());

-- RLS Policies for System Health Metrics
CREATE POLICY "Admins can manage system health metrics" 
ON public.system_health_metrics 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "System can insert health metrics" 
ON public.system_health_metrics 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for Workflow Automations
CREATE POLICY "Admins can manage workflow automations" 
ON public.workflow_automations 
FOR ALL 
USING (is_current_user_admin());

-- RLS Policies for Automated Alerts
CREATE POLICY "Admins can manage automated alerts" 
ON public.automated_alerts 
FOR ALL 
USING (is_current_user_admin());

-- RLS Policies for Data Export Requests
CREATE POLICY "Users can view their own export requests" 
ON public.data_export_requests 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create export requests" 
ON public.data_export_requests 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all export requests" 
ON public.data_export_requests 
FOR ALL 
USING (is_current_user_admin());

-- Create indexes for performance
CREATE INDEX idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);
CREATE INDEX idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX idx_revenue_analytics_period ON public.revenue_analytics(period_start, period_end);
CREATE INDEX idx_system_health_metrics_type ON public.system_health_metrics(metric_type, metric_name);
CREATE INDEX idx_system_health_metrics_recorded_at ON public.system_health_metrics(recorded_at);

-- Triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_workflow_automations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_automations_updated_at
BEFORE UPDATE ON public.workflow_automations
FOR EACH ROW
EXECUTE FUNCTION public.update_workflow_automations_updated_at();