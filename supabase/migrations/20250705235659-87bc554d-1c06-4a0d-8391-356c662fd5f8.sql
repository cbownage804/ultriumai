-- Create SafePass password management tables
CREATE TABLE public.password_vaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_shared BOOLEAN DEFAULT false,
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.password_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vault_id UUID NOT NULL REFERENCES public.password_vaults(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  username TEXT,
  password_encrypted TEXT NOT NULL,
  website TEXT,
  category TEXT DEFAULT 'General',
  notes TEXT,
  strength_score INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.password_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  password_entry_id UUID REFERENCES public.password_entries(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'accessed', 'deleted', 'shared'
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_audit_logs ENABLE ROW LEVEL SECURITY;

-- Password Vaults Policies
CREATE POLICY "Users can view their own vaults" ON public.password_vaults
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view shared team vaults" ON public.password_vaults
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_memberships 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can create their own vaults" ON public.password_vaults
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vaults" ON public.password_vaults
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own vaults" ON public.password_vaults
  FOR DELETE USING (user_id = auth.uid());

-- Password Entries Policies
CREATE POLICY "Users can view their own password entries" ON public.password_entries
  FOR SELECT USING (
    user_id = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    vault_id IN (
      SELECT id FROM public.password_vaults 
      WHERE user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM public.team_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can create password entries in their vaults" ON public.password_entries
  FOR INSERT WITH CHECK (
    vault_id IN (
      SELECT id FROM public.password_vaults 
      WHERE user_id = auth.uid() OR team_id IN (
        SELECT team_id FROM public.team_memberships 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can update their own password entries" ON public.password_entries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own password entries" ON public.password_entries
  FOR DELETE USING (user_id = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Users can view their own audit logs" ON public.password_audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.password_audit_logs
  FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_password_vaults_updated_at
  BEFORE UPDATE ON public.password_vaults
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_password_entries_updated_at
  BEFORE UPDATE ON public.password_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_password_entries_vault_id ON public.password_entries(vault_id);
CREATE INDEX idx_password_entries_user_id ON public.password_entries(user_id);
CREATE INDEX idx_password_entries_website ON public.password_entries(website);
CREATE INDEX idx_password_audit_logs_user_id ON public.password_audit_logs(user_id);
CREATE INDEX idx_password_audit_logs_created_at ON public.password_audit_logs(created_at);

-- Add SafePass to security app subscriptions
INSERT INTO public.security_app_subscriptions (user_id, app_id, app_name, status, usage_limit, usage_current)
SELECT 
  p.user_id,
  'safepass',
  'SafePass Password Manager',
  'active',
  CASE 
    WHEN s.subscription_tier = 'enterprise' THEN -1  -- unlimited
    WHEN s.subscription_tier = 'premium' THEN 1000
    ELSE 100
  END,
  0
FROM public.profiles p
LEFT JOIN public.subscribers s ON p.user_id = s.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.security_app_subscriptions sas 
  WHERE sas.user_id = p.user_id AND sas.app_id = 'safepass'
);