-- Create advanced analytics and reporting system

-- Analytics dashboards for different user types
CREATE TABLE public.analytics_dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dashboard_name TEXT NOT NULL,
  dashboard_type TEXT NOT NULL, -- 'executive', 'operational', 'financial', 'security', 'msp_overview'
  widget_config JSONB NOT NULL DEFAULT '[]',
  layout_config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  shared_with JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance metrics tracking
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_category TEXT NOT NULL, -- 'financial', 'operational', 'security', 'customer_satisfaction'
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit TEXT, -- 'percentage', 'currency', 'count', 'hours', 'days'
  comparison_period TEXT DEFAULT 'month', -- 'day', 'week', 'month', 'quarter', 'year'
  previous_value DECIMAL(15,4),
  target_value DECIMAL(15,4),
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Business intelligence reports
CREATE TABLE public.bi_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'revenue_analysis', 'cost_analysis', 'roi_analysis', 'trend_analysis', 'forecast'
  report_config JSONB NOT NULL DEFAULT '{}',
  data_sources JSONB NOT NULL DEFAULT '[]', -- references to tables/metrics to include
  schedule_config JSONB DEFAULT '{}', -- for automated reports
  last_generated_at TIMESTAMP WITH TIME ZONE,
  is_automated BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictive analytics models
CREATE TABLE public.predictive_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'churn_prediction', 'revenue_forecast', 'demand_forecast', 'risk_assessment'
  model_config JSONB NOT NULL DEFAULT '{}',
  training_data JSONB DEFAULT '{}',
  accuracy_score DECIMAL(5,4),
  last_trained_at TIMESTAMP WITH TIME ZONE,
  predictions JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ROI tracking for different initiatives
CREATE TABLE public.roi_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  initiative_name TEXT NOT NULL,
  initiative_type TEXT NOT NULL, -- 'security_tool', 'automation', 'process_improvement', 'training'
  investment_amount DECIMAL(12,2) NOT NULL,
  investment_date DATE NOT NULL,
  benefits_tracked JSONB NOT NULL DEFAULT '[]', -- cost savings, efficiency gains, etc.
  total_benefits DECIMAL(12,2) DEFAULT 0,
  roi_percentage DECIMAL(8,4),
  payback_period_months INTEGER,
  status TEXT DEFAULT 'tracking', -- 'planning', 'tracking', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- KPI definitions and targets
CREATE TABLE public.kpi_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_category TEXT NOT NULL, -- 'financial', 'operational', 'security', 'customer'
  description TEXT,
  calculation_method TEXT NOT NULL,
  target_value DECIMAL(15,4),
  target_period TEXT DEFAULT 'month',
  data_source TEXT, -- reference to source table/calculation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Historical data snapshots for trend analysis
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  snapshot_date DATE NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  data_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Benchmarking data (anonymized industry averages)
CREATE TABLE public.industry_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry_type TEXT NOT NULL, -- 'msp', 'smb_it', 'enterprise_it'
  company_size TEXT NOT NULL, -- 'small', 'medium', 'large'
  metric_name TEXT NOT NULL,
  benchmark_value DECIMAL(15,4) NOT NULL,
  benchmark_period TEXT NOT NULL,
  benchmark_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- Analytics dashboards policies
CREATE POLICY "Users can manage their own dashboards" 
ON public.analytics_dashboards FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Users can view shared dashboards" 
ON public.analytics_dashboards FOR SELECT 
USING (
  user_id = auth.uid() OR 
  (is_shared = true AND auth.uid()::text = ANY(
    SELECT jsonb_array_elements_text(shared_with)
  ))
);

-- Performance metrics policies
CREATE POLICY "Users can manage their own metrics" 
ON public.performance_metrics FOR ALL 
USING (user_id = auth.uid());

-- BI reports policies
CREATE POLICY "Users can manage their own reports" 
ON public.bi_reports FOR ALL 
USING (user_id = auth.uid());

-- Predictive models policies
CREATE POLICY "Users can manage their own models" 
ON public.predictive_models FOR ALL 
USING (user_id = auth.uid());

-- ROI tracking policies
CREATE POLICY "Users can manage their own ROI tracking" 
ON public.roi_tracking FOR ALL 
USING (user_id = auth.uid());

-- KPI definitions policies
CREATE POLICY "Users can manage their own KPIs" 
ON public.kpi_definitions FOR ALL 
USING (user_id = auth.uid());

-- Analytics snapshots policies
CREATE POLICY "Users can manage their own snapshots" 
ON public.analytics_snapshots FOR ALL 
USING (user_id = auth.uid());

-- Industry benchmarks policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view benchmarks" 
ON public.industry_benchmarks FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Triggers for updated_at
CREATE TRIGGER update_analytics_dashboards_updated_at
BEFORE UPDATE ON public.analytics_dashboards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bi_reports_updated_at
BEFORE UPDATE ON public.bi_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_models_updated_at
BEFORE UPDATE ON public.predictive_models
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roi_tracking_updated_at
BEFORE UPDATE ON public.roi_tracking
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_definitions_updated_at
BEFORE UPDATE ON public.kpi_definitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate ROI percentage
CREATE OR REPLACE FUNCTION public.calculate_roi_percentage(p_roi_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    v_investment DECIMAL(12,2);
    v_benefits DECIMAL(12,2);
    v_roi_percentage DECIMAL(8,4);
BEGIN
    -- Get investment and benefits
    SELECT investment_amount, total_benefits
    INTO v_investment, v_benefits
    FROM public.roi_tracking
    WHERE id = p_roi_id;
    
    -- Calculate ROI percentage
    IF v_investment > 0 THEN
        v_roi_percentage := ((v_benefits - v_investment) / v_investment) * 100;
        
        -- Update ROI tracking
        UPDATE public.roi_tracking 
        SET 
            roi_percentage = v_roi_percentage,
            updated_at = now()
        WHERE id = p_roi_id;
    END IF;
END;
$$;

-- Function to generate analytics snapshot
CREATE OR REPLACE FUNCTION public.generate_analytics_snapshot(p_user_id UUID, p_snapshot_type TEXT)
RETURNS UUID
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    v_snapshot_id UUID;
    v_data JSONB := '{}';
BEGIN
    -- Collect key metrics based on snapshot type
    IF p_snapshot_type = 'monthly' THEN
        -- Monthly snapshot includes comprehensive data
        v_data := jsonb_build_object(
            'revenue_metrics', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'total_amount', COALESCE(SUM(total_amount), 0),
                        'invoice_count', COUNT(*),
                        'paid_amount', COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0)
                    )
                )
                FROM public.invoices 
                WHERE user_id = p_user_id 
                AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            ),
            'ticket_metrics', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'total_tickets', COUNT(*),
                        'resolved_tickets', SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END),
                        'avg_resolution_time', AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)
                    )
                )
                FROM public.tickets 
                WHERE user_id = p_user_id 
                AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
            )
        );
    ELSE
        -- Daily/weekly snapshots include basic metrics
        v_data := jsonb_build_object(
            'basic_metrics', jsonb_build_object(
                'active_tickets', (SELECT COUNT(*) FROM public.tickets WHERE user_id = p_user_id AND status != 'resolved'),
                'revenue_today', (SELECT COALESCE(SUM(total_amount), 0) FROM public.invoices WHERE user_id = p_user_id AND DATE(created_at) = CURRENT_DATE)
            )
        );
    END IF;
    
    -- Insert snapshot
    INSERT INTO public.analytics_snapshots (user_id, snapshot_date, snapshot_type, data_snapshot)
    VALUES (p_user_id, CURRENT_DATE, p_snapshot_type, v_data)
    RETURNING id INTO v_snapshot_id;
    
    RETURN v_snapshot_id;
END;
$$;