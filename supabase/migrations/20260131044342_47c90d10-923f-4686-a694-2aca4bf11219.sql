-- Email to Queue mapping table
CREATE TABLE public.email_queue_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_config_id UUID,
    email_address TEXT NOT NULL,
    queue_id UUID REFERENCES public.ticket_queues(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, email_address)
);

-- Enable RLS
ALTER TABLE public.email_queue_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their email queue mappings"
ON public.email_queue_mappings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their email queue mappings"
ON public.email_queue_mappings FOR ALL
USING (auth.uid() = user_id);

-- Index for lookups
CREATE INDEX idx_email_queue_mappings_email ON public.email_queue_mappings(email_address);
CREATE INDEX idx_email_queue_mappings_user ON public.email_queue_mappings(user_id);