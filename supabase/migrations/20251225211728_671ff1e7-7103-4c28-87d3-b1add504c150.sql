-- Add missing columns and phone number support to dark_web_monitors
ALTER TABLE public.dark_web_monitors 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS breach_data jsonb,
ADD COLUMN IF NOT EXISTS paste_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS paste_data jsonb,
ADD COLUMN IF NOT EXISTS monitor_type text DEFAULT 'email';

-- Create unique index on email + user_id for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_dark_web_monitors_email_user 
ON public.dark_web_monitors(user_id, email) 
WHERE email IS NOT NULL;

-- Create unique index on phone + user_id for upsert  
CREATE UNIQUE INDEX IF NOT EXISTS idx_dark_web_monitors_phone_user 
ON public.dark_web_monitors(user_id, phone_number) 
WHERE phone_number IS NOT NULL;