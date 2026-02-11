
-- Per-MSP MeshCentral server configuration
CREATE TABLE public.meshcentral_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  msp_id UUID REFERENCES public.msps(id) ON DELETE CASCADE,
  server_url TEXT NOT NULL,
  admin_username TEXT NOT NULL,
  admin_password_encrypted TEXT NOT NULL,
  mesh_group_prefix TEXT DEFAULT 'Vanguard',
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, msp_id)
);

-- Enable RLS
ALTER TABLE public.meshcentral_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own configs
CREATE POLICY "Users can view their own meshcentral configs"
  ON public.meshcentral_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meshcentral configs"
  ON public.meshcentral_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meshcentral configs"
  ON public.meshcentral_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meshcentral configs"
  ON public.meshcentral_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_meshcentral_configs_updated_at
  BEFORE UPDATE ON public.meshcentral_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vanguard_updated_at();
