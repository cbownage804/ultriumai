-- Add missing columns to msp_clients table
ALTER TABLE public.msp_clients 
ADD COLUMN IF NOT EXISTS endpoints integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS alerts integer DEFAULT 0;