-- Add unique constraint for the ON CONFLICT clause used in the edge function
ALTER TABLE public.safenet_devices 
ADD CONSTRAINT unique_safenet_devices_user_connector_ip 
UNIQUE (user_id, connector_key, ip_address);