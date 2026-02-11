
-- Enable pg_net extension for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Drop the old simple trigger
DROP TRIGGER IF EXISTS trg_auto_assign_meshcentral ON public.msps;
DROP FUNCTION IF EXISTS public.auto_assign_meshcentral_server();

-- New trigger function that calls the edge function to provision a group on MeshCentral
CREATE OR REPLACE FUNCTION public.auto_provision_meshcentral()
RETURNS TRIGGER AS $$
DECLARE
  edge_url TEXT;
  service_key TEXT;
BEGIN
  -- Build the edge function URL
  edge_url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1);
  service_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key' LIMIT 1);
  
  -- Fallback: use current_setting if vault isn't available
  IF edge_url IS NULL THEN
    edge_url := current_setting('app.settings.supabase_url', true);
  END IF;
  IF service_key IS NULL THEN
    service_key := current_setting('app.settings.supabase_service_role_key', true);
  END IF;

  -- If we still don't have the URL, skip silently (server will be assigned on first use via fallback)
  IF edge_url IS NULL OR service_key IS NULL THEN
    RAISE WARNING 'Cannot auto-provision MeshCentral: missing supabase_url or service_role_key in vault/settings';
    RETURN NEW;
  END IF;

  -- Fire async HTTP call to the edge function
  PERFORM extensions.http_post(
    edge_url || '/functions/v1/vanguard-meshcentral-auth',
    jsonb_build_object(
      'action', 'provision_msp',
      'msp_id', NEW.id::text,
      'msp_name', COALESCE(NEW.name, 'MSP')
    )::text,
    'application/json',
    ARRAY[
      extensions.http_header('Authorization', 'Bearer ' || service_key)
    ]
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach to MSP creation
CREATE TRIGGER trg_auto_provision_meshcentral
  AFTER INSERT ON public.msps
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_provision_meshcentral();
