ALTER TABLE public.ray_notices REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'ray_notices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ray_notices;
  END IF;
END $$;