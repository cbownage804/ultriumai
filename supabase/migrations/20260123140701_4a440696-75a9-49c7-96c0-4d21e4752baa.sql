-- Add missing columns to scheduled_scans table
ALTER TABLE public.scheduled_scans 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS targets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notify_on_threat BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_email TEXT;

-- Create scheduled_scan_results table if not exists
CREATE TABLE IF NOT EXISTS public.scheduled_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheduled_scan_id UUID NOT NULL REFERENCES public.scheduled_scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  threats_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on results table
ALTER TABLE public.scheduled_scan_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_scan_results (use IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_scan_results' AND policyname = 'Users can view their own scan results') THEN
    CREATE POLICY "Users can view their own scan results" ON public.scheduled_scan_results FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_scan_results' AND policyname = 'Users can create their own scan results') THEN
    CREATE POLICY "Users can create their own scan results" ON public.scheduled_scan_results FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;