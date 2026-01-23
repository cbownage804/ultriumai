-- Function to automatically create helpdesk ticket from RMM alert
CREATE OR REPLACE FUNCTION public.create_ticket_from_rmm_alert()
RETURNS TRIGGER AS $$
DECLARE
  new_ticket_id uuid;
  alert_priority text;
BEGIN
  -- Only trigger for critical or high severity alerts
  IF NEW.severity NOT IN ('critical', 'high') THEN
    RETURN NEW;
  END IF;

  -- Map severity to priority
  alert_priority := CASE NEW.severity
    WHEN 'critical' THEN 'critical'
    WHEN 'high' THEN 'high'
    ELSE 'medium'
  END;

  -- Create the helpdesk ticket
  INSERT INTO public.helpdesk_tickets (
    title,
    description,
    priority,
    status,
    category,
    customer_id,
    device_context,
    source,
    created_at,
    updated_at
  ) VALUES (
    '🚨 RMM Alert: ' || NEW.title,
    E'**Automated Ticket from RMM Alert**\n\n' ||
    '**Alert Type:** ' || NEW.alert_type || E'\n' ||
    '**Severity:** ' || NEW.severity || E'\n' ||
    '**Source:** ' || COALESCE(NEW.source, 'Unknown') || E'\n\n' ||
    '**Message:**\n' || COALESCE(NEW.message, 'No additional details provided.'),
    alert_priority,
    'open',
    'rmm_alert',
    NEW.client_id,
    jsonb_build_object(
      'alert_id', NEW.id,
      'alert_type', NEW.alert_type,
      'severity', NEW.severity,
      'source', NEW.source,
      'metadata', NEW.metadata,
      'auto_generated', true
    ),
    'rmm_alert',
    NOW(),
    NOW()
  )
  RETURNING id INTO new_ticket_id;

  -- Update the alert with the linked ticket ID
  UPDATE public.rmm_alerts 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('linked_ticket_id', new_ticket_id)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on rmm_alerts table
DROP TRIGGER IF EXISTS trigger_create_ticket_from_rmm_alert ON public.rmm_alerts;
CREATE TRIGGER trigger_create_ticket_from_rmm_alert
  AFTER INSERT ON public.rmm_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_ticket_from_rmm_alert();

-- Add source column to helpdesk_tickets if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'helpdesk_tickets' 
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.helpdesk_tickets ADD COLUMN source text DEFAULT 'manual';
  END IF;
END $$;

-- Add index for faster lookups on auto-generated tickets
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_source ON public.helpdesk_tickets(source);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_device_context ON public.helpdesk_tickets USING gin(device_context);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_ticket_from_rmm_alert() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ticket_from_rmm_alert() TO service_role;