-- Create remaining tables with correct column names
DO $$ 
BEGIN
  -- API Keys for Third-party Integrations
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_api_keys') THEN
    CREATE TABLE public.msp_api_keys (
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
    
    ALTER TABLE public.msp_api_keys ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can manage their API keys" ON public.msp_api_keys
      FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));
      
    CREATE INDEX idx_msp_api_keys_msp_id ON public.msp_api_keys(msp_id);
    CREATE INDEX idx_msp_api_keys_hash ON public.msp_api_keys(key_hash);
  END IF;

  -- API Usage Tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_api_usage') THEN
    CREATE TABLE public.msp_api_usage (
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
    
    ALTER TABLE public.msp_api_usage ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can view their API usage" ON public.msp_api_usage
      FOR SELECT USING (api_key_id IN (SELECT id FROM msp_api_keys WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid())));
    
    CREATE POLICY "System can insert API usage" ON public.msp_api_usage
      FOR INSERT WITH CHECK (true);
      
    CREATE INDEX idx_msp_api_usage_key_id ON public.msp_api_usage(api_key_id);
    CREATE INDEX idx_msp_api_usage_created ON public.msp_api_usage(created_at DESC);
  END IF;

  -- Client Portal Access
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_client_portal_access') THEN
    CREATE TABLE public.msp_client_portal_access (
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
    
    ALTER TABLE public.msp_client_portal_access ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can manage client portal access" ON public.msp_client_portal_access
      FOR ALL USING (client_id IN (SELECT id FROM msp_clients WHERE msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid())));
      
    CREATE INDEX idx_msp_client_portal_client_id ON public.msp_client_portal_access(client_id);
    CREATE INDEX idx_msp_client_portal_email ON public.msp_client_portal_access(user_email);
  END IF;

  -- QuickBooks Data Sync
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'msp_quickbooks_sync_log') THEN
    CREATE TABLE public.msp_quickbooks_sync_log (
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
    
    ALTER TABLE public.msp_quickbooks_sync_log ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "MSP can view their sync logs" ON public.msp_quickbooks_sync_log
      FOR SELECT USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));
    
    CREATE POLICY "System can insert sync logs" ON public.msp_quickbooks_sync_log
      FOR INSERT WITH CHECK (true);
      
    CREATE POLICY "System can update sync logs" ON public.msp_quickbooks_sync_log
      FOR UPDATE USING (true);
      
    CREATE INDEX idx_msp_quickbooks_sync_msp_id ON public.msp_quickbooks_sync_log(msp_id);
    CREATE INDEX idx_msp_quickbooks_sync_started ON public.msp_quickbooks_sync_log(started_at DESC);
  END IF;
END $$;