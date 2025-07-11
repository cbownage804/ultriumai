-- Create profit margin analytics table
CREATE TABLE public.msp_profit_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  client_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  costs DECIMAL(10,2) NOT NULL DEFAULT 0,
  profit_margin DECIMAL(5,2) NOT NULL DEFAULT 0,
  industry_benchmark DECIMAL(5,2),
  cost_breakdown JSONB DEFAULT '{}',
  optimization_suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create upselling opportunities table
CREATE TABLE public.msp_upselling_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  client_id UUID NOT NULL,
  opportunity_type TEXT NOT NULL,
  service_name TEXT NOT NULL,
  current_spend DECIMAL(10,2) NOT NULL DEFAULT 0,
  potential_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  confidence_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'identified',
  reasons JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  estimated_close_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create churn prediction table
CREATE TABLE public.msp_churn_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  client_id UUID NOT NULL,
  churn_risk_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  contributing_factors JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  last_engagement_date DATE,
  contract_renewal_date DATE,
  satisfaction_trend TEXT,
  support_ticket_trend TEXT,
  payment_history_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create competitive benchmarking table
CREATE TABLE public.msp_competitive_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  industry_average DECIMAL(10,2),
  top_quartile DECIMAL(10,2),
  percentile_rank INTEGER,
  trend_direction TEXT,
  benchmark_date DATE NOT NULL,
  data_source TEXT,
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead scoring table
CREATE TABLE public.msp_lead_scoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  msp_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  lead_score INTEGER NOT NULL DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}',
  lead_source TEXT,
  industry TEXT,
  company_size TEXT,
  budget_range TEXT,
  pain_points JSONB DEFAULT '[]',
  engagement_level TEXT NOT NULL DEFAULT 'cold',
  last_activity_date DATE,
  next_action TEXT,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.msp_profit_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_upselling_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_competitive_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.msp_lead_scoring ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "MSPs can manage their own profit analytics" ON public.msp_profit_analytics
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSPs can manage their own upselling opportunities" ON public.msp_upselling_opportunities
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSPs can manage their own churn predictions" ON public.msp_churn_predictions
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSPs can manage their own competitive benchmarks" ON public.msp_competitive_benchmarks
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

CREATE POLICY "MSPs can manage their own lead scoring" ON public.msp_lead_scoring
  FOR ALL USING (msp_id IN (SELECT id FROM msps WHERE user_id = auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_msp_profit_analytics_msp_client ON public.msp_profit_analytics(msp_id, client_id);
CREATE INDEX idx_msp_upselling_opportunities_msp_client ON public.msp_upselling_opportunities(msp_id, client_id);
CREATE INDEX idx_msp_churn_predictions_msp_client ON public.msp_churn_predictions(msp_id, client_id);
CREATE INDEX idx_msp_competitive_benchmarks_msp_date ON public.msp_competitive_benchmarks(msp_id, benchmark_date);
CREATE INDEX idx_msp_lead_scoring_msp_score ON public.msp_lead_scoring(msp_id, lead_score DESC);