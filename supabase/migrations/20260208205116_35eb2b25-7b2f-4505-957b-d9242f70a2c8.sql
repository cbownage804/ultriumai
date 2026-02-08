
-- Cross-module sync mapping table to track linked records
CREATE TABLE public.cross_module_sync_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_module TEXT NOT NULL,  -- 'vanguard', 'atlas', 'helpdesk'
  source_table TEXT NOT NULL,   -- 'msp_clients', 'vanguard_agents', 'tickets'
  source_record_id UUID NOT NULL,
  target_module TEXT NOT NULL,
  target_table TEXT NOT NULL,   -- 'atlas_organizations', 'atlas_configurations', 'atlas_activity_logs'
  target_record_id UUID NOT NULL,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional', -- 'source_to_target', 'target_to_source', 'bidirectional'
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_status TEXT NOT NULL DEFAULT 'synced',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_table, source_record_id, target_table, target_record_id)
);

ALTER TABLE public.cross_module_sync_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sync mappings" ON public.cross_module_sync_mappings
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_sync_source ON public.cross_module_sync_mappings(source_table, source_record_id);
CREATE INDEX idx_sync_target ON public.cross_module_sync_mappings(target_table, target_record_id);
CREATE INDEX idx_sync_user ON public.cross_module_sync_mappings(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_sync_mappings_updated_at
  BEFORE UPDATE ON public.cross_module_sync_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
