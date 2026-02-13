
-- Add product interest and primary product columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_product text,
ADD COLUMN IF NOT EXISTS product_interests text[];
