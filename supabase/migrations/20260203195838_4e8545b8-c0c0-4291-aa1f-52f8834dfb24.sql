-- Scheduled Maintenance table for portal calendar
CREATE TABLE public.scheduled_maintenance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NULL,
  title TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT NOT NULL DEFAULT 'planned',
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  affected_services TEXT[],
  status TEXT NOT NULL DEFAULT 'scheduled',
  notify_customers BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_maintenance ENABLE ROW LEVEL SECURITY;

-- MSP users can manage all maintenance
CREATE POLICY "MSP users can manage maintenance"
  ON public.scheduled_maintenance
  FOR ALL
  USING (auth.uid() = user_id);

-- Portal users can view maintenance for their company (simple policy - global or client-specific)
CREATE POLICY "Anyone can view global maintenance"
  ON public.scheduled_maintenance
  FOR SELECT
  USING (client_id IS NULL);

-- Indexes
CREATE INDEX idx_scheduled_maintenance_user ON public.scheduled_maintenance(user_id);
CREATE INDEX idx_scheduled_maintenance_client ON public.scheduled_maintenance(client_id);
CREATE INDEX idx_scheduled_maintenance_dates ON public.scheduled_maintenance(start_time, end_time);