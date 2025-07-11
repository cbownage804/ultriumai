-- Add additional fields to support_tickets for enhanced functionality
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS requester_name text,
ADD COLUMN IF NOT EXISTS requester_email text,
ADD COLUMN IF NOT EXISTS requester_phone text,
ADD COLUMN IF NOT EXISTS asset_name text,
ADD COLUMN IF NOT EXISTS email_thread_id text,
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS sla_due_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS sla_policy_id uuid;

-- Create email ingestion settings table for MSPs
CREATE TABLE IF NOT EXISTS public.msp_email_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    msp_id uuid NOT NULL,
    business_name text NOT NULL,
    ingestion_email text NOT NULL UNIQUE,
    default_priority text DEFAULT 'medium',
    default_category text DEFAULT 'general',
    auto_assign_to uuid,
    email_signature text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on email settings
ALTER TABLE public.msp_email_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for MSP email settings
CREATE POLICY "MSPs can manage their email settings" ON public.msp_email_settings
FOR ALL USING (
    msp_id IN (
        SELECT id FROM public.msps WHERE user_id = auth.uid()
    )
);

-- Create API keys table for external integrations
CREATE TABLE IF NOT EXISTS public.integration_api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    key_name text NOT NULL,
    api_key_hash text NOT NULL,
    key_prefix text NOT NULL,
    permissions jsonb DEFAULT '{"create_tickets": true, "read_tickets": false}',
    expires_at timestamp with time zone,
    last_used_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on API keys
ALTER TABLE public.integration_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for API keys
CREATE POLICY "Users can manage their integration API keys" ON public.integration_api_keys
FOR ALL USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_msp_email_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_msp_email_settings_updated_at
  BEFORE UPDATE ON public.msp_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_msp_email_settings_updated_at();