-- Add the missing addons column to vanguard_subscriptions
ALTER TABLE public.vanguard_subscriptions 
ADD COLUMN IF NOT EXISTS addons text[] DEFAULT '{}';

-- Set admin override for the platform owner so they have full access
-- Also populate all addons for their account
UPDATE public.vanguard_subscriptions 
SET admin_override = true, 
    status = 'manual',
    addons = ARRAY['pursuit-xdr', 'sentinel-saas', 'recon-pentest', 'cortex-ai', 'comply', 'cross-client-soc', 'atlas-docs', 'ai-copilot', 'network-discovery']
WHERE user_id = 'b8cfe427-6c70-456c-a793-2279f9ddae40';