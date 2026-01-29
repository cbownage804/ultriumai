-- Add SafeSuite integration columns to portal settings
ALTER TABLE public.vanguard_portal_settings
ADD COLUMN IF NOT EXISTS enable_safeweb BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safeweb_subscription_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_safetrack BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safetrack_subscription_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_safescan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS safescan_subscription_required BOOLEAN DEFAULT true;