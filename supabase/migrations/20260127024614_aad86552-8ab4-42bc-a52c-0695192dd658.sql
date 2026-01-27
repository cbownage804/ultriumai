-- AI Studio Credit System (Separate from SafeSuite)
-- 1 AI Credit = 1,000 tokens (internal only, never shown to users)

-- Organization credit pools for AI Studio
CREATE TABLE public.org_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free',
  monthly_credit_limit INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used_this_period INTEGER NOT NULL DEFAULT 0,
  credit_reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 month'),
  overage_enabled BOOLEAN NOT NULL DEFAULT false,
  overage_credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GPT instance credit settings
ALTER TABLE public.custom_gpts ADD COLUMN IF NOT EXISTS credit_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0;
ALTER TABLE public.custom_gpts ADD COLUMN IF NOT EXISTS monthly_credit_cap INTEGER;

-- Credit ledger for auditing and analytics
CREATE TABLE public.ai_credit_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gpt_id UUID REFERENCES public.custom_gpts(id) ON DELETE SET NULL,
  credits_used NUMERIC(10,2) NOT NULL,
  tokens_used INTEGER,
  usage_type TEXT NOT NULL, -- 'chat', 'file_analysis', 'retrieval', 'tool_call', 'web_search'
  conversation_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_credits
CREATE POLICY "Users can view own org credits" ON public.org_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own org credits" ON public.org_credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own org credits" ON public.org_credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for ai_credit_ledger
CREATE POLICY "Users can view own credit ledger" ON public.ai_credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own credit ledger" ON public.ai_credit_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to initialize org credits for new users
CREATE OR REPLACE FUNCTION public.initialize_org_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.org_credits (user_id, plan_type, monthly_credit_limit, credits_remaining)
  VALUES (NEW.id, 'free', 1000, 1000)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get AI Studio plan credits
CREATE OR REPLACE FUNCTION public.get_ai_studio_plan_credits(plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE plan
    -- MSP Plans
    WHEN 'msp_starter' THEN 50000
    WHEN 'msp_pro' THEN 200000
    WHEN 'msp_elite' THEN 500000
    -- Team Plans
    WHEN 'team_basic' THEN 20000
    WHEN 'team_plus' THEN 100000
    -- Website Plans
    WHEN 'website_basic' THEN 5000
    WHEN 'website_pro' THEN 20000
    -- Free tier
    ELSE 1000
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to deduct AI Studio credits with multiplier
CREATE OR REPLACE FUNCTION public.deduct_ai_credits(
  p_user_id UUID,
  p_gpt_id UUID,
  p_tokens INTEGER,
  p_usage_type TEXT,
  p_conversation_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_credits_needed NUMERIC(10,2);
  v_multiplier NUMERIC(3,2);
  v_org_credits RECORD;
  v_result JSON;
BEGIN
  -- Get GPT multiplier (default 1.0)
  SELECT COALESCE(credit_multiplier, 1.0) INTO v_multiplier
  FROM public.custom_gpts WHERE id = p_gpt_id;
  
  IF v_multiplier IS NULL THEN
    v_multiplier := 1.0;
  END IF;
  
  -- Calculate credits: tokens / 1000 * multiplier
  v_credits_needed := (p_tokens::NUMERIC / 1000.0) * v_multiplier;
  
  -- Get org credits
  SELECT * INTO v_org_credits FROM public.org_credits WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_org_credits IS NULL THEN
    -- Initialize if not exists
    INSERT INTO public.org_credits (user_id, plan_type, monthly_credit_limit, credits_remaining)
    VALUES (p_user_id, 'free', 1000, 1000)
    RETURNING * INTO v_org_credits;
  END IF;
  
  -- Check if enough credits
  IF v_org_credits.credits_remaining < v_credits_needed THEN
    IF v_org_credits.overage_enabled THEN
      -- Use overage credits
      UPDATE public.org_credits 
      SET overage_credits_used = overage_credits_used + v_credits_needed,
          updated_at = now()
      WHERE user_id = p_user_id;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'insufficient_credits',
        'credits_remaining', v_org_credits.credits_remaining,
        'credits_needed', v_credits_needed
      );
    END IF;
  ELSE
    -- Deduct from regular credits
    UPDATE public.org_credits 
    SET credits_remaining = credits_remaining - v_credits_needed,
        credits_used_this_period = credits_used_this_period + v_credits_needed,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Log to ledger
  INSERT INTO public.ai_credit_ledger (user_id, gpt_id, credits_used, tokens_used, usage_type, conversation_id, description)
  VALUES (p_user_id, p_gpt_id, v_credits_needed, p_tokens, p_usage_type, p_conversation_id, p_description);
  
  -- Return success
  SELECT json_build_object(
    'success', true,
    'credits_used', v_credits_needed,
    'credits_remaining', credits_remaining,
    'multiplier', v_multiplier
  ) INTO v_result
  FROM public.org_credits WHERE user_id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create indexes
CREATE INDEX idx_org_credits_user_id ON public.org_credits(user_id);
CREATE INDEX idx_ai_credit_ledger_user_id ON public.ai_credit_ledger(user_id);
CREATE INDEX idx_ai_credit_ledger_gpt_id ON public.ai_credit_ledger(gpt_id);
CREATE INDEX idx_ai_credit_ledger_created_at ON public.ai_credit_ledger(created_at DESC);