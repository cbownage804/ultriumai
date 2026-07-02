
-- 1. wrayth_devices
CREATE TABLE public.wrayth_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hostname TEXT NOT NULL,
  os TEXT NOT NULL,
  os_version TEXT,
  agent_version TEXT NOT NULL,
  device_token_hash TEXT NOT NULL UNIQUE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX idx_wrayth_devices_user ON public.wrayth_devices(user_id);
GRANT SELECT, UPDATE, DELETE ON public.wrayth_devices TO authenticated;
GRANT ALL ON public.wrayth_devices TO service_role;
ALTER TABLE public.wrayth_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own devices" ON public.wrayth_devices
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users revoke own devices" ON public.wrayth_devices
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own devices" ON public.wrayth_devices
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. wrayth_device_enrollments
CREATE TABLE public.wrayth_device_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  device_id UUID REFERENCES public.wrayth_devices(id) ON DELETE SET NULL
);
CREATE INDEX idx_wrayth_enroll_user ON public.wrayth_device_enrollments(user_id);
GRANT SELECT ON public.wrayth_device_enrollments TO authenticated;
GRANT ALL ON public.wrayth_device_enrollments TO service_role;
ALTER TABLE public.wrayth_device_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own enrollments" ON public.wrayth_device_enrollments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. wrayth_device_posture (latest snapshot per device)
CREATE TABLE public.wrayth_device_posture (
  device_id UUID PRIMARY KEY REFERENCES public.wrayth_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX idx_wrayth_posture_user ON public.wrayth_device_posture(user_id);
GRANT SELECT ON public.wrayth_device_posture TO authenticated;
GRANT ALL ON public.wrayth_device_posture TO service_role;
ALTER TABLE public.wrayth_device_posture ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own posture" ON public.wrayth_device_posture
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. wrayth_device_posture_history
CREATE TABLE public.wrayth_device_posture_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.wrayth_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE INDEX idx_wrayth_posture_hist_device ON public.wrayth_device_posture_history(device_id, captured_at DESC);
GRANT SELECT ON public.wrayth_device_posture_history TO authenticated;
GRANT ALL ON public.wrayth_device_posture_history TO service_role;
ALTER TABLE public.wrayth_device_posture_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own posture history" ON public.wrayth_device_posture_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Realtime for the enrollments table so the "Waiting for check-in..." UI can flip live
ALTER PUBLICATION supabase_realtime ADD TABLE public.wrayth_device_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wrayth_devices;
