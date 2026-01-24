-- Enable RLS on helpdesk_technicians if not already enabled
ALTER TABLE public.helpdesk_technicians ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.helpdesk_technicians;
DROP POLICY IF EXISTS "Public read access" ON public.helpdesk_technicians;

-- Create policy for authenticated users to view technicians
CREATE POLICY "Authenticated users can view technicians"
ON public.helpdesk_technicians
FOR SELECT
TO authenticated
USING (true);

-- Create policy for owners to manage their own technician records
CREATE POLICY "Users can manage their own technician records"
ON public.helpdesk_technicians
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);