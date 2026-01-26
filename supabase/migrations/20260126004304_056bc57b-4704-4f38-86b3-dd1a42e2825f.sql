-- Create a trigger to automatically create safesuite_subscriptions for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_safesuite_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.safesuite_subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created_safesuite
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_safesuite_subscription();

-- Backfill existing users who don't have a safesuite_subscriptions record
INSERT INTO public.safesuite_subscriptions (user_id, tier, status)
SELECT au.id, 'free', 'active'
FROM auth.users au
LEFT JOIN public.safesuite_subscriptions ss ON ss.user_id = au.id
WHERE ss.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;