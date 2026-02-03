-- ============================================================================
-- Contact Portal Linking System
-- Links client_contacts to client_portal_users for authenticated portal access
-- ============================================================================

-- 1. Add contact_id to client_portal_users to link portal login to specific contact
ALTER TABLE public.client_portal_users 
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.client_contacts(id) ON DELETE SET NULL;

-- 2. Add portal access fields to client_contacts
ALTER TABLE public.client_contacts 
ADD COLUMN IF NOT EXISTS portal_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS portal_role text DEFAULT 'user' CHECK (portal_role IN ('admin', 'manager', 'user'));

-- 3. Create company SafeSuite settings table for configurable tool access
CREATE TABLE IF NOT EXISTS public.company_safesuite_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.rmm_customers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  safepass_enabled boolean DEFAULT false,
  safescan_enabled boolean DEFAULT false,
  safeweb_enabled boolean DEFAULT false,
  safetrack_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.company_safesuite_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_safesuite_settings
CREATE POLICY "MSP users can manage their company settings"
  ON public.company_safesuite_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- 4. Add ticket visibility preference to client_contacts
ALTER TABLE public.client_contacts 
ADD COLUMN IF NOT EXISTS can_view_all_company_tickets boolean DEFAULT false;

-- 5. Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_client_portal_users_contact_id 
  ON public.client_portal_users(contact_id);

CREATE INDEX IF NOT EXISTS idx_client_contacts_portal_enabled 
  ON public.client_contacts(client_id) WHERE portal_enabled = true;

CREATE INDEX IF NOT EXISTS idx_company_safesuite_settings_client 
  ON public.company_safesuite_settings(client_id);

-- 6. Function to auto-create portal user when contact has portal_enabled set to true
CREATE OR REPLACE FUNCTION public.create_portal_user_for_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create portal user if portal_enabled is being set to true
  IF NEW.portal_enabled = true AND (OLD IS NULL OR OLD.portal_enabled = false) THEN
    -- Check if portal user already exists for this contact
    IF NOT EXISTS (SELECT 1 FROM public.client_portal_users WHERE contact_id = NEW.id) THEN
      -- Insert new portal user
      INSERT INTO public.client_portal_users (
        client_id,
        contact_id,
        email,
        full_name,
        role,
        is_active
      ) VALUES (
        NEW.client_id,
        NEW.id,
        NEW.email,
        NEW.contact_name,
        CASE 
          WHEN NEW.portal_role = 'admin' THEN 'admin'
          WHEN NEW.portal_role = 'manager' THEN 'manager'
          ELSE 'user'
        END,
        true
      );
    END IF;
  END IF;
  
  -- If portal_enabled is being disabled, deactivate the portal user
  IF NEW.portal_enabled = false AND OLD IS NOT NULL AND OLD.portal_enabled = true THEN
    UPDATE public.client_portal_users 
    SET is_active = false 
    WHERE contact_id = NEW.id;
  END IF;
  
  -- Sync role if contact role changes
  IF NEW.portal_role IS DISTINCT FROM OLD.portal_role AND NEW.portal_enabled = true THEN
    UPDATE public.client_portal_users 
    SET role = CASE 
      WHEN NEW.portal_role = 'admin' THEN 'admin'
      WHEN NEW.portal_role = 'manager' THEN 'manager'
      ELSE 'user'
    END
    WHERE contact_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_create_portal_user ON public.client_contacts;

CREATE TRIGGER trigger_create_portal_user
  AFTER INSERT OR UPDATE OF portal_enabled, portal_role ON public.client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_portal_user_for_contact();

-- 7. Function for portal users to check if they can view a ticket
CREATE OR REPLACE FUNCTION public.portal_user_can_view_ticket(
  p_portal_user_id uuid,
  p_ticket_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_id uuid;
  v_client_id uuid;
  v_can_view_all boolean;
  v_ticket_contact_id uuid;
  v_ticket_customer_id uuid;
BEGIN
  -- Get portal user's contact info
  SELECT pu.contact_id, pu.client_id, c.can_view_all_company_tickets
  INTO v_contact_id, v_client_id, v_can_view_all
  FROM public.client_portal_users pu
  LEFT JOIN public.client_contacts c ON c.id = pu.contact_id
  WHERE pu.id = p_portal_user_id;
  
  IF v_contact_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get ticket info
  SELECT contact_id, customer_id
  INTO v_ticket_contact_id, v_ticket_customer_id
  FROM public.helpdesk_tickets
  WHERE id = p_ticket_id;
  
  -- Check if ticket belongs to same company
  IF v_ticket_customer_id != v_client_id THEN
    RETURN false;
  END IF;
  
  -- Admins/managers can view all company tickets
  IF v_can_view_all = true THEN
    RETURN true;
  END IF;
  
  -- Regular users can only view their own tickets
  RETURN v_ticket_contact_id = v_contact_id;
END;
$$;

-- 8. Create default SafeSuite settings when a customer is created
CREATE OR REPLACE FUNCTION public.create_default_safesuite_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_safesuite_settings (client_id, user_id)
  VALUES (NEW.id, NEW.user_id)
  ON CONFLICT (client_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_safesuite_settings ON public.rmm_customers;

CREATE TRIGGER trigger_create_safesuite_settings
  AFTER INSERT ON public.rmm_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_safesuite_settings();