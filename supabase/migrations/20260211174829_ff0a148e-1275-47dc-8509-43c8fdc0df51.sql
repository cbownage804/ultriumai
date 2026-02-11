
-- Platform-managed MeshCentral servers (admin-only, regional)
CREATE TABLE public.meshcentral_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region TEXT NOT NULL,
  display_name TEXT NOT NULL,
  server_url TEXT NOT NULL,
  admin_username TEXT NOT NULL,
  admin_password_encrypted TEXT NOT NULL,
  max_devices INTEGER DEFAULT 5000,
  current_device_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Map MSPs to their assigned MeshCentral server
CREATE TABLE public.meshcentral_msp_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  server_id UUID NOT NULL REFERENCES public.meshcentral_servers(id),
  mesh_group_id TEXT,
  mesh_group_name TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(msp_id)
);

ALTER TABLE public.meshcentral_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meshcentral_msp_assignments ENABLE ROW LEVEL SECURITY;

-- MSPs can read their own assignment (msp_clients.msp_id = auth.uid())
CREATE POLICY "MSPs can view their own assignment"
  ON public.meshcentral_msp_assignments
  FOR SELECT
  USING (
    msp_id IN (
      SELECT id FROM public.msp_clients WHERE msp_id = auth.uid()
    )
  );

COMMENT ON TABLE public.meshcentral_configs IS 'DEPRECATED: Use meshcentral_servers + meshcentral_msp_assignments instead';
