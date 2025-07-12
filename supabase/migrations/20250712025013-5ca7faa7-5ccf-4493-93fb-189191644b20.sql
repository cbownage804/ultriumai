-- Add tool access configuration for MSP clients
ALTER TABLE public.msp_clients 
ADD COLUMN tool_access jsonb DEFAULT '{
  "safescan": true,
  "ultraumgpt": true,
  "safeshield": false,
  "darkweb_monitor": false,
  "reports": true
}'::jsonb;