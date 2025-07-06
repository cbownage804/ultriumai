-- Create audit trails table for tracking admin actions
CREATE TABLE public.admin_audit_trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  resource_name TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_trails ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "UltriumAI employees can view all audit trails" 
ON public.admin_audit_trails 
FOR SELECT 
USING (is_ultrium_employee(auth.uid()));

CREATE POLICY "System can insert audit trails" 
ON public.admin_audit_trails 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_admin_audit_trails_admin_user_id ON public.admin_audit_trails(admin_user_id);
CREATE INDEX idx_admin_audit_trails_action ON public.admin_audit_trails(action);
CREATE INDEX idx_admin_audit_trails_resource_type ON public.admin_audit_trails(resource_type);
CREATE INDEX idx_admin_audit_trails_created_at ON public.admin_audit_trails(created_at DESC);