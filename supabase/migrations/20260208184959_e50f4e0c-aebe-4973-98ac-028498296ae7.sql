-- Add invite token columns to org_team_members
ALTER TABLE public.org_team_members
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_org_team_members_invite_token ON public.org_team_members (invite_token) WHERE invite_token IS NOT NULL;