import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectSettingsData {
  id?: string;
  project_slug: string;
  project_name: string;
  visibility: string;
  hide_branding: boolean;
  disable_analytics: boolean;
  cross_project_sharing: boolean;
  allow_public_preview: boolean;
  supabase_url: string;
  supabase_anon_key: string;
  stripe_publishable_key: string;
  github_token: string;
  vercel_token: string;
  service_keys: Array<{ id: string; serviceId: string; apiKey: string }>;
  env_vars: Array<{ key: string; value: string }>;
}

export interface DomainEntry {
  id: string;
  domain: string;
  status: 'verifying' | 'setting_up' | 'active' | 'failed' | 'offline';
  is_primary: boolean;
  ssl_status: 'pending' | 'provisioning' | 'active' | 'failed';
  txt_record: string;
  verified_at: string | null;
  created_at: string;
}

const DEFAULT_SETTINGS: Omit<ProjectSettingsData, 'project_slug'> = {
  project_name: '',
  visibility: 'private',
  hide_branding: false,
  disable_analytics: false,
  cross_project_sharing: true,
  allow_public_preview: true,
  supabase_url: '',
  supabase_anon_key: '',
  stripe_publishable_key: '',
  github_token: '',
  vercel_token: '',
  service_keys: [],
  env_vars: [],
};

export function useProjectSettings(projectSlug: string) {
  const [settings, setSettings] = useState<ProjectSettingsData>({ ...DEFAULT_SETTINGS, project_slug: projectSlug });
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings
  useEffect(() => {
    if (!projectSlug) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        // Load settings
        const { data: settingsData } = await (supabase as any)
          .from('app_builder_project_settings')
          .select('*')
          .eq('user_id', user.id)
          .eq('project_slug', projectSlug)
          .maybeSingle();

        if (settingsData && !cancelled) {
          setSettings({
            id: settingsData.id,
            project_slug: settingsData.project_slug,
            project_name: settingsData.project_name || '',
            visibility: settingsData.visibility || 'private',
            hide_branding: settingsData.hide_branding || false,
            disable_analytics: settingsData.disable_analytics || false,
            cross_project_sharing: settingsData.cross_project_sharing ?? true,
            allow_public_preview: settingsData.allow_public_preview ?? true,
            supabase_url: settingsData.supabase_url || '',
            supabase_anon_key: settingsData.supabase_anon_key || '',
            stripe_publishable_key: settingsData.stripe_publishable_key || '',
            github_token: settingsData.github_token || '',
            vercel_token: settingsData.vercel_token || '',
            service_keys: (settingsData.service_keys as any) || [],
            env_vars: (settingsData.env_vars as any) || [],
          });
        }

        // Load domains
        const { data: domainsData } = await (supabase as any)
          .from('app_builder_domains')
          .select('*')
          .eq('user_id', user.id)
          .eq('project_slug', projectSlug)
          .order('created_at', { ascending: true });

        if (domainsData && !cancelled) {
          setDomains(domainsData.map((d: any) => ({
            id: d.id,
            domain: d.domain,
            status: d.status,
            is_primary: d.is_primary,
            ssl_status: d.ssl_status,
            txt_record: d.txt_record,
            verified_at: d.verified_at,
            created_at: d.created_at,
          })));
        }
      } catch (err) {
        console.error('Failed to load project settings:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [projectSlug]);

  // Save settings
  const saveSettings = useCallback(async (updates: Partial<ProjectSettingsData>) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const merged = { ...settings, ...updates };
      setSettings(merged);

      const row = {
        user_id: user.id,
        project_slug: projectSlug,
        project_name: merged.project_name || null,
        visibility: merged.visibility,
        hide_branding: merged.hide_branding,
        disable_analytics: merged.disable_analytics,
        cross_project_sharing: merged.cross_project_sharing,
        allow_public_preview: merged.allow_public_preview,
        supabase_url: merged.supabase_url || null,
        supabase_anon_key: merged.supabase_anon_key || null,
        stripe_publishable_key: merged.stripe_publishable_key || null,
        github_token: merged.github_token || null,
        vercel_token: merged.vercel_token || null,
        service_keys: merged.service_keys,
        env_vars: merged.env_vars,
      };

      const { error } = await (supabase as any)
        .from('app_builder_project_settings')
        .upsert(row, { onConflict: 'user_id,project_slug' });

      if (error) throw error;
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  }, [settings, projectSlug]);

  // Add domain
  const addDomain = useCallback(async (domainName: string): Promise<DomainEntry | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const cleaned = domainName.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      if (!cleaned || !cleaned.includes('.')) {
        toast.error('Enter a valid domain like example.com');
        return null;
      }

      const txtRecord = `ultriumai-verify=${crypto.randomUUID().split('-')[0]}`;
      const isPrimary = domains.length === 0;

      const { data, error } = await (supabase as any)
        .from('app_builder_domains')
        .insert({
          user_id: user.id,
          project_slug: projectSlug,
          domain: cleaned,
          status: 'verifying',
          is_primary: isPrimary,
          ssl_status: 'pending',
          txt_record: txtRecord,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('This domain is already connected to a project');
        } else {
          toast.error('Failed to add domain');
        }
        return null;
      }

      const entry: DomainEntry = {
        id: data.id,
        domain: data.domain,
        status: data.status,
        is_primary: data.is_primary,
        ssl_status: data.ssl_status,
        txt_record: data.txt_record,
        verified_at: data.verified_at,
        created_at: data.created_at,
      };

      setDomains(prev => [...prev, entry]);
      toast.success(`Domain ${cleaned} added — configure DNS records below`);
      return entry;
    } catch (err) {
      console.error('Failed to add domain:', err);
      toast.error('Failed to add domain');
      return null;
    }
  }, [domains, projectSlug]);

  // Remove domain
  const removeDomain = useCallback(async (domainId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('app_builder_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
      setDomains(prev => prev.filter(d => d.id !== domainId));
      toast.success('Domain removed');
    } catch (err) {
      console.error('Failed to remove domain:', err);
      toast.error('Failed to remove domain');
    }
  }, []);

  // Set primary domain
  const setPrimaryDomain = useCallback(async (domainId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all primary flags first
      await (supabase as any)
        .from('app_builder_domains')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('project_slug', projectSlug);

      // Set the new primary
      await (supabase as any)
        .from('app_builder_domains')
        .update({ is_primary: true })
        .eq('id', domainId);

      setDomains(prev => prev.map(d => ({ ...d, is_primary: d.id === domainId })));
      toast.success('Primary domain updated');
    } catch (err) {
      console.error('Failed to set primary domain:', err);
    }
  }, [projectSlug]);

  // Verify domain DNS
  const verifyDomain = useCallback(async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    try {
      // Call edge function to verify DNS
      const { data, error } = await supabase.functions.invoke('verify-domain', {
        body: { domain: domain.domain, txtRecord: domain.txt_record },
      });

      if (error) throw error;

      const newStatus = data?.verified ? 'active' : 'verifying';
      const newSslStatus = data?.verified ? 'active' : 'pending';

      await (supabase as any)
        .from('app_builder_domains')
        .update({
          status: newStatus,
          ssl_status: newSslStatus,
          verified_at: data?.verified ? new Date().toISOString() : null,
        })
        .eq('id', domainId);

      setDomains(prev => prev.map(d => d.id === domainId ? {
        ...d,
        status: newStatus as any,
        ssl_status: newSslStatus as any,
        verified_at: data?.verified ? new Date().toISOString() : null,
      } : d));

      if (data?.verified) {
        toast.success('Domain verified and SSL provisioned!');
      } else {
        toast.info('DNS records not found yet. Please wait for propagation (up to 48 hours).');
      }
    } catch (err) {
      console.error('Domain verification error:', err);
      toast.error('Verification failed — check DNS records and try again');
    }
  }, [domains]);

  return {
    settings,
    domains,
    isLoading,
    isSaving,
    saveSettings,
    addDomain,
    removeDomain,
    setPrimaryDomain,
    verifyDomain,
  };
}
