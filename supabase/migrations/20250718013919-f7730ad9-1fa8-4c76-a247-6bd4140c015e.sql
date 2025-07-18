-- Make connector_id NOT NULL and add proper constraint
ALTER TABLE public.network_scans 
ALTER COLUMN connector_id SET NOT NULL;