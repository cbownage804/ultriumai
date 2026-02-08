-- Add unique constraint on stripe_subscription_id for upsert support
ALTER TABLE public.org_team_licenses ADD CONSTRAINT org_team_licenses_stripe_subscription_id_key UNIQUE (stripe_subscription_id);

-- Add status column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'org_team_licenses' AND column_name = 'status') THEN
    ALTER TABLE public.org_team_licenses ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;