-- Fix the device_name constraint issue by allowing null values or providing a default
ALTER TABLE public.safenet_devices 
ALTER COLUMN device_name DROP NOT NULL;