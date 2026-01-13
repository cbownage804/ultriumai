-- SafePass standalone user accounts table
-- Tracks SafePass users, their subscription status, and Vanguard linking
CREATE TABLE public.safepass_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'business', 'enterprise')),
    subscription_started_at TIMESTAMP WITH TIME ZONE,
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    -- Vanguard linking
    linked_vanguard_client_id TEXT,
    linked_at TIMESTAMP WITH TIME ZONE,
    linked_by UUID,
    -- MSP provisioning
    provisioned_by_msp UUID,
    provisioned_at TIMESTAMP WITH TIME ZONE,
    msp_client_id TEXT,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safepass_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own account
CREATE POLICY "Users can view their own SafePass account"
ON public.safepass_accounts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own account
CREATE POLICY "Users can update their own SafePass account"
ON public.safepass_accounts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can insert their own account
CREATE POLICY "Users can insert their own SafePass account"
ON public.safepass_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- MSP provisioned accounts table (for MSP to create accounts for clients)
CREATE TABLE public.safepass_msp_invites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    msp_user_id UUID NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    client_id TEXT,
    invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    invite_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safepass_msp_invites ENABLE ROW LEVEL SECURITY;

-- MSP can view their own invites
CREATE POLICY "MSP can view their own SafePass invites"
ON public.safepass_msp_invites
FOR SELECT
USING (auth.uid() = msp_user_id);

-- MSP can create invites
CREATE POLICY "MSP can create SafePass invites"
ON public.safepass_msp_invites
FOR INSERT
WITH CHECK (auth.uid() = msp_user_id);

-- MSP can update their own invites
CREATE POLICY "MSP can update their own SafePass invites"
ON public.safepass_msp_invites
FOR UPDATE
USING (auth.uid() = msp_user_id);

-- Anyone can view invites by token (for accepting)
CREATE POLICY "Anyone can view invite by token"
ON public.safepass_msp_invites
FOR SELECT
USING (true);

-- Vanguard link requests table
CREATE TABLE public.safepass_vanguard_link_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    safepass_user_id UUID NOT NULL,
    requested_vanguard_client_id TEXT,
    request_type TEXT NOT NULL DEFAULT 'upgrade' CHECK (request_type IN ('upgrade', 'link_existing')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.safepass_vanguard_link_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own link requests
CREATE POLICY "Users can view their own link requests"
ON public.safepass_vanguard_link_requests
FOR SELECT
USING (auth.uid() = safepass_user_id);

-- Users can create link requests
CREATE POLICY "Users can create link requests"
ON public.safepass_vanguard_link_requests
FOR INSERT
WITH CHECK (auth.uid() = safepass_user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_safepass_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_safepass_accounts_updated_at
    BEFORE UPDATE ON public.safepass_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_safepass_updated_at();

CREATE TRIGGER update_safepass_vanguard_link_requests_updated_at
    BEFORE UPDATE ON public.safepass_vanguard_link_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_safepass_updated_at();

-- Index for faster lookups
CREATE INDEX idx_safepass_accounts_email ON public.safepass_accounts(email);
CREATE INDEX idx_safepass_accounts_linked_vanguard ON public.safepass_accounts(linked_vanguard_client_id) WHERE linked_vanguard_client_id IS NOT NULL;
CREATE INDEX idx_safepass_msp_invites_token ON public.safepass_msp_invites(invite_token);
CREATE INDEX idx_safepass_msp_invites_email ON public.safepass_msp_invites(email);