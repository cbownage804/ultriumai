
-- Create a function that auto-assigns a MeshCentral server to a new MSP
CREATE OR REPLACE FUNCTION public.auto_assign_meshcentral_server()
RETURNS TRIGGER AS $$
DECLARE
  selected_server_id UUID;
BEGIN
  -- Find the least-loaded active server
  SELECT id INTO selected_server_id
  FROM public.meshcentral_servers
  WHERE is_active = true
    AND (max_device_capacity IS NULL OR current_device_count < max_device_capacity)
  ORDER BY current_device_count ASC
  LIMIT 1;

  -- If a server is available, create the assignment
  IF selected_server_id IS NOT NULL THEN
    INSERT INTO public.meshcentral_msp_assignments (msp_id, server_id, mesh_group_id, is_active)
    VALUES (
      NEW.id,
      selected_server_id,
      'meshgroup-' || replace(NEW.id::text, '-', ''),
      true
    );

    -- Increment the device count on the assigned server
    UPDATE public.meshcentral_servers
    SET current_device_count = current_device_count + 1,
        updated_at = now()
    WHERE id = selected_server_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to msps table
CREATE TRIGGER trg_auto_assign_meshcentral
  AFTER INSERT ON public.msps
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_meshcentral_server();
