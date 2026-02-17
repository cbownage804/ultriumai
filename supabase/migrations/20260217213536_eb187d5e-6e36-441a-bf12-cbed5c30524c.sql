
-- Table to store user-defined API endpoints
CREATE TABLE public.api_endpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_path TEXT NOT NULL, -- e.g. /products, /orders
  source_table TEXT NOT NULL, -- the Supabase table to query
  allowed_methods TEXT[] NOT NULL DEFAULT '{GET}', -- GET, POST, PUT, DELETE
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_auth BOOLEAN NOT NULL DEFAULT true,
  rate_limit_rpm INTEGER DEFAULT 60,
  rate_limit_rpd INTEGER DEFAULT 10000,
  allowed_fields TEXT[], -- whitelist of columns to expose (null = all)
  hidden_fields TEXT[], -- columns to always exclude
  filter_config JSONB DEFAULT '{}', -- default filters/scoping rules
  pagination_config JSONB DEFAULT '{"default_limit": 25, "max_limit": 100}',
  transform_config JSONB DEFAULT '{}', -- field renaming, computed fields
  webhook_url TEXT, -- optional webhook on mutations
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, base_path)
);

-- Enable RLS
ALTER TABLE public.api_endpoints ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own endpoints" ON public.api_endpoints
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all for gateway routing
CREATE POLICY "Service role full access" ON public.api_endpoints
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());

-- Updated at trigger
CREATE TRIGGER update_api_endpoints_updated_at
  BEFORE UPDATE ON public.api_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atlas_updated_at();

-- Table to log API endpoint usage
CREATE TABLE public.api_endpoint_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint_id UUID REFERENCES public.api_endpoints(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address INET,
  request_body JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_endpoint_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own endpoint logs" ON public.api_endpoint_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.api_endpoints e
      WHERE e.id = endpoint_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages logs" ON public.api_endpoint_logs
  FOR ALL USING (public.is_service_role())
  WITH CHECK (public.is_service_role());
