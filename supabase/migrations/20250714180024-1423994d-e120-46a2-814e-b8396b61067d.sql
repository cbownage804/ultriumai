-- Create SafePass tables for comprehensive password management

-- Password Vaults table
CREATE TABLE IF NOT EXISTS public.password_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Password Entries table
CREATE TABLE IF NOT EXISTS public.password_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES password_vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  password_encrypted TEXT NOT NULL,
  website TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  notes TEXT,
  strength_score INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  shared_with TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Password Audit Logs table
CREATE TABLE IF NOT EXISTS public.password_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  password_entry_id UUID REFERENCES password_entries(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.password_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for password_vaults
CREATE POLICY "Users can view their own vaults" 
ON public.password_vaults 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own vaults" 
ON public.password_vaults 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vaults" 
ON public.password_vaults 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own vaults" 
ON public.password_vaults 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for password_entries
CREATE POLICY "Users can view their own entries" 
ON public.password_entries 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own entries" 
ON public.password_entries 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own entries" 
ON public.password_entries 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own entries" 
ON public.password_entries 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for password_audit_logs
CREATE POLICY "Users can view their own audit logs" 
ON public.password_audit_logs 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create audit logs" 
ON public.password_audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_password_vaults_user_id ON password_vaults(user_id);
CREATE INDEX idx_password_entries_vault_id ON password_entries(vault_id);
CREATE INDEX idx_password_entries_user_id ON password_entries(user_id);
CREATE INDEX idx_password_audit_logs_user_id ON password_audit_logs(user_id);
CREATE INDEX idx_password_audit_logs_entry_id ON password_audit_logs(password_entry_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_password_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_password_vaults_updated_at
  BEFORE UPDATE ON password_vaults
  FOR EACH ROW
  EXECUTE FUNCTION update_password_updated_at_column();

CREATE TRIGGER update_password_entries_updated_at
  BEFORE UPDATE ON password_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_password_updated_at_column();