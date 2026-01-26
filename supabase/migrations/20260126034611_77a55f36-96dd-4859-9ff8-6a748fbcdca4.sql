-- =====================================================
-- SafeDoc - Complete IT Documentation System
-- Replica of ITGlue with full capabilities
-- =====================================================

-- Create access role enum for SafeDoc
CREATE TYPE public.safedoc_role AS ENUM ('admin', 'editor', 'viewer', 'none');

-- =====================================================
-- ORGANIZATIONS (Multi-tenant: MSP clients)
-- =====================================================
CREATE TABLE public.safedoc_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  msp_client_id UUID REFERENCES public.msp_clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  short_name TEXT,
  description TEXT,
  logo_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  address JSONB DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  quick_notes TEXT,
  alert_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- FOLDERS (Hierarchical organization for documents)
-- =====================================================
CREATE TABLE public.safedoc_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.safedoc_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- DOCUMENTS (Main documentation with WYSIWYG content)
-- =====================================================
CREATE TABLE public.safedoc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.safedoc_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT, -- Rich HTML/TipTap JSON content
  content_format TEXT DEFAULT 'html' CHECK (content_format IN ('html', 'markdown', 'tiptap_json')),
  excerpt TEXT,
  document_type TEXT DEFAULT 'general' CHECK (document_type IN ('general', 'sop', 'runbook', 'checklist', 'policy', 'procedure', 'diagram', 'contact_list')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'review')),
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Document version history
CREATE TABLE public.safedoc_document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.safedoc_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  content_format TEXT DEFAULT 'html',
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- =====================================================
-- PASSWORDS (Secure credential storage per org)
-- =====================================================
CREATE TABLE public.safedoc_passwords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.safedoc_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  username TEXT,
  encrypted_password TEXT NOT NULL,
  url TEXT,
  password_type TEXT DEFAULT 'login' CHECK (password_type IN ('login', 'api_key', 'ssh_key', 'certificate', 'database', 'wifi', 'admin', 'service_account', 'other')),
  notes TEXT,
  otp_secret TEXT, -- Encrypted TOTP secret
  resource_type TEXT, -- e.g., 'server', 'application', 'network_device'
  resource_id TEXT, -- Link to external resource
  access_url TEXT,
  access_instructions TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  password_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_rotate BOOLEAN DEFAULT false,
  rotation_interval_days INTEGER,
  tags TEXT[],
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Password access log
CREATE TABLE public.safedoc_password_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_id UUID NOT NULL REFERENCES public.safedoc_passwords(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('viewed', 'copied', 'revealed', 'updated', 'created', 'deleted')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SSL CERTIFICATES (Tracking & Monitoring)
-- =====================================================
CREATE TABLE public.safedoc_ssl_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  common_name TEXT,
  issuer TEXT,
  issuer_organization TEXT,
  serial_number TEXT,
  fingerprint TEXT,
  fingerprint_sha256 TEXT,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  key_algorithm TEXT,
  key_size INTEGER,
  signature_algorithm TEXT,
  subject_alt_names TEXT[],
  chain_valid BOOLEAN,
  certificate_pem TEXT, -- Store the actual cert if needed
  private_key_location TEXT, -- Where the private key is stored (reference only)
  certificate_type TEXT DEFAULT 'standard' CHECK (certificate_type IN ('standard', 'wildcard', 'ev', 'dv', 'ov', 'self_signed', 'internal_ca')),
  provider TEXT, -- DigiCert, Let's Encrypt, etc.
  auto_renew BOOLEAN DEFAULT false,
  renewal_url TEXT,
  cost NUMERIC(10,2),
  purchase_date DATE,
  monitoring_enabled BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_check_status TEXT CHECK (last_check_status IN ('valid', 'expiring', 'expired', 'invalid', 'error', 'unknown')),
  alert_days_before INTEGER DEFAULT 30,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SSL check history
CREATE TABLE public.safedoc_ssl_check_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES public.safedoc_ssl_certificates(id) ON DELETE CASCADE,
  check_status TEXT NOT NULL,
  days_until_expiry INTEGER,
  chain_status TEXT,
  error_message TEXT,
  response_time_ms INTEGER,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- CONFIGURATIONS (Server/Device configs like ITGlue)
-- =====================================================
CREATE TABLE public.safedoc_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL, -- Link to SafeTrack
  name TEXT NOT NULL,
  configuration_type TEXT NOT NULL CHECK (configuration_type IN ('server', 'workstation', 'network_device', 'firewall', 'switch', 'router', 'access_point', 'printer', 'mobile_device', 'virtual_machine', 'cloud_resource', 'application', 'service', 'other')),
  hostname TEXT,
  primary_ip TEXT,
  secondary_ips TEXT[],
  mac_address TEXT,
  operating_system TEXT,
  os_version TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  location TEXT,
  notes TEXT,
  configuration_data JSONB DEFAULT '{}', -- Flexible config storage
  is_active BOOLEAN DEFAULT true,
  last_audit_date DATE,
  warranty_expiry DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- RUNBOOKS / SOPs (Standard Operating Procedures)
-- =====================================================
CREATE TABLE public.safedoc_runbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.safedoc_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  estimated_time_minutes INTEGER,
  steps JSONB DEFAULT '[]', -- Array of step objects: {order, title, content, is_checkpoint}
  prerequisites TEXT,
  related_documents UUID[], -- Links to safedoc_documents
  related_configurations UUID[], -- Links to safedoc_configurations
  is_published BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Runbook execution history
CREATE TABLE public.safedoc_runbook_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  runbook_id UUID NOT NULL REFERENCES public.safedoc_runbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_step INTEGER DEFAULT 0,
  step_results JSONB DEFAULT '[]', -- Array of results per step
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- EXPIRATIONS (Unified tracking for all expiring items)
-- =====================================================
CREATE TABLE public.safedoc_expirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('ssl_certificate', 'password', 'license', 'warranty', 'contract', 'domain', 'subscription', 'custom')),
  item_id UUID, -- Reference to the source item
  item_name TEXT NOT NULL,
  description TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  alert_days_before INTEGER DEFAULT 30,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  renewal_url TEXT,
  renewal_cost NUMERIC(10,2),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT, -- 'monthly', 'yearly', etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewed', 'cancelled', 'archived')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- ACCESS CONTROL (Full RBAC)
-- =====================================================

-- Access groups
CREATE TABLE public.safedoc_access_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_role safedoc_role DEFAULT 'viewer',
  is_system BOOLEAN DEFAULT false, -- For built-in groups
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Access group members
CREATE TABLE public.safedoc_access_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_group_id UUID NOT NULL REFERENCES public.safedoc_access_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role safedoc_role DEFAULT 'viewer',
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(access_group_id, user_id)
);

-- Organization-level access
CREATE TABLE public.safedoc_organization_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.safedoc_organizations(id) ON DELETE CASCADE,
  access_group_id UUID REFERENCES public.safedoc_access_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role safedoc_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT org_access_check CHECK (access_group_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Document-level access (overrides)
CREATE TABLE public.safedoc_document_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.safedoc_documents(id) ON DELETE CASCADE,
  access_group_id UUID REFERENCES public.safedoc_access_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role safedoc_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT doc_access_check CHECK (access_group_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Password-level access
CREATE TABLE public.safedoc_password_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_id UUID NOT NULL REFERENCES public.safedoc_passwords(id) ON DELETE CASCADE,
  access_group_id UUID REFERENCES public.safedoc_access_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role safedoc_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT pwd_access_check CHECK (access_group_id IS NOT NULL OR user_id IS NOT NULL)
);

-- =====================================================
-- RELATED ITEMS (Linking between entities)
-- =====================================================
CREATE TABLE public.safedoc_related_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  relationship_type TEXT DEFAULT 'related' CHECK (relationship_type IN ('related', 'depends_on', 'required_by', 'references', 'supersedes', 'part_of')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id)
);

-- =====================================================
-- ACTIVITY LOG (Audit trail)
-- =====================================================
CREATE TABLE public.safedoc_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.safedoc_organizations(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- GLOBAL KNOWLEDGE BASE (Cross-org articles)
-- =====================================================
CREATE TABLE public.safedoc_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_format TEXT DEFAULT 'html',
  category TEXT,
  is_public BOOLEAN DEFAULT false, -- Visible to all orgs
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TAGS (Centralized tagging)
-- =====================================================
CREATE TABLE public.safedoc_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  description TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.safedoc_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_password_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_ssl_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_ssl_check_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_runbook_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_expirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_access_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_access_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_organization_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_document_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_password_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_related_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safedoc_tags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Organizations policies
CREATE POLICY "Users can view their own organizations"
ON public.safedoc_organizations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own organizations"
ON public.safedoc_organizations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organizations"
ON public.safedoc_organizations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizations"
ON public.safedoc_organizations FOR DELETE
USING (auth.uid() = user_id);

-- Folders policies
CREATE POLICY "Users can manage their folders"
ON public.safedoc_folders FOR ALL
USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can manage their documents"
ON public.safedoc_documents FOR ALL
USING (auth.uid() = user_id);

-- Document versions policies
CREATE POLICY "Users can view document versions"
ON public.safedoc_document_versions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create document versions"
ON public.safedoc_document_versions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Passwords policies
CREATE POLICY "Users can manage their passwords"
ON public.safedoc_passwords FOR ALL
USING (auth.uid() = user_id);

-- Password access log policies
CREATE POLICY "Users can view their password access logs"
ON public.safedoc_password_access_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create password access logs"
ON public.safedoc_password_access_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- SSL certificates policies
CREATE POLICY "Users can manage their SSL certificates"
ON public.safedoc_ssl_certificates FOR ALL
USING (auth.uid() = user_id);

-- SSL check history policies
CREATE POLICY "Users can view SSL check history"
ON public.safedoc_ssl_check_history FOR SELECT
USING (EXISTS (SELECT 1 FROM public.safedoc_ssl_certificates WHERE id = certificate_id AND user_id = auth.uid()));

-- Configurations policies
CREATE POLICY "Users can manage their configurations"
ON public.safedoc_configurations FOR ALL
USING (auth.uid() = user_id);

-- Runbooks policies
CREATE POLICY "Users can manage their runbooks"
ON public.safedoc_runbooks FOR ALL
USING (auth.uid() = user_id);

-- Runbook executions policies
CREATE POLICY "Users can manage their runbook executions"
ON public.safedoc_runbook_executions FOR ALL
USING (auth.uid() = user_id);

-- Expirations policies
CREATE POLICY "Users can manage their expirations"
ON public.safedoc_expirations FOR ALL
USING (auth.uid() = user_id);

-- Access groups policies
CREATE POLICY "Users can manage their access groups"
ON public.safedoc_access_groups FOR ALL
USING (auth.uid() = user_id);

-- Access group members policies
CREATE POLICY "Access group owners can manage members"
ON public.safedoc_access_group_members FOR ALL
USING (EXISTS (SELECT 1 FROM public.safedoc_access_groups WHERE id = access_group_id AND user_id = auth.uid()));

-- Organization access policies
CREATE POLICY "Org owners can manage access"
ON public.safedoc_organization_access FOR ALL
USING (EXISTS (SELECT 1 FROM public.safedoc_organizations WHERE id = organization_id AND user_id = auth.uid()));

-- Document access policies
CREATE POLICY "Doc owners can manage access"
ON public.safedoc_document_access FOR ALL
USING (EXISTS (SELECT 1 FROM public.safedoc_documents WHERE id = document_id AND user_id = auth.uid()));

-- Password access policies
CREATE POLICY "Password owners can manage access"
ON public.safedoc_password_access FOR ALL
USING (EXISTS (SELECT 1 FROM public.safedoc_passwords WHERE id = password_id AND user_id = auth.uid()));

-- Related items policies
CREATE POLICY "Users can manage their related items"
ON public.safedoc_related_items FOR ALL
USING (auth.uid() = user_id);

-- Activity log policies
CREATE POLICY "Users can view their activity logs"
ON public.safedoc_activity_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create activity logs"
ON public.safedoc_activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Knowledge base policies
CREATE POLICY "Users can manage their KB articles"
ON public.safedoc_knowledge_base FOR ALL
USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can manage their tags"
ON public.safedoc_tags FOR ALL
USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================
CREATE TRIGGER update_safedoc_organizations_updated_at BEFORE UPDATE ON public.safedoc_organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_folders_updated_at BEFORE UPDATE ON public.safedoc_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_documents_updated_at BEFORE UPDATE ON public.safedoc_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_passwords_updated_at BEFORE UPDATE ON public.safedoc_passwords FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_ssl_certificates_updated_at BEFORE UPDATE ON public.safedoc_ssl_certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_configurations_updated_at BEFORE UPDATE ON public.safedoc_configurations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_runbooks_updated_at BEFORE UPDATE ON public.safedoc_runbooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_expirations_updated_at BEFORE UPDATE ON public.safedoc_expirations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_access_groups_updated_at BEFORE UPDATE ON public.safedoc_access_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_safedoc_knowledge_base_updated_at BEFORE UPDATE ON public.safedoc_knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_safedoc_documents_org ON public.safedoc_documents(organization_id);
CREATE INDEX idx_safedoc_documents_folder ON public.safedoc_documents(folder_id);
CREATE INDEX idx_safedoc_documents_status ON public.safedoc_documents(status);
CREATE INDEX idx_safedoc_passwords_org ON public.safedoc_passwords(organization_id);
CREATE INDEX idx_safedoc_ssl_org ON public.safedoc_ssl_certificates(organization_id);
CREATE INDEX idx_safedoc_ssl_expiry ON public.safedoc_ssl_certificates(valid_until);
CREATE INDEX idx_safedoc_configurations_org ON public.safedoc_configurations(organization_id);
CREATE INDEX idx_safedoc_configurations_asset ON public.safedoc_configurations(asset_id);
CREATE INDEX idx_safedoc_expirations_date ON public.safedoc_expirations(expires_at);
CREATE INDEX idx_safedoc_activity_entity ON public.safedoc_activity_log(entity_type, entity_id);