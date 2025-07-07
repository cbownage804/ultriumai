-- Create threat intelligence table for storing threat analysis results
CREATE TABLE IF NOT EXISTS public.threat_intelligence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  indicator_value TEXT NOT NULL,
  indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'url', 'hash', 'email')),
  reputation TEXT NOT NULL CHECK (reputation IN ('clean', 'questionable', 'suspicious', 'malicious')),
  score INTEGER NOT NULL DEFAULT 0,
  threats JSONB DEFAULT '[]',
  sources JSONB DEFAULT '[]',
  last_analyzed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own threat intelligence data"
ON public.threat_intelligence
FOR ALL
USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_threat_intelligence_user_id ON public.threat_intelligence(user_id);
CREATE INDEX idx_threat_intelligence_indicator ON public.threat_intelligence(indicator_value);
CREATE INDEX idx_threat_intelligence_reputation ON public.threat_intelligence(reputation);
CREATE INDEX idx_threat_intelligence_created_at ON public.threat_intelligence(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_threat_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_threat_intelligence_updated_at
  BEFORE UPDATE ON public.threat_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_threat_intelligence_updated_at();