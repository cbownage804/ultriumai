
CREATE OR REPLACE FUNCTION public.check_safesuite_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_tier TEXT;
  user_email TEXT;
  current_count INTEGER;
  tier_limit INTEGER;
BEGIN
  -- Admin bypass: internal @ultriumai.com accounts get unlimited capacity,
  -- matching the client-side admin override in useWraythSubscription.
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  IF user_email IS NOT NULL AND user_email LIKE '%@ultriumai.com' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(tier, 'free') INTO user_tier
  FROM public.safesuite_subscriptions
  WHERE user_id = NEW.user_id AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;

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
      WHEN 'free' THEN tier_limit := 0;
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
      WHEN 'free' THEN tier_limit := 0;
      WHEN 'pro' THEN tier_limit := 0;
      WHEN 'business' THEN tier_limit := 500;
      WHEN 'enterprise' THEN tier_limit := 1500;
      ELSE tier_limit := 0;
    END CASE;

    SELECT COUNT(*) INTO current_count
    FROM public.assets
    WHERE user_id = NEW.user_id;
  ELSE
    RETURN NEW;
  END IF;

  IF current_count >= tier_limit THEN
    RAISE EXCEPTION 'Usage limit exceeded. Current: %, Limit: % for % tier. Please upgrade your plan.',
      current_count, tier_limit, user_tier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
