-- Create function to increment safepass entry usage count
CREATE OR REPLACE FUNCTION public.increment_safepass_entry_usage(entry_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.safepass_entries
  SET 
    usage_count = usage_count + 1,
    last_used_at = now()
  WHERE id = entry_id AND user_id = auth.uid();
END;
$$;