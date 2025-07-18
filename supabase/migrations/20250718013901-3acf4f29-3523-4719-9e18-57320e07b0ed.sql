-- Make user_id NOT NULL in network_scans table for RLS to work properly
ALTER TABLE public.network_scans 
ALTER COLUMN user_id SET NOT NULL;