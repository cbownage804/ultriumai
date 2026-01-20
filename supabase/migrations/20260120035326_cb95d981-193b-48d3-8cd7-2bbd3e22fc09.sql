-- Create storage bucket for SafePass attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'safepass-attachments', 
  'safepass-attachments', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/json']
);

-- RLS policies for safepass-attachments bucket
CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'safepass-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'safepass-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'safepass-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'safepass-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add password expiration fields to entries
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expiration_reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create breach scan history table for tracking scans
CREATE TABLE IF NOT EXISTS public.safepass_breach_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'scheduled', 'automatic'
  total_entries_scanned INTEGER DEFAULT 0,
  compromised_count INTEGER DEFAULT 0,
  weak_count INTEGER DEFAULT 0,
  reused_count INTEGER DEFAULT 0,
  scan_results JSONB DEFAULT '{}',
  overall_score INTEGER DEFAULT 100,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on breach scans
ALTER TABLE public.safepass_breach_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own breach scans"
ON public.safepass_breach_scans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own breach scans"
ON public.safepass_breach_scans FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create shared vault access table for team sharing
CREATE TABLE IF NOT EXISTS public.safepass_shared_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES public.safepass_entries(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin'
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shared access
ALTER TABLE public.safepass_shared_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage shared access"
ON public.safepass_shared_access FOR ALL
USING (auth.uid() = owner_user_id);

CREATE POLICY "Recipients can view their shared access"
ON public.safepass_shared_access FOR SELECT
USING (auth.uid() = shared_with_user_id);

-- Create password expiration reminders table
CREATE TABLE IF NOT EXISTS public.safepass_expiration_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.safepass_entries(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL DEFAULT 'expiration', -- 'expiration', 'rotation', 'breach'
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reminders
ALTER TABLE public.safepass_expiration_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
ON public.safepass_expiration_reminders FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_safepass_entries_expiration ON public.safepass_entries(password_expires_at) WHERE password_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_safepass_breach_scans_user ON public.safepass_breach_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_safepass_shared_access_recipient ON public.safepass_shared_access(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_safepass_reminders_due ON public.safepass_expiration_reminders(due_date) WHERE NOT is_dismissed;