-- =============================================
-- Portal User Management System
-- =============================================

-- Create enum for portal user roles
DO $$ BEGIN
  CREATE TYPE public.portal_user_role AS ENUM ('admin', 'manager', 'user', 'readonly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add MFA columns to client_portal_users if not exist
ALTER TABLE public.client_portal_users 
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret text,
  ADD COLUMN IF NOT EXISTS mfa_backup_codes text[],
  ADD COLUMN IF NOT EXISTS mfa_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invited_at timestamp with time zone;

-- Create portal user permissions table for granular access
CREATE TABLE IF NOT EXISTS public.portal_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_user_id uuid REFERENCES public.client_portal_users(id) ON DELETE CASCADE NOT NULL,
  
  -- Module access toggles
  can_view_tickets boolean DEFAULT true,
  can_create_tickets boolean DEFAULT true,
  can_view_all_tickets boolean DEFAULT false,
  can_view_devices boolean DEFAULT true,
  can_view_billing boolean DEFAULT false,
  can_access_safepass boolean DEFAULT false,
  can_access_safescan boolean DEFAULT false,
  can_access_safeweb boolean DEFAULT false,
  can_access_safetrack boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_view_reports boolean DEFAULT false,
  
  -- Custom permissions as JSON for extensibility
  custom_permissions jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  UNIQUE(portal_user_id)
);

-- Create user invitations table
CREATE TABLE IF NOT EXISTS public.portal_user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.msp_clients(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  role portal_user_role DEFAULT 'user' NOT NULL,
  
  -- Invitation metadata
  invite_token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL,
  invited_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  
  -- Status tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  accepted_at timestamp with time zone,
  
  -- Permissions to apply on acceptance
  permissions jsonb DEFAULT '{}',
  
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.portal_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS for portal_user_permissions
-- MSP users can manage permissions for their clients' portal users
CREATE POLICY "msp_manage_portal_permissions" ON public.portal_user_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_portal_users cpu
      JOIN public.msp_clients mc ON cpu.client_id = mc.id
      JOIN public.msps m ON mc.msp_id = m.id
      WHERE cpu.id = portal_user_id
      AND m.user_id = auth.uid()
    )
    OR is_admin_user()
  );

-- RLS for portal_user_invitations
-- MSP users can manage invitations for their clients
CREATE POLICY "msp_manage_invitations" ON public.portal_user_invitations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.msp_clients mc
      JOIN public.msps m ON mc.msp_id = m.id
      WHERE mc.id = client_id
      AND m.user_id = auth.uid()
    )
    OR is_admin_user()
  );

-- Service role access for edge functions
CREATE POLICY "service_role_permissions" ON public.portal_user_permissions
  FOR ALL USING (is_service_role());
  
CREATE POLICY "service_role_invitations" ON public.portal_user_invitations
  FOR ALL USING (is_service_role());

-- Function to get role-based default permissions
CREATE OR REPLACE FUNCTION public.get_default_permissions_for_role(p_role portal_user_role)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_role
    WHEN 'admin' THEN
      RETURN jsonb_build_object(
        'can_view_tickets', true,
        'can_create_tickets', true,
        'can_view_all_tickets', true,
        'can_view_devices', true,
        'can_view_billing', true,
        'can_access_safepass', true,
        'can_access_safescan', true,
        'can_access_safeweb', true,
        'can_access_safetrack', true,
        'can_manage_users', true,
        'can_view_reports', true
      );
    WHEN 'manager' THEN
      RETURN jsonb_build_object(
        'can_view_tickets', true,
        'can_create_tickets', true,
        'can_view_all_tickets', true,
        'can_view_devices', true,
        'can_view_billing', false,
        'can_access_safepass', true,
        'can_access_safescan', true,
        'can_access_safeweb', true,
        'can_access_safetrack', true,
        'can_manage_users', false,
        'can_view_reports', true
      );
    WHEN 'user' THEN
      RETURN jsonb_build_object(
        'can_view_tickets', true,
        'can_create_tickets', true,
        'can_view_all_tickets', false,
        'can_view_devices', true,
        'can_view_billing', false,
        'can_access_safepass', false,
        'can_access_safescan', false,
        'can_access_safeweb', false,
        'can_access_safetrack', false,
        'can_manage_users', false,
        'can_view_reports', false
      );
    WHEN 'readonly' THEN
      RETURN jsonb_build_object(
        'can_view_tickets', true,
        'can_create_tickets', false,
        'can_view_all_tickets', false,
        'can_view_devices', true,
        'can_view_billing', false,
        'can_access_safepass', false,
        'can_access_safescan', false,
        'can_access_safeweb', false,
        'can_access_safetrack', false,
        'can_manage_users', false,
        'can_view_reports', false
      );
    ELSE
      RETURN '{}'::jsonb;
  END CASE;
END;
$$;

-- Trigger to auto-create permissions when portal user is created
CREATE OR REPLACE FUNCTION public.create_portal_user_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_perms jsonb;
  user_role portal_user_role;
BEGIN
  -- Map text role to enum
  user_role := CASE NEW.role
    WHEN 'admin' THEN 'admin'::portal_user_role
    WHEN 'manager' THEN 'manager'::portal_user_role
    WHEN 'user' THEN 'user'::portal_user_role
    WHEN 'readonly' THEN 'readonly'::portal_user_role
    ELSE 'user'::portal_user_role
  END;
  
  default_perms := get_default_permissions_for_role(user_role);
  
  INSERT INTO public.portal_user_permissions (
    portal_user_id,
    can_view_tickets,
    can_create_tickets,
    can_view_all_tickets,
    can_view_devices,
    can_view_billing,
    can_access_safepass,
    can_access_safescan,
    can_access_safeweb,
    can_access_safetrack,
    can_manage_users,
    can_view_reports
  ) VALUES (
    NEW.id,
    COALESCE((default_perms->>'can_view_tickets')::boolean, true),
    COALESCE((default_perms->>'can_create_tickets')::boolean, true),
    COALESCE((default_perms->>'can_view_all_tickets')::boolean, false),
    COALESCE((default_perms->>'can_view_devices')::boolean, true),
    COALESCE((default_perms->>'can_view_billing')::boolean, false),
    COALESCE((default_perms->>'can_access_safepass')::boolean, false),
    COALESCE((default_perms->>'can_access_safescan')::boolean, false),
    COALESCE((default_perms->>'can_access_safeweb')::boolean, false),
    COALESCE((default_perms->>'can_access_safetrack')::boolean, false),
    COALESCE((default_perms->>'can_manage_users')::boolean, false),
    COALESCE((default_perms->>'can_view_reports')::boolean, false)
  )
  ON CONFLICT (portal_user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto permissions
DROP TRIGGER IF EXISTS create_portal_user_permissions_trigger ON public.client_portal_users;
CREATE TRIGGER create_portal_user_permissions_trigger
  AFTER INSERT ON public.client_portal_users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_portal_user_permissions();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portal_permissions_user ON public.portal_user_permissions(portal_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_client ON public.portal_user_invitations(client_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.portal_user_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.portal_user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.portal_user_invitations(status);

-- Add updated_at trigger for permissions
CREATE TRIGGER update_portal_permissions_updated_at
  BEFORE UPDATE ON public.portal_user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();