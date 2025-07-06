-- Create role system for co-managed helpdesk
-- Create helpdesk role enum (skip if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpdesk_role') THEN
        CREATE TYPE public.helpdesk_role AS ENUM ('msp_admin', 'msp_staff', 'client_admin', 'client_staff');
    END IF;
END $$;

-- Create client users table for MSP client staff access
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role helpdesk_role NOT NULL DEFAULT 'client_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Create MSP staff table
CREATE TABLE IF NOT EXISTS public.msp_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role helpdesk_role NOT NULL DEFAULT 'msp_staff',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(msp_id, user_id)
);

-- Add internal notes and visibility controls to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS is_internal_visible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS assigned_by UUID,
ADD COLUMN IF NOT EXISTS msp_id UUID;

-- Create ticket comments table for threaded discussions
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  visibility_level TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;