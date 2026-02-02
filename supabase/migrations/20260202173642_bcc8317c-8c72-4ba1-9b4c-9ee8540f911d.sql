-- Create table for SafePass linked accounts (multi-account switching)
CREATE TABLE public.safepass_linked_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_user_id UUID NOT NULL,
  linked_email TEXT NOT NULL,
  linked_user_id UUID,
  display_name TEXT NOT NULL DEFAULT 'Account',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.safepass_linked_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own linked accounts
CREATE POLICY "Users can view their own linked accounts"
ON public.safepass_linked_accounts
FOR SELECT
USING (auth.uid() = primary_user_id);

-- Users can add their own linked accounts
CREATE POLICY "Users can create their own linked accounts"
ON public.safepass_linked_accounts
FOR INSERT
WITH CHECK (auth.uid() = primary_user_id);

-- Users can update their own linked accounts
CREATE POLICY "Users can update their own linked accounts"
ON public.safepass_linked_accounts
FOR UPDATE
USING (auth.uid() = primary_user_id);

-- Users can delete their own linked accounts
CREATE POLICY "Users can delete their own linked accounts"
ON public.safepass_linked_accounts
FOR DELETE
USING (auth.uid() = primary_user_id);

-- Create table for SafePass user preferences (AI learning patterns)
CREATE TABLE public.safepass_user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preference_type TEXT NOT NULL, -- 'domain_preference', 'search_pattern', etc.
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL DEFAULT '{}',
  usage_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, preference_type, preference_key)
);

-- Enable Row Level Security
ALTER TABLE public.safepass_user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.safepass_user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own preferences
CREATE POLICY "Users can create their own preferences"
ON public.safepass_user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.safepass_user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete their own preferences"
ON public.safepass_user_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- Add usage_count column to safepass_entries for AI ranking
ALTER TABLE public.safepass_entries ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_safepass_linked_accounts_primary_user ON public.safepass_linked_accounts(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_safepass_user_preferences_user ON public.safepass_user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_safepass_entries_usage ON public.safepass_entries(usage_count DESC);

-- Create trigger to update updated_at on preferences
CREATE OR REPLACE FUNCTION public.update_safepass_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_safepass_preferences_updated_at
BEFORE UPDATE ON public.safepass_user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_safepass_preferences_updated_at();