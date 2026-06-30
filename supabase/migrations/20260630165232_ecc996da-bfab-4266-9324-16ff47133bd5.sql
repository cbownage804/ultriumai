
CREATE UNIQUE INDEX IF NOT EXISTS ray_findings_user_kind_entry_uidx
  ON public.ray_findings (user_id, kind, entry_id);
