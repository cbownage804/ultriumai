-- Create additional RMM tables for full functionality
CREATE TABLE IF NOT EXISTS public.rmm_clipboard_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  direction TEXT CHECK (direction IN ('to_agent', 'from_agent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  synced BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.rmm_file_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  session_id UUID,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_path TEXT,
  transfer_type TEXT CHECK (transfer_type IN ('upload', 'download')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  progress_percent INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.rmm_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  session_id UUID,
  event_type TEXT NOT NULL CHECK (event_type IN ('mouse', 'keyboard', 'screen', 'command', 'file_access')),
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.safedoc_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_hash TEXT,
  quarantine_reason TEXT,
  quarantined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'quarantined' CHECK (status IN ('quarantined', 'restored', 'deleted')),
  restored_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.safepass_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_id UUID,
  device_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('auto_fill', 'manual_copy', 'generated', 'viewed')),
  domain TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.rmm_clipboard_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_file_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rmm_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that allow authenticated users to manage their data
CREATE POLICY "Authenticated users can manage clipboard sync" ON public.rmm_clipboard_sync
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage file transfers" ON public.rmm_file_transfers
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view session events" ON public.rmm_session_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert session events" ON public.rmm_session_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage quarantine" ON public.safedoc_quarantine
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their password usage logs" ON public.safepass_usage_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert password usage logs" ON public.safepass_usage_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rmm_clipboard_sync_device_id ON public.rmm_clipboard_sync(device_id);
CREATE INDEX IF NOT EXISTS idx_rmm_clipboard_sync_expires_at ON public.rmm_clipboard_sync(expires_at);
CREATE INDEX IF NOT EXISTS idx_rmm_file_transfers_device_id ON public.rmm_file_transfers(device_id);
CREATE INDEX IF NOT EXISTS idx_rmm_file_transfers_status ON public.rmm_file_transfers(status);
CREATE INDEX IF NOT EXISTS idx_rmm_session_events_device_id ON public.rmm_session_events(device_id);
CREATE INDEX IF NOT EXISTS idx_rmm_session_events_timestamp ON public.rmm_session_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_safedoc_quarantine_device_id ON public.safedoc_quarantine(device_id);
CREATE INDEX IF NOT EXISTS idx_safepass_usage_logs_user_id ON public.safepass_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_safepass_usage_logs_created_at ON public.safepass_usage_logs(created_at);