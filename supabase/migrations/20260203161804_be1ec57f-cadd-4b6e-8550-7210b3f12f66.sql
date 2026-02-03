-- =============================================================================
-- Agent Provisioning Tokens
-- Enables 1-click MSI deployment with auto-credential fetching
-- =============================================================================

-- Create provisioning tokens table
CREATE TABLE public.agent_provisioning_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    client_id UUID,
    client_name TEXT,
    device_name_prefix TEXT,
    enable_tray BOOLEAN DEFAULT true,
    
    -- Token lifecycle
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by_device_id TEXT,
    
    -- Usage limits
    max_uses INTEGER DEFAULT 1,
    use_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true
);

-- Create index for fast token lookups
CREATE INDEX idx_agent_provisioning_tokens_token ON public.agent_provisioning_tokens(token);
CREATE INDEX idx_agent_provisioning_tokens_user_id ON public.agent_provisioning_tokens(user_id);
CREATE INDEX idx_agent_provisioning_tokens_active ON public.agent_provisioning_tokens(is_active, expires_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.agent_provisioning_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own provisioning tokens"
    ON public.agent_provisioning_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own provisioning tokens"
    ON public.agent_provisioning_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own provisioning tokens"
    ON public.agent_provisioning_tokens
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own provisioning tokens"
    ON public.agent_provisioning_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.agent_provisioning_tokens IS 'Stores one-time tokens for agent auto-provisioning during MSI installation';
COMMENT ON COLUMN public.agent_provisioning_tokens.token IS 'Unique token embedded in MSI downloads for auto-provisioning';
COMMENT ON COLUMN public.agent_provisioning_tokens.max_uses IS 'Maximum number of times this token can be redeemed (default 1 for security)';
COMMENT ON COLUMN public.agent_provisioning_tokens.expires_at IS 'Token expiration - defaults to 7 days after creation';