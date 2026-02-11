
-- Store Supabase URL and service role key in vault so the trigger can use them
-- These are the same values already available as env vars in edge functions
SELECT vault.create_secret(
  'https://nsyobmjpdpvesjwdphlh.supabase.co',
  'supabase_url',
  'Supabase project URL for internal trigger calls'
);
