-- Add reset token columns to safepass_master_passwords
ALTER TABLE public.safepass_master_passwords 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;