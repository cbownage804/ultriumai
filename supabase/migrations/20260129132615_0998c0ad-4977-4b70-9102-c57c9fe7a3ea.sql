-- Add portal integration keys to vanguard_portal_settings
ALTER TABLE public.vanguard_portal_settings
ADD COLUMN IF NOT EXISTS portal_key TEXT UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN IF NOT EXISTS portal_key_created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS portal_app_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_icon_url TEXT;

-- Create index for portal key lookups
CREATE INDEX IF NOT EXISTS idx_vanguard_portal_settings_portal_key 
ON public.vanguard_portal_settings(portal_key);

-- Create table for portal app downloads tracking
CREATE TABLE IF NOT EXISTS public.vanguard_portal_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_settings_id UUID REFERENCES public.vanguard_portal_settings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  client_id UUID,
  download_type TEXT NOT NULL DEFAULT 'installer', -- 'installer', 'config_only'
  platform TEXT NOT NULL DEFAULT 'win-x64',
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.vanguard_portal_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their portal downloads" 
ON public.vanguard_portal_downloads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their portal downloads" 
ON public.vanguard_portal_downloads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update portal tickets to include portal_key reference
ALTER TABLE public.vanguard_portal_tickets
ADD COLUMN IF NOT EXISTS portal_key TEXT,
ADD COLUMN IF NOT EXISTS submitted_via TEXT DEFAULT 'web'; -- 'web', 'tray_app'

-- Create index for ticket lookups by portal key
CREATE INDEX IF NOT EXISTS idx_vanguard_portal_tickets_portal_key 
ON public.vanguard_portal_tickets(portal_key);