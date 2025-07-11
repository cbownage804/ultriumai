-- Check if tables exist and create only missing ones
DO $$ 
BEGIN
  -- Real-time Notifications System (only create if not exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_notifications') THEN
    CREATE TABLE public.msp_notifications (
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
    
    ALTER TABLE public.msp_notifications ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can manage their notifications" ON public.msp_notifications
      FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));
    
    CREATE POLICY "System can insert notifications" ON public.msp_notifications
      FOR INSERT WITH CHECK (true);
      
    CREATE INDEX idx_msp_notifications_msp_id ON public.msp_notifications(msp_id);
    CREATE INDEX idx_msp_notifications_created_at ON public.msp_notifications(created_at DESC);
  END IF;

  -- Automated Workflows System
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_workflows') THEN
    CREATE TABLE public.msp_workflows (
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
    
    ALTER TABLE public.msp_workflows ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can manage their workflows" ON public.msp_workflows
      FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));
      
    CREATE INDEX idx_msp_workflows_msp_id ON public.msp_workflows(msp_id);
    CREATE INDEX idx_msp_workflows_active ON public.msp_workflows(is_active);
  END IF;

  -- Workflow Execution Logs
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_workflow_executions') THEN
    CREATE TABLE public.msp_workflow_executions (
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
    
    ALTER TABLE public.msp_workflow_executions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can view their workflow executions" ON public.msp_workflow_executions
      FOR SELECT USING (workflow_id IN (SELECT id FROM msp_workflows WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid())));
    
    CREATE POLICY "System can insert workflow executions" ON public.msp_workflow_executions
      FOR INSERT WITH CHECK (true);
      
    CREATE POLICY "System can update workflow executions" ON public.msp_workflow_executions
      FOR UPDATE USING (true);
      
    CREATE INDEX idx_msp_workflow_executions_workflow_id ON public.msp_workflow_executions(workflow_id);
    CREATE INDEX idx_msp_workflow_executions_status ON public.msp_workflow_executions(execution_status);
  END IF;

  -- QuickBooks Integration
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_quickbooks_config') THEN
    CREATE TABLE public.msp_quickbooks_config (
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
    
    ALTER TABLE public.msp_quickbooks_config ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can manage their QuickBooks config" ON public.msp_quickbooks_config
      FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));
      
    CREATE INDEX idx_msp_quickbooks_config_msp_id ON public.msp_quickbooks_config(msp_id);
  END IF;
END $$;