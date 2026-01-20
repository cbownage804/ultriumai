-- Add password history table for tracking previous passwords
CREATE TABLE public.safepass_password_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID NOT NULL REFERENCES public.safepass_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_password JSONB NOT NULL,
  password_strength_score INTEGER DEFAULT 0,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add TOTP/2FA codes table
CREATE TABLE public.safepass_totp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.safepass_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_secret JSONB NOT NULL,
  issuer TEXT,
  account_label TEXT,
  algorithm TEXT DEFAULT 'SHA1',
  digits INTEGER DEFAULT 6,
  period INTEGER DEFAULT 30,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add file attachments table
CREATE TABLE public.safepass_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.safepass_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  encrypted_content TEXT,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folders table for organization
CREATE TABLE public.safepass_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.safepass_vaults(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.safepass_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add folder_id to entries for organization
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.safepass_folders(id) ON DELETE SET NULL;

-- Add password_expires_at for expiration reminders
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE;

-- Add last_password_change for tracking
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Enable RLS on all new tables
ALTER TABLE public.safepass_password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_totp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safepass_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for password history
CREATE POLICY "Users can view their own password history" 
ON public.safepass_password_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create password history" 
ON public.safepass_password_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their password history" 
ON public.safepass_password_history FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for TOTP codes
CREATE POLICY "Users can manage their own TOTP codes" 
ON public.safepass_totp_codes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for attachments
CREATE POLICY "Users can manage their own attachments" 
ON public.safepass_attachments FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for folders
CREATE POLICY "Users can manage their own folders" 
ON public.safepass_folders FOR ALL USING (auth.uid() = user_id);

-- Trigger to save password history on update
CREATE OR REPLACE FUNCTION public.save_password_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only save history if encrypted_data changed
  IF OLD.encrypted_data IS DISTINCT FROM NEW.encrypted_data THEN
    INSERT INTO public.safepass_password_history (entry_id, user_id, encrypted_password, password_strength_score)
    VALUES (OLD.id, OLD.user_id, OLD.encrypted_data, OLD.password_strength_score);
    
    -- Update last_password_change
    NEW.last_password_change = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER save_password_history_trigger
BEFORE UPDATE ON public.safepass_entries
FOR EACH ROW
EXECUTE FUNCTION public.save_password_history();

-- Create indexes for performance
CREATE INDEX idx_password_history_entry ON public.safepass_password_history(entry_id);
CREATE INDEX idx_totp_codes_user ON public.safepass_totp_codes(user_id);
CREATE INDEX idx_totp_codes_entry ON public.safepass_totp_codes(entry_id);
CREATE INDEX idx_attachments_entry ON public.safepass_attachments(entry_id);
CREATE INDEX idx_folders_vault ON public.safepass_folders(vault_id);
CREATE INDEX idx_entries_folder ON public.safepass_entries(folder_id);