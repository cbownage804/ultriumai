import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientComplianceProfile {
  id: string;
  client_id: string;
  framework_type: string;
  is_enabled: boolean;
  compliance_score: number;
  last_scan_at: string | null;
  target_score: number;
  notes: string | null;
}

export interface ClientCompliancePolicy {
  id: string;
  client_id: string;
  policy_name: string;
  framework_type: string;
  description: string | null;
  status: string;
  due_date: string | null;
  evidence_url: string | null;
  evidence_notes: string | null;
  assigned_to: string | null;
  created_at: string;
}

export interface ComplyClientSummary {
  client_id: string;
  company_name: string;
  contact_email: string;
  health_status: string | null;
  endpoints: number | null;
  frameworks: ClientComplianceProfile[];
  avg_score: number;
  total_policies: number;
  compliant_policies: number;
}

export function useClientCompliance(clientId?: string) {
  const { user } = useAuth();
  const [clients, setClients] = useState<ComplyClientSummary[]>([]);
  const [profiles, setProfiles] = useState<ClientComplianceProfile[]>([]);
  const [policies, setPolicies] = useState<ClientCompliancePolicy[]>([]);
  const [scanJobs, setScanJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllClients = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: mspClients } = await supabase
        .from('msp_clients')
        .select('id, company_name, contact_email, health_status, endpoints')
        .order('company_name');

      const { data: allProfiles } = await (supabase as any)
        .from('client_compliance_profiles')
        .select('*')
        .eq('user_id', user.id);

      const { data: allPolicies } = await (supabase as any)
        .from('client_compliance_policies')
        .select('*')
        .eq('user_id', user.id);

      const summaries: ComplyClientSummary[] = (mspClients || []).map((c: any) => {
        const clientProfiles = (allProfiles || []).filter((p: any) => p.client_id === c.id);
        const clientPolicies = (allPolicies || []).filter((p: any) => p.client_id === c.id);
        const scores = clientProfiles.filter((p: any) => p.is_enabled).map((p: any) => Number(p.compliance_score));
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

        return {
          client_id: c.id,
          company_name: c.company_name,
          contact_email: c.contact_email,
          health_status: c.health_status,
          endpoints: c.endpoints,
          frameworks: clientProfiles,
          avg_score: avgScore,
          total_policies: clientPolicies.length,
          compliant_policies: clientPolicies.filter((p: any) => p.status === 'compliant').length,
        };
      });

      setClients(summaries);
    } catch (err) {
      console.error('Failed to load compliance clients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientDetail = async (cId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [profilesRes, policiesRes, scansRes] = await Promise.all([
        (supabase as any).from('client_compliance_profiles').select('*').eq('client_id', cId).eq('user_id', user.id),
        (supabase as any).from('client_compliance_policies').select('*').eq('client_id', cId).eq('user_id', user.id).order('created_at', { ascending: false }),
        (supabase as any).from('compliance_scan_jobs').select('*').eq('client_id', cId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      ]);

      setProfiles(profilesRes.data || []);
      setPolicies(policiesRes.data || []);
      setScanJobs(scansRes.data || []);
    } catch (err) {
      console.error('Failed to load client compliance detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const enableFramework = async (cId: string, frameworkType: string) => {
    if (!user) return;
    try {
      await (supabase as any).from('client_compliance_profiles').upsert({
        user_id: user.id,
        client_id: cId,
        framework_type: frameworkType,
        is_enabled: true,
        compliance_score: 0,
      }, { onConflict: 'client_id,framework_type' });
      if (clientId) await loadClientDetail(clientId);
      else await loadAllClients();
    } catch (err) {
      console.error('Failed to enable framework:', err);
    }
  };

  const addPolicy = async (policy: Omit<ClientCompliancePolicy, 'id' | 'created_at'> & { user_id?: string }) => {
    if (!user) return;
    try {
      await (supabase as any).from('client_compliance_policies').insert({
        ...policy,
        user_id: user.id,
      });
      if (clientId) await loadClientDetail(clientId);
    } catch (err) {
      console.error('Failed to add policy:', err);
    }
  };

  const updatePolicyStatus = async (policyId: string, status: string) => {
    if (!user) return;
    try {
      await (supabase as any).from('client_compliance_policies').update({ status, updated_at: new Date().toISOString() }).eq('id', policyId);
      if (clientId) await loadClientDetail(clientId);
    } catch (err) {
      console.error('Failed to update policy:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (clientId) {
      loadClientDetail(clientId);
    } else {
      loadAllClients();
    }
  }, [user, clientId]);

  return {
    clients,
    profiles,
    policies,
    scanJobs,
    isLoading,
    enableFramework,
    addPolicy,
    updatePolicyStatus,
    refetch: () => clientId ? loadClientDetail(clientId) : loadAllClients(),
  };
}
