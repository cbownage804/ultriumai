-- Create table for scheduled scans
CREATE TABLE public.scheduled_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('email', 'url', 'document', 'bulk')),
  scan_target TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  schedule_time TIME NOT NULL DEFAULT '09:00:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_scans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own scheduled scans" 
ON public.scheduled_scans 
FOR ALL 
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_scans_updated_at
BEFORE UPDATE ON public.scheduled_scans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate next run time
CREATE OR REPLACE FUNCTION public.calculate_next_run(frequency TEXT, schedule_time TIME)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 
    CASE 
      WHEN frequency = 'daily' THEN 
        (CURRENT_DATE + INTERVAL '1 day' + schedule_time)::TIMESTAMP WITH TIME ZONE
      WHEN frequency = 'weekly' THEN 
        (CURRENT_DATE + INTERVAL '7 days' + schedule_time)::TIMESTAMP WITH TIME ZONE
      WHEN frequency = 'monthly' THEN 
        (CURRENT_DATE + INTERVAL '1 month' + schedule_time)::TIMESTAMP WITH TIME ZONE
      ELSE 
        (CURRENT_DATE + INTERVAL '1 day' + schedule_time)::TIMESTAMP WITH TIME ZONE
    END
$$;