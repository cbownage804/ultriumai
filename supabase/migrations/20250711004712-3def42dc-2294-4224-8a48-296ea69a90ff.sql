-- Real-time Notifications System
CREATE TABLE IF NOT EXISTS public.msp_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  client_id UUID REFERENCES msp_clients(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('churn_risk', 'upsell_opportunity', 'payment_overdue', 'contract_renewal', 'performance_alert', 'security_alert')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  triggered_by TEXT DEFAULT 'system'
);

-- Automated Workflows System
CREATE TABLE IF NOT EXISTS public.msp_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('churn_risk_high', 'upsell_identified', 'payment_overdue', 'contract_expiring', 'performance_decline')),
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workflow Execution Logs
CREATE TABLE IF NOT EXISTS public.msp_workflow_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES msp_workflows(id) ON DELETE CASCADE,
  client_id UUID REFERENCES msp_clients(id),
  trigger_data JSONB DEFAULT '{}',
  actions_executed JSONB DEFAULT '[]',
  execution_status TEXT NOT NULL DEFAULT 'pending' CHECK (execution_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- QuickBooks Integration
CREATE TABLE IF NOT EXISTS public.msp_quickbooks_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL UNIQUE,
  company_id TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_enabled BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'daily', 'weekly')),
  sync_settings JSONB DEFAULT '{"customers": true, "invoices": true, "payments": true, "items": true}',
  webhook_endpoint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- QuickBooks Data Sync
CREATE TABLE IF NOT EXISTS public.msp_quickbooks_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('customers', 'invoices', 'payments', 'items', 'accounts')),
  records_processed INTEGER DEFAULT 0,
  records_succeeded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'running' CHECK (sync_status IN ('running', 'completed', 'failed', 'cancelled')),
  error_details JSONB DEFAULT '[]',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- API Keys for Third-party Integrations
CREATE TABLE IF NOT EXISTS public.msp_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  key_name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false}',
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(msp_id, key_name)
);

-- API Usage Tracking
CREATE TABLE IF NOT EXISTS public.msp_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES msp_api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  response_status INTEGER,
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Client Portal Access
CREATE TABLE IF NOT EXISTS public.msp_client_portal_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES msp_clients(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  access_token_hash TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{"analytics": true, "reports": true, "tickets": false}',
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, user_email)
);

-- Client Portal Activity Logs
CREATE TABLE IF NOT EXISTS public.msp_client_portal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_access_id UUID NOT NULL REFERENCES msp_client_portal_access(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.msp_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_quickbooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_quickbooks_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_client_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_client_portal_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for MSP access
CREATE POLICY "MSP can manage their notifications" ON public.msp_notifications
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSP can manage their workflows" ON public.msp_workflows
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSP can view their workflow executions" ON public.msp_workflow_executions
  FOR SELECT USING (workflow_id IN (SELECT id FROM msp_workflows WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid())));

CREATE POLICY "MSP can manage their QuickBooks config" ON public.msp_quickbooks_config
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSP can view their sync logs" ON public.msp_quickbooks_sync_log
  FOR SELECT USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSP can manage their API keys" ON public.msp_api_keys
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSP can view their API usage" ON public.msp_api_usage
  FOR SELECT USING (api_key_id IN (SELECT id FROM msp_api_keys WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid())));

CREATE POLICY "MSP can manage client portal access" ON public.msp_client_portal_access
  FOR ALL USING (client_id IN (SELECT id FROM msp_clients WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid())));

CREATE POLICY "MSP can view client portal logs" ON public.msp_client_portal_logs
  FOR SELECT USING (portal_access_id IN (SELECT id FROM msp_client_portal_access WHERE client_id IN (SELECT id FROM msp_clients WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()))));

-- System policies for automated processes
CREATE POLICY "System can insert notifications" ON public.msp_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert workflow executions" ON public.msp_workflow_executions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update workflow executions" ON public.msp_workflow_executions
  FOR UPDATE USING (true);

CREATE POLICY "System can insert sync logs" ON public.msp_quickbooks_sync_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update sync logs" ON public.msp_quickbooks_sync_log
  FOR UPDATE USING (true);

CREATE POLICY "System can insert API usage" ON public.msp_api_usage
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert portal logs" ON public.msp_client_portal_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_msp_notifications_msp_id ON public.msp_notifications(msp_id);
CREATE INDEX idx_msp_notifications_client_id ON public.msp_notifications(client_id);
CREATE INDEX idx_msp_notifications_type_priority ON public.msp_notifications(notification_type, priority);
CREATE INDEX idx_msp_notifications_created_at ON public.msp_notifications(created_at DESC);

CREATE INDEX idx_msp_workflows_msp_id ON public.msp_workflows(msp_id);
CREATE INDEX idx_msp_workflows_trigger_type ON public.msp_workflows(trigger_type);
CREATE INDEX idx_msp_workflows_active ON public.msp_workflows(is_active);

CREATE INDEX idx_msp_workflow_executions_workflow_id ON public.msp_workflow_executions(workflow_id);
CREATE INDEX idx_msp_workflow_executions_client_id ON public.msp_workflow_executions(client_id);
CREATE INDEX idx_msp_workflow_executions_status ON public.msp_workflow_executions(execution_status);

CREATE INDEX idx_msp_quickbooks_sync_msp_id ON public.msp_quickbooks_sync_log(msp_id);
CREATE INDEX idx_msp_quickbooks_sync_type ON public.msp_quickbooks_sync_log(sync_type, entity_type);
CREATE INDEX idx_msp_quickbooks_sync_created ON public.msp_quickbooks_sync_log(created_at DESC);

CREATE INDEX idx_msp_api_keys_msp_id ON public.msp_api_keys(msp_id);
CREATE INDEX idx_msp_api_keys_hash ON public.msp_api_keys(key_hash);
CREATE INDEX idx_msp_api_keys_active ON public.msp_api_keys(is_active);

CREATE INDEX idx_msp_api_usage_key_id ON public.msp_api_usage(api_key_id);
CREATE INDEX idx_msp_api_usage_created ON public.msp_api_usage(created_at DESC);

CREATE INDEX idx_msp_client_portal_client_id ON public.msp_client_portal_access(client_id);
CREATE INDEX idx_msp_client_portal_email ON public.msp_client_portal_access(user_email);
CREATE INDEX idx_msp_client_portal_active ON public.msp_client_portal_access(is_active);

-- Functions for automated triggers
CREATE OR REPLACE FUNCTION trigger_workflow_execution()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by other triggers to automatically execute workflows
  -- based on business logic changes (churn risk, upselling opportunities, etc.)
  INSERT INTO msp_workflow_executions (
    workflow_id,
    client_id,
    trigger_data,
    execution_status
  )
  SELECT 
    w.id,
    NEW.id,
    jsonb_build_object(
      'trigger_type', TG_ARGV[0],
      'trigger_table', TG_TABLE_NAME,
      'previous_values', row_to_json(OLD),
      'new_values', row_to_json(NEW)
    ),
    'pending'
  FROM msp_workflows w
  WHERE w.msp_id = NEW.msp_id 
    AND w.trigger_type = TG_ARGV[0]
    AND w.is_active = true;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_msp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_msp_workflows_updated_at
  BEFORE UPDATE ON public.msp_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_msp();

CREATE TRIGGER update_msp_quickbooks_config_updated_at
  BEFORE UPDATE ON public.msp_quickbooks_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_msp();

CREATE TRIGGER update_msp_api_keys_updated_at
  BEFORE UPDATE ON public.msp_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_msp();

CREATE TRIGGER update_msp_client_portal_access_updated_at
  BEFORE UPDATE ON public.msp_client_portal_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_msp();