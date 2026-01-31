-- Push Notification Tokens & Preferences
CREATE TABLE public.vanguard_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web', -- 'web', 'ios', 'android'
    device_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, device_token)
);

CREATE TABLE public.vanguard_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    sla_breach_enabled BOOLEAN DEFAULT true,
    escalation_enabled BOOLEAN DEFAULT true,
    assignment_enabled BOOLEAN DEFAULT true,
    ticket_update_enabled BOOLEAN DEFAULT true,
    security_alert_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_days TEXT[] DEFAULT '{}', -- ['saturday', 'sunday']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.vanguard_notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL, -- 'sla_breach', 'escalation', 'assignment', 'ticket_update', 'security_alert'
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Client Portal Enhancements
CREATE TABLE public.vanguard_portal_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    org_id UUID,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    appointment_type TEXT NOT NULL, -- 'consultation', 'support', 'training', 'review'
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    technician_id UUID,
    ticket_id UUID,
    meeting_link TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.vanguard_ticket_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    sender_type TEXT NOT NULL, -- 'customer', 'technician', 'system'
    sender_id UUID,
    sender_name TEXT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Voice Commands
CREATE TABLE public.vanguard_voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    command_text TEXT NOT NULL,
    intent TEXT, -- 'create_ticket', 'update_ticket', 'search', 'status', 'assign'
    entities JSONB DEFAULT '{}', -- extracted entities like ticket_id, priority, etc.
    response_text TEXT,
    action_taken JSONB,
    success BOOLEAN DEFAULT true,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.vanguard_voice_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    voice_enabled BOOLEAN DEFAULT true,
    tts_enabled BOOLEAN DEFAULT true,
    voice_id TEXT DEFAULT 'alloy', -- OpenAI TTS voice
    speech_rate NUMERIC(3,2) DEFAULT 1.0,
    wake_word TEXT DEFAULT 'hey vanguard',
    language TEXT DEFAULT 'en-US',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advanced Automations
CREATE TABLE public.vanguard_scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL, -- 'report', 'backup', 'sync', 'cleanup', 'notification'
    schedule_cron TEXT NOT NULL, -- cron expression
    schedule_timezone TEXT DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    last_status TEXT, -- 'success', 'failed', 'running'
    last_error TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.vanguard_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    webhook_name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    secret_key TEXT,
    events TEXT[] NOT NULL, -- ['ticket_created', 'ticket_updated', 'sla_breach', 'escalation']
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    headers JSONB DEFAULT '{}',
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.vanguard_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES public.vanguard_webhooks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    retry_attempt INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.vanguard_workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    trigger_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'time_based', 'event_based', 'condition_based'
    trigger_config JSONB NOT NULL, -- conditions, schedules, etc.
    action_type TEXT NOT NULL, -- 'email', 'webhook', 'assign', 'escalate', 'update_field'
    action_config JSONB NOT NULL, -- action parameters
    is_active BOOLEAN DEFAULT true,
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vanguard_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_portal_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_ticket_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_voice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vanguard_workflow_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own push tokens" ON public.vanguard_push_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notification prefs" ON public.vanguard_notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own notifications" ON public.vanguard_notification_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own appointments" ON public.vanguard_portal_appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access ticket chat" ON public.vanguard_ticket_chat_messages FOR ALL USING (true);
CREATE POLICY "Users manage own voice commands" ON public.vanguard_voice_commands FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own voice settings" ON public.vanguard_voice_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own scheduled tasks" ON public.vanguard_scheduled_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own webhooks" ON public.vanguard_webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own webhook logs" ON public.vanguard_webhook_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.vanguard_webhooks w WHERE w.id = webhook_id AND w.user_id = auth.uid())
);
CREATE POLICY "Users manage own workflow triggers" ON public.vanguard_workflow_triggers FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_push_tokens_user ON public.vanguard_push_tokens(user_id);
CREATE INDEX idx_notification_log_user ON public.vanguard_notification_log(user_id, created_at DESC);
CREATE INDEX idx_appointments_scheduled ON public.vanguard_portal_appointments(scheduled_at);
CREATE INDEX idx_ticket_chat_ticket ON public.vanguard_ticket_chat_messages(ticket_id, created_at);
CREATE INDEX idx_voice_commands_user ON public.vanguard_voice_commands(user_id, created_at DESC);
CREATE INDEX idx_scheduled_tasks_next ON public.vanguard_scheduled_tasks(next_run_at) WHERE is_active = true;
CREATE INDEX idx_webhooks_user ON public.vanguard_webhooks(user_id);
CREATE INDEX idx_webhook_logs_webhook ON public.vanguard_webhook_logs(webhook_id, created_at DESC);