-- Create a function to check SafeSuite usage limits before insert
-- This provides server-side enforcement that cannot be bypassed

CREATE OR REPLACE FUNCTION public.check_safesuite_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  current_count INTEGER;
  tier_limit INTEGER;
BEGIN
  -- Get user's current tier from safesuite_subscriptions
  SELECT COALESCE(tier, 'free') INTO user_tier
  FROM public.safesuite_subscriptions
  WHERE user_id = NEW.user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Default to free if no subscription found
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

  -- Set limits based on tier
  IF TG_TABLE_NAME = 'safepass_entries' THEN
    CASE user_tier
      WHEN 'free' THEN tier_limit := 25;
      WHEN 'pro' THEN tier_limit := 100;
      WHEN 'business' THEN tier_limit := 500;
      WHEN 'enterprise' THEN tier_limit := 1500;
      ELSE tier_limit := 25;
    END CASE;
    
    SELECT COUNT(*) INTO current_count
    FROM public.safepass_entries
    WHERE user_id = NEW.user_id;
    
  ELSIF TG_TABLE_NAME = 'safeweb_assets' THEN
    CASE user_tier
      WHEN 'free' THEN tier_limit := 0;  -- Not available
      WHEN 'pro' THEN tier_limit := 5;
      WHEN 'business' THEN tier_limit := 50;
      WHEN 'enterprise' THEN tier_limit := 150;
      ELSE tier_limit := 0;
    END CASE;
    
    SELECT COUNT(*) INTO current_count
    FROM public.safeweb_assets
    WHERE user_id = NEW.user_id AND status = 'active';
    
  ELSIF TG_TABLE_NAME = 'assets' THEN
    CASE user_tier
      WHEN 'free' THEN tier_limit := 0;  -- Not available
      WHEN 'pro' THEN tier_limit := 0;   -- Not available
      WHEN 'business' THEN tier_limit := 500;
      WHEN 'enterprise' THEN tier_limit := 1500;
      ELSE tier_limit := 0;
    END CASE;
    
    SELECT COUNT(*) INTO current_count
    FROM public.assets
    WHERE user_id = NEW.user_id;
  ELSE
    -- Unknown table, allow
    RETURN NEW;
  END IF;

  -- Check if limit exceeded
  IF current_count >= tier_limit THEN
    RAISE EXCEPTION 'Usage limit exceeded. Current: %, Limit: % for % tier. Please upgrade your plan.', 
      current_count, tier_limit, user_tier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for each table that needs limit enforcement

-- SafePass entries limit trigger
DROP TRIGGER IF EXISTS enforce_safepass_limit ON public.safepass_entries;
CREATE TRIGGER enforce_safepass_limit
  BEFORE INSERT ON public.safepass_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.check_safesuite_limit();

-- SafeWeb assets limit trigger
DROP TRIGGER IF EXISTS enforce_safeweb_limit ON public.safeweb_assets;
CREATE TRIGGER enforce_safeweb_limit
  BEFORE INSERT ON public.safeweb_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_safesuite_limit();

-- SafeTrack assets limit trigger
DROP TRIGGER IF EXISTS enforce_safetrack_limit ON public.assets;
CREATE TRIGGER enforce_safetrack_limit
  BEFORE INSERT ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.check_safesuite_limit();

-- Add comment for documentation
COMMENT ON FUNCTION public.check_safesuite_limit() IS 
  'Server-side enforcement of SafeSuite tier limits. Prevents users from exceeding their plan limits even if frontend is bypassed.';