
-- =============================================
-- Platform Changelog (public-facing releases)
-- =============================================
CREATE TABLE public.platform_changelog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'feature' CHECK (entry_type IN ('feature', 'fix', 'improvement', 'breaking')),
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_changelog ENABLE ROW LEVEL SECURITY;

-- Anyone can read published entries
CREATE POLICY "Published changelog entries are public"
  ON public.platform_changelog FOR SELECT
  USING (published = true);

-- Only authenticated users can manage (admin check in app layer)
CREATE POLICY "Authenticated users can manage changelog"
  ON public.platform_changelog FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- Feature Requests
-- =============================================
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'under_review' CHECK (status IN ('under_review', 'planned', 'in_progress', 'shipped', 'declined')),
  user_id UUID NOT NULL,
  author_name TEXT,
  comments_count INT NOT NULL DEFAULT 0,
  votes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can view feature requests"
  ON public.feature_requests FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can create their own
CREATE POLICY "Users can create feature requests"
  ON public.feature_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "Users can update own feature requests"
  ON public.feature_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- Feature Request Votes
-- =============================================
CREATE TABLE public.feature_request_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, user_id)
);

ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes"
  ON public.feature_request_votes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can vote"
  ON public.feature_request_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote"
  ON public.feature_request_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to keep votes_count in sync
CREATE OR REPLACE FUNCTION public.update_feature_request_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_requests SET votes_count = votes_count + 1, updated_at = now() WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feature_requests SET votes_count = votes_count - 1, updated_at = now() WHERE id = OLD.request_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER sync_votes_count
  AFTER INSERT OR DELETE ON public.feature_request_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_feature_request_votes_count();

-- =============================================
-- Referrals
-- =============================================
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referred_email TEXT,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'expired')),
  credits_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- =============================================
-- Updated_at triggers
-- =============================================
CREATE TRIGGER update_platform_changelog_updated_at
  BEFORE UPDATE ON public.platform_changelog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
