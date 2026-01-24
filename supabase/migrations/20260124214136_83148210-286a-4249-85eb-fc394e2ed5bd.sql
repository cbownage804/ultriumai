-- Add key_version column to safepass_vaults for key rotation support
ALTER TABLE public.safepass_vaults 
ADD COLUMN IF NOT EXISTS key_version integer NOT NULL DEFAULT 1;

-- Add key_version column to safepass_entries to track which key version encrypted each entry
ALTER TABLE public.safepass_entries 
ADD COLUMN IF NOT EXISTS key_version integer NOT NULL DEFAULT 1;

-- Create an index for efficient filtering by key version (useful during key rotation migrations)
CREATE INDEX IF NOT EXISTS idx_safepass_entries_key_version 
ON public.safepass_entries(vault_id, key_version);

-- Add comment explaining the versioning system
COMMENT ON COLUMN public.safepass_vaults.key_version IS 'Current key derivation version for this vault. Increment when master password changes.';
COMMENT ON COLUMN public.safepass_entries.key_version IS 'Key version used to encrypt this entry. Must match vault key_version for decryption.';