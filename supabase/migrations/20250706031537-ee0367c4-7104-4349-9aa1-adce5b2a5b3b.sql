-- Create incidents table for incident response workflows
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'investigating', 'escalated', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Assignment and ownership
  assigned_to UUID,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- SLA tracking
  sla_deadline TIMESTAMP WITH TIME ZONE,
  response_sla_minutes INTEGER DEFAULT 240, -- 4 hours default
  resolution_sla_minutes INTEGER DEFAULT 1440, -- 24 hours default
  first_response_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID,
  escalation_reason TEXT,
  
  -- Event correlation
  source_event_id UUID,
  related_events UUID[] DEFAULT '{}',
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'Security Incident',
  affected_systems TEXT[] DEFAULT '{}',
  impact_assessment TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own incidents"
ON public.incidents
FOR ALL
USING (user_id = auth.uid());

-- Create incident comments table for collaboration
CREATE TABLE public.incident_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view comments for their incidents"
ON public.incident_comments
FOR SELECT
USING (
  incident_id IN (
    SELECT id FROM public.incidents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments for their incidents"
ON public.incident_comments
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  incident_id IN (
    SELECT id FROM public.incidents WHERE user_id = auth.uid()
  )
);

-- Create incident activities table for audit trail
CREATE TABLE public.incident_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'assigned', 'status_changed', 'priority_changed', 'escalated', 'commented', 'resolved', 'closed')),
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incident_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view activities for their incidents"
ON public.incident_activities
FOR SELECT
USING (
  incident_id IN (
    SELECT id FROM public.incidents WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can create incident activities"
ON public.incident_activities
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_incidents_user_id ON public.incidents(user_id);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX idx_incidents_priority ON public.incidents(priority);
CREATE INDEX idx_incidents_sla_deadline ON public.incidents(sla_deadline);
CREATE INDEX idx_incidents_source_event_id ON public.incidents(source_event_id);

CREATE INDEX idx_incident_comments_incident_id ON public.incident_comments(incident_id);
CREATE INDEX idx_incident_activities_incident_id ON public.incident_activities(incident_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incident_comments_updated_at
  BEFORE UPDATE ON public.incident_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create incident from security event
CREATE OR REPLACE FUNCTION create_incident_from_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create incident for high/critical severity events
  IF NEW.severity IN ('high', 'critical') THEN
    INSERT INTO public.incidents (
      user_id,
      title,
      description,
      priority,
      severity,
      source_event_id,
      category,
      affected_systems,
      sla_deadline,
      response_sla_minutes,
      resolution_sla_minutes
    ) VALUES (
      NEW.user_id,
      'Security Incident: ' || NEW.title,
      NEW.description,
      CASE 
        WHEN NEW.severity = 'critical' THEN 'critical'
        WHEN NEW.severity = 'high' THEN 'high'
        ELSE 'medium'
      END,
      NEW.severity,
      NEW.id,
      'Security Incident',
      NEW.affected_assets,
      now() + INTERVAL '4 hours', -- Default 4 hour response SLA
      CASE 
        WHEN NEW.severity = 'critical' THEN 60  -- 1 hour for critical
        WHEN NEW.severity = 'high' THEN 240     -- 4 hours for high
        ELSE 480                                -- 8 hours for medium
      END,
      CASE 
        WHEN NEW.severity = 'critical' THEN 240  -- 4 hours for critical
        WHEN NEW.severity = 'high' THEN 1440     -- 24 hours for high
        ELSE 2880                                -- 48 hours for medium
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create incidents from high/critical security events
CREATE TRIGGER create_incident_from_security_event
  AFTER INSERT ON public.security_events
  FOR EACH ROW
  EXECUTE FUNCTION create_incident_from_event();