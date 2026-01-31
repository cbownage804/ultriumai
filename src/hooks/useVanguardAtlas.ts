/**
 * Vanguard Atlas Documentation Hook
 * For the Vanguard IT documentation system (ITGlue replica)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AtlasOrganization {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AtlasDocument {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  content?: string;
  category: string;
  tags?: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface AtlasPassword {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  username?: string;
  password_encrypted?: string;
  url?: string;
  notes?: string;
  category: string;
  otp_secret?: string;
  last_rotated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AtlasSSLCertificate {
  id: string;
  user_id: string;
  organization_id?: string;
  domain: string;
  issuer?: string;
  valid_from?: string;
  valid_until?: string;
  certificate_type: string;
  auto_renew: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AtlasConfiguration {
  id: string;
  user_id: string;
  organization_id?: string;
  name: string;
  configuration_type: string;
  configuration_data: Record<string, any>;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AtlasRunbook {
  id: string;
  user_id: string;
  organization_id?: string;
  title: string;
  content?: string;
  category: string;
  estimated_time_minutes?: number;
  difficulty_level: string;
  steps: any[];
  tags?: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AtlasExpiration {
  id: string;
  user_id: string;
  organization_id?: string;
  item_type: string;
  item_name: string;
  item_id?: string;
  expires_at: string;
  notification_days: number[];
  notes?: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  daysUntilExpiry?: number;
}

export interface AtlasStats {
  organizations: number;
  documents: number;
  passwords: number;
  sslCertificates: number;
  configurations: number;
  runbooks: number;
  expiringItems: number;
  sslExpiring: number;
}

export const useVanguardAtlas = (organizationId?: string) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<AtlasOrganization[]>([]);
  const [documents, setDocuments] = useState<AtlasDocument[]>([]);
  const [passwords, setPasswords] = useState<AtlasPassword[]>([]);
  const [sslCertificates, setSslCertificates] = useState<AtlasSSLCertificate[]>([]);
  const [configurations, setConfigurations] = useState<AtlasConfiguration[]>([]);
  const [runbooks, setRunbooks] = useState<AtlasRunbook[]>([]);
  const [expirations, setExpirations] = useState<AtlasExpiration[]>([]);

  const fetchOrganizations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await (supabase as any)
      .from('atlas_organizations')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching organizations:', error);
      return;
    }
    setOrganizations(data || []);
  }, [user]);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    let query = (supabase as any)
      .from('atlas_documents')
      .select('*')
      .eq('user_id', user.id);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }
    setDocuments(data || []);
  }, [user, organizationId]);

  const fetchPasswords = useCallback(async () => {
    if (!user) return;
    
    let query = (supabase as any)
      .from('atlas_passwords')
      .select('*')
      .eq('user_id', user.id);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching passwords:', error);
      return;
    }
    setPasswords(data || []);
  }, [user, organizationId]);

  const fetchSSLCertificates = useCallback(async () => {
    if (!user) return;
    
    let query = (supabase as any)
      .from('atlas_ssl_certificates')
      .select('*')
      .eq('user_id', user.id);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('valid_until');

    if (error) {
      console.error('Error fetching SSL certificates:', error);
      return;
    }
    setSslCertificates(data || []);
  }, [user, organizationId]);

  const fetchConfigurations = useCallback(async () => {
    if (!user) return;
    
    let query = (supabase as any)
      .from('atlas_configurations')
      .select('*')
      .eq('user_id', user.id);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('name');

    if (error) {
      console.error('Error fetching configurations:', error);
      return;
    }
    setConfigurations(data || []);
  }, [user, organizationId]);

  const fetchRunbooks = useCallback(async () => {
    if (!user) return;
    
    let query = (supabase as any)
      .from('atlas_runbooks')
      .select('*')
      .eq('user_id', user.id);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('title');

    if (error) {
      console.error('Error fetching runbooks:', error);
      return;
    }
    setRunbooks(data || []);
  }, [user, organizationId]);

  const fetchExpirations = useCallback(async () => {
    if (!user) return;
    
    let query = (supabase as any)
      .from('atlas_expirations')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_resolved', false);
    
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    
    const { data, error } = await query.order('expires_at');

    if (error) {
      console.error('Error fetching expirations:', error);
      return;
    }
    
    // Calculate days until expiry
    const withDays = (data || []).map((exp: AtlasExpiration) => ({
      ...exp,
      daysUntilExpiry: Math.ceil((new Date(exp.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }));
    
    setExpirations(withDays);
  }, [user, organizationId]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchOrganizations(),
      fetchDocuments(),
      fetchPasswords(),
      fetchSSLCertificates(),
      fetchConfigurations(),
      fetchRunbooks(),
      fetchExpirations(),
    ]);
    setIsLoading(false);
  }, [fetchOrganizations, fetchDocuments, fetchPasswords, fetchSSLCertificates, fetchConfigurations, fetchRunbooks, fetchExpirations]);

  useEffect(() => {
    if (user) {
      refetch();
    } else {
      setIsLoading(false);
    }
  }, [user, organizationId, refetch]);

  // CRUD Operations
  const createOrganization = async (data: Partial<AtlasOrganization>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_organizations')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create organization');
      console.error(error);
      return null;
    }
    
    toast.success('Organization created');
    await fetchOrganizations();
    return result;
  };

  const updateOrganization = async (id: string, data: Partial<AtlasOrganization>) => {
    const { error } = await (supabase as any)
      .from('atlas_organizations')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update organization');
      console.error(error);
      return false;
    }
    
    toast.success('Organization updated');
    await fetchOrganizations();
    return true;
  };

  const deleteOrganization = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_organizations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete organization');
      console.error(error);
      return false;
    }
    
    toast.success('Organization deleted');
    await fetchOrganizations();
    return true;
  };

  const createDocument = async (data: Partial<AtlasDocument>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_documents')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create document');
      console.error(error);
      return null;
    }
    
    toast.success('Document created');
    await fetchDocuments();
    return result;
  };

  const updateDocument = async (id: string, data: Partial<AtlasDocument>) => {
    const { error } = await (supabase as any)
      .from('atlas_documents')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update document');
      console.error(error);
      return false;
    }
    
    toast.success('Document updated');
    await fetchDocuments();
    return true;
  };

  const deleteDocument = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_documents')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete document');
      console.error(error);
      return false;
    }
    
    toast.success('Document deleted');
    await fetchDocuments();
    return true;
  };

  const createPassword = async (data: Partial<AtlasPassword>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_passwords')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create password entry');
      console.error(error);
      return null;
    }
    
    toast.success('Password entry created');
    await fetchPasswords();
    return result;
  };

  const updatePassword = async (id: string, data: Partial<AtlasPassword>) => {
    const { error } = await (supabase as any)
      .from('atlas_passwords')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update password entry');
      console.error(error);
      return false;
    }
    
    toast.success('Password entry updated');
    await fetchPasswords();
    return true;
  };

  const deletePassword = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_passwords')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete password entry');
      console.error(error);
      return false;
    }
    
    toast.success('Password entry deleted');
    await fetchPasswords();
    return true;
  };

  const createSSLCertificate = async (data: Partial<AtlasSSLCertificate>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_ssl_certificates')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create SSL certificate');
      console.error(error);
      return null;
    }
    
    toast.success('SSL certificate created');
    await fetchSSLCertificates();
    return result;
  };

  const updateSSLCertificate = async (id: string, data: Partial<AtlasSSLCertificate>) => {
    const { error } = await (supabase as any)
      .from('atlas_ssl_certificates')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update SSL certificate');
      console.error(error);
      return false;
    }
    
    toast.success('SSL certificate updated');
    await fetchSSLCertificates();
    return true;
  };

  const deleteSSLCertificate = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_ssl_certificates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete SSL certificate');
      console.error(error);
      return false;
    }
    
    toast.success('SSL certificate deleted');
    await fetchSSLCertificates();
    return true;
  };

  const createConfiguration = async (data: Partial<AtlasConfiguration>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_configurations')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create configuration');
      console.error(error);
      return null;
    }
    
    toast.success('Configuration created');
    await fetchConfigurations();
    return result;
  };

  const updateConfiguration = async (id: string, data: Partial<AtlasConfiguration>) => {
    const { error } = await (supabase as any)
      .from('atlas_configurations')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update configuration');
      console.error(error);
      return false;
    }
    
    toast.success('Configuration updated');
    await fetchConfigurations();
    return true;
  };

  const deleteConfiguration = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_configurations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete configuration');
      console.error(error);
      return false;
    }
    
    toast.success('Configuration deleted');
    await fetchConfigurations();
    return true;
  };

  const createRunbook = async (data: Partial<AtlasRunbook>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_runbooks')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create runbook');
      console.error(error);
      return null;
    }
    
    toast.success('Runbook created');
    await fetchRunbooks();
    return result;
  };

  const updateRunbook = async (id: string, data: Partial<AtlasRunbook>) => {
    const { error } = await (supabase as any)
      .from('atlas_runbooks')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error('Failed to update runbook');
      console.error(error);
      return false;
    }
    
    toast.success('Runbook updated');
    await fetchRunbooks();
    return true;
  };

  const deleteRunbook = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_runbooks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete runbook');
      console.error(error);
      return false;
    }
    
    toast.success('Runbook deleted');
    await fetchRunbooks();
    return true;
  };

  const createExpiration = async (data: Partial<AtlasExpiration>) => {
    if (!user) return null;
    
    const { data: result, error } = await (supabase as any)
      .from('atlas_expirations')
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error('Failed to track expiration');
      console.error(error);
      return null;
    }
    
    toast.success('Expiration tracked');
    await fetchExpirations();
    return result;
  };

  const resolveExpiration = async (id: string) => {
    const { error } = await (supabase as any)
      .from('atlas_expirations')
      .update({ is_resolved: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to resolve expiration');
      console.error(error);
      return false;
    }
    
    toast.success('Expiration resolved');
    await fetchExpirations();
    return true;
  };

  // Calculate SSL certificates expiring within 30 days
  const sslExpiring = sslCertificates.filter(cert => {
    if (!cert.valid_until) return false;
    const days = Math.ceil((new Date(cert.valid_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });

  const stats: AtlasStats = {
    organizations: organizations.length,
    documents: documents.length,
    passwords: passwords.length,
    sslCertificates: sslCertificates.length,
    configurations: configurations.length,
    runbooks: runbooks.length,
    expiringItems: expirations.filter(e => (e.daysUntilExpiry || 0) <= 30).length,
    sslExpiring: sslExpiring.length,
  };

  return {
    isLoading,
    organizations,
    documents,
    passwords,
    sslCertificates,
    configurations,
    runbooks,
    expirations,
    stats,
    refetch,
    // Organization CRUD
    createOrganization,
    updateOrganization,
    deleteOrganization,
    // Document CRUD
    createDocument,
    updateDocument,
    deleteDocument,
    // Password CRUD
    createPassword,
    updatePassword,
    deletePassword,
    // SSL Certificate CRUD
    createSSLCertificate,
    updateSSLCertificate,
    deleteSSLCertificate,
    // Configuration CRUD
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    // Runbook CRUD
    createRunbook,
    updateRunbook,
    deleteRunbook,
    // Expiration CRUD
    createExpiration,
    resolveExpiration,
  };
};
