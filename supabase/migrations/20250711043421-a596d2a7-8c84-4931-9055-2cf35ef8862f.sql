-- Create client email configurations table for per-client email settings
CREATE TABLE IF NOT EXISTS public.client_email_configs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL,
    incoming_email text NOT NULL,
    outgoing_from_email text NOT NULL,
    outgoing_from_name text NOT NULL DEFAULT 'Support Team',
    email_signature text,
    auto_response_enabled boolean DEFAULT true,
    auto_response_template text DEFAULT 'Thank you for contacting us. Your ticket has been created and we will respond shortly.',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on client email configs
ALTER TABLE public.client_email_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for MSP to manage their client email configs
CREATE POLICY "MSPs can manage their client email configurations" ON public.client_email_configs
FOR ALL USING (
    client_id IN (
        SELECT id FROM public.msp_clients WHERE msp_id IN (
            SELECT id FROM public.msps WHERE user_id = auth.uid()
        )
    )
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_email_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_email_configs_updated_at
  BEFORE UPDATE ON public.client_email_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_client_email_configs_updated_at();