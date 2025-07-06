-- Step 6: Add remaining tables for comprehensive SafeSuite functionality

-- MDR Investigations table
CREATE TABLE public.safe_mdr_investigations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_id UUID NOT NULL,
  investigator_id UUID,
  investigation_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  evidence_collected JSONB DEFAULT '[]',
  findings TEXT,
  recommendations TEXT,
  investigation_status TEXT NOT NULL DEFAULT 'open',
  time_spent_minutes INTEGER DEFAULT 0,
  tools_used TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- MSP Service Level Agreements
CREATE TABLE public.msp_service_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  response_time_minutes INTEGER DEFAULT 60,
  resolution_time_hours INTEGER DEFAULT 24,
  availability_percentage DECIMAL(5,2) DEFAULT 99.9,
  monthly_fee DECIMAL(10,2),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MSP Billing Records
CREATE TABLE public.msp_billing_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  base_amount DECIMAL(10,2) DEFAULT 0,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid', 'overdue')),
  invoice_number TEXT,
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Real-time monitoring
CREATE TABLE public.safe_shield_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint_id UUID,
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_threshold_exceeded BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- Threat Intelligence Feeds
CREATE TABLE public.threat_intelligence_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_name TEXT NOT NULL,
  feed_type TEXT NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  indicators JSONB DEFAULT '[]',
  threat_actors JSONB DEFAULT '[]',
  campaigns JSONB DEFAULT '[]',
  confidence_score INTEGER DEFAULT 75,
  is_active BOOLEAN DEFAULT true
);