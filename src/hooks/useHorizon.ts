/**
 * Unified Horizon RMM Data Hooks
 * Provides real-time data access for all Horizon modules
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// =====================================================
// TYPES
// =====================================================

export interface ThreatHunt {
  id: string;
  user_id: string;
  hunt_name: string;
  hunt_type: 'ioc' | 'behavioral' | 'memory' | 'network';
  query_parameters: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results_count: number;
  findings: any[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VulnerabilityScan {
  id: string;
  user_id: string;
  agent_id: string | null;
  scan_type: 'full' | 'quick' | 'targeted';
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  total_vulnerabilities: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  vulnerabilities: any[];
  scan_duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SecurityBaseline {
  id: string;
  user_id: string;
  baseline_name: string;
  baseline_type: 'cis' | 'nist' | 'custom';
  framework_version: string | null;
  is_active: boolean;
  policy_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Playbook {
  id: string;
  user_id: string;
  playbook_name: string;
  description: string | null;
  trigger_type: 'manual' | 'alert' | 'threshold';
  trigger_conditions: Record<string, any>;
  steps: any[];
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileTransfer {
  id: string;
  user_id: string;
  agent_id: string;
  direction: 'upload' | 'download';
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  progress_percent: number;
  error_message: string | null;
  created_at: string;
}

export interface WoLRequest {
  id: string;
  user_id: string;
  target_mac_address: string;
  target_device_name: string | null;
  agent_id: string | null;
  status: 'pending' | 'sent' | 'confirmed' | 'failed';
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
}

export interface HorizonTenant {
  id: string;
  owner_user_id: string;
  tenant_name: string;
  tenant_slug: string;
  logo_url: string | null;
  primary_color: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface HorizonRole {
  id: string;
  user_id: string;
  tenant_id: string | null;
  role_name: string;
  description: string | null;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  tenant_id: string | null;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface ScheduledReport {
  id: string;
  user_id: string;
  tenant_id: string | null;
  report_name: string;
  report_type: string;
  schedule_cron: string;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel';
  filters: Record<string, any>;
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhiteLabelConfig {
  id: string;
  user_id: string;
  tenant_id: string | null;
  company_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  custom_css: string | null;
  email_footer: string | null;
  report_footer: string | null;
  created_at: string;
  updated_at: string;
}

export interface SLAMetric {
  id: string;
  user_id: string;
  tenant_id: string | null;
  client_id: string | null;
  metric_date: string;
  total_tickets: number;
  tickets_within_response_sla: number;
  tickets_within_resolution_sla: number;
  avg_response_time_minutes: number | null;
  avg_resolution_time_minutes: number | null;
  uptime_percent: number | null;
  incidents_count: number;
  created_at: string;
}

// =====================================================
// THREAT HUNTING HOOK
// =====================================================

export function useThreatHunts() {
  const { user } = useAuth();
  const [hunts, setHunts] = useState<ThreatHunt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHunts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_threat_hunts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setHunts(data as ThreatHunt[] || []);
    } catch (err) {
      console.error('Error fetching threat hunts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createHunt = useCallback(async (hunt: Partial<ThreatHunt>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_threat_hunts')
      .insert([{ 
        hunt_name: hunt.hunt_name || 'Untitled Hunt',
        hunt_type: hunt.hunt_type || 'ioc',
        query_parameters: hunt.query_parameters || {},
        user_id: user.id 
      }] as any)
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Threat hunt created');
    await fetchHunts();
    return data;
  }, [user, fetchHunts]);

  const startHunt = useCallback(async (huntId: string) => {
    const { error } = await supabase
      .from('horizon_threat_hunts')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', huntId);
    
    if (error) throw error;
    toast.success('Threat hunt started');
    await fetchHunts();
  }, [fetchHunts]);

  useEffect(() => {
    fetchHunts();
  }, [fetchHunts]);

  return { hunts, isLoading, createHunt, startHunt, refetch: fetchHunts };
}

// =====================================================
// VULNERABILITY SCANNING HOOK
// =====================================================

export function useVulnerabilityScans() {
  const { user } = useAuth();
  const [scans, setScans] = useState<VulnerabilityScan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_vulnerability_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setScans(data as VulnerabilityScan[] || []);
    } catch (err) {
      console.error('Error fetching vulnerability scans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const startScan = useCallback(async (agentId: string, scanType: 'full' | 'quick' | 'targeted' = 'full') => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_vulnerability_scans')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        scan_type: scanType,
        status: 'pending',
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Vulnerability scan started');
    await fetchScans();
    return data;
  }, [user, fetchScans]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  return { scans, isLoading, startScan, refetch: fetchScans };
}

// =====================================================
// SECURITY BASELINES HOOK
// =====================================================

export function useSecurityBaselines() {
  const { user } = useAuth();
  const [baselines, setBaselines] = useState<SecurityBaseline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBaselines = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_security_baselines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBaselines(data as SecurityBaseline[] || []);
    } catch (err) {
      console.error('Error fetching baselines:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createBaseline = useCallback(async (baseline: Partial<SecurityBaseline>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_security_baselines')
      .insert([{ 
        baseline_name: baseline.baseline_name || 'Untitled Baseline',
        baseline_type: baseline.baseline_type || 'cis',
        policy_config: baseline.policy_config || {},
        user_id: user.id 
      }] as any)
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Security baseline created');
    await fetchBaselines();
    return data;
  }, [user, fetchBaselines]);

  const toggleBaseline = useCallback(async (baselineId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('horizon_security_baselines')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', baselineId);
    
    if (error) throw error;
    toast.success(isActive ? 'Baseline enabled' : 'Baseline disabled');
    await fetchBaselines();
  }, [fetchBaselines]);

  useEffect(() => {
    fetchBaselines();
  }, [fetchBaselines]);

  return { baselines, isLoading, createBaseline, toggleBaseline, refetch: fetchBaselines };
}

// =====================================================
// PLAYBOOKS HOOK
// =====================================================

export function usePlaybooks() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlaybooks = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_playbooks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPlaybooks(data as Playbook[] || []);
    } catch (err) {
      console.error('Error fetching playbooks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createPlaybook = useCallback(async (playbook: Partial<Playbook>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_playbooks')
      .insert([{ 
        playbook_name: playbook.playbook_name || 'Untitled Playbook',
        description: playbook.description || null,
        trigger_type: playbook.trigger_type || 'manual',
        steps: playbook.steps || [],
        user_id: user.id 
      }] as any)
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Playbook created');
    await fetchPlaybooks();
    return data;
  }, [user, fetchPlaybooks]);

  const executePlaybook = useCallback(async (playbookId: string, agentId?: string) => {
    if (!user) throw new Error('Not authenticated');
    
    // Create execution record
    const { error } = await supabase
      .from('horizon_playbook_executions')
      .insert([{
        playbook_id: playbookId,
        user_id: user.id,
        agent_id: agentId || null,
        status: 'running',
        trigger_source: 'manual'
      }] as any);
    
    if (error) throw error;
    
    // Update playbook last execution time
    await supabase
      .from('horizon_playbooks')
      .update({ last_executed_at: new Date().toISOString() } as any)
      .eq('id', playbookId);
    
    toast.success('Playbook execution started');
    await fetchPlaybooks();
  }, [user, fetchPlaybooks]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  return { playbooks, isLoading, createPlaybook, executePlaybook, refetch: fetchPlaybooks };
}

// =====================================================
// FILE TRANSFER HOOK
// =====================================================

export function useFileTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_file_transfers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setTransfers(data as FileTransfer[] || []);
    } catch (err) {
      console.error('Error fetching file transfers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const initiateTransfer = useCallback(async (
    agentId: string, 
    direction: 'upload' | 'download',
    fileName: string,
    filePath: string,
    fileSize?: number
  ) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_file_transfers')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        direction,
        file_name: fileName,
        file_path: filePath,
        file_size_bytes: fileSize || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    toast.success(`File ${direction} initiated`);
    await fetchTransfers();
    return data;
  }, [user, fetchTransfers]);

  useEffect(() => {
    fetchTransfers();
    
    // Real-time updates for transfer progress
    const channel = supabase
      .channel('file_transfers')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'horizon_file_transfers' 
      }, () => fetchTransfers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTransfers]);

  return { transfers, isLoading, initiateTransfer, refetch: fetchTransfers };
}

// =====================================================
// WAKE-ON-LAN HOOK
// =====================================================

export function useWakeOnLan() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WoLRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_wol_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setRequests(data as WoLRequest[] || []);
    } catch (err) {
      console.error('Error fetching WoL requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendWakePacket = useCallback(async (
    macAddress: string,
    deviceName?: string,
    scannerAgentId?: string,
    broadcastAddress?: string
  ) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_wol_requests')
      .insert({
        user_id: user.id,
        target_mac_address: macAddress,
        target_device_name: deviceName || null,
        agent_id: scannerAgentId || null,
        broadcast_address: broadcastAddress || null,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Wake-on-LAN packet sent');
    await fetchRequests();
    return data;
  }, [user, fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, isLoading, sendWakePacket, refetch: fetchRequests };
}

// =====================================================
// TENANTS & RBAC HOOK
// =====================================================

export function useHorizonTenants() {
  const { user } = useAuth();
  const [tenants, setTenants] = useState<HorizonTenant[]>([]);
  const [roles, setRoles] = useState<HorizonRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [tenantsRes, rolesRes] = await Promise.all([
        supabase.from('horizon_tenants').select('*').eq('owner_user_id', user.id),
        supabase.from('horizon_roles').select('*').eq('user_id', user.id)
      ]);
      
      setTenants(tenantsRes.data as HorizonTenant[] || []);
      setRoles(rolesRes.data as HorizonRole[] || []);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createTenant = useCallback(async (tenant: Partial<HorizonTenant>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_tenants')
      .insert([{ 
        tenant_name: tenant.tenant_name || 'Untitled Tenant',
        tenant_slug: tenant.tenant_slug || `tenant-${Date.now()}`,
        owner_user_id: user.id 
      }] as any)
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Tenant created');
    await fetchData();
    return data;
  }, [user, fetchData]);

  const createRole = useCallback(async (role: Partial<HorizonRole>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_roles')
      .insert([{ 
        role_name: role.role_name || 'Untitled Role',
        permissions: role.permissions || [],
        user_id: user.id 
      }] as any)
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Role created');
    await fetchData();
    return data;
  }, [user, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { tenants, roles, isLoading, createTenant, createRole, refetch: fetchData };
}

// =====================================================
// ACTIVITY LOGS HOOK
// =====================================================

export function useActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async (limit = 100) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      setLogs(data as ActivityLog[] || []);
    } catch (err) {
      console.error('Error fetching activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const logActivity = useCallback(async (
    actionType: string,
    resourceType: string,
    resourceId?: string,
    resourceName?: string,
    details?: Record<string, any>
  ) => {
    if (!user) return;
    await supabase.from('horizon_activity_logs').insert({
      user_id: user.id,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId || null,
      resource_name: resourceName || null,
      details: details || {}
    });
  }, [user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, isLoading, logActivity, refetch: fetchLogs };
}

// =====================================================
// SCHEDULED REPORTS HOOK
// =====================================================

export function useScheduledReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_scheduled_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReports(data as ScheduledReport[] || []);
    } catch (err) {
      console.error('Error fetching scheduled reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createReport = useCallback(async (report: Partial<ScheduledReport>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('horizon_scheduled_reports')
      .insert([{ 
        report_name: report.report_name || 'Untitled Report',
        report_type: report.report_type || 'executive',
        schedule_cron: report.schedule_cron || '0 9 * * 1',
        recipients: report.recipients || [],
        format: report.format || 'pdf',
        user_id: user.id 
      }] as any)
      .select()
      .single();
    
    if (error) throw error;
    toast.success('Scheduled report created');
    await fetchReports();
    return data;
  }, [user, fetchReports]);

  const toggleReport = useCallback(async (reportId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('horizon_scheduled_reports')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', reportId);
    
    if (error) throw error;
    toast.success(isActive ? 'Report enabled' : 'Report disabled');
    await fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, createReport, toggleReport, refetch: fetchReports };
}

// =====================================================
// WHITE LABEL HOOK
// =====================================================

export function useWhiteLabel() {
  const { user } = useAuth();
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('horizon_white_label')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setConfig(data as WhiteLabelConfig | null);
    } catch (err) {
      console.error('Error fetching white label config:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveConfig = useCallback(async (newConfig: Partial<WhiteLabelConfig>) => {
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase
      .from('horizon_white_label')
      .upsert({ 
        ...newConfig, 
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();
    
    if (error) throw error;
    toast.success('White label settings saved');
    setConfig(data as WhiteLabelConfig);
    return data;
  }, [user]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, saveConfig, refetch: fetchConfig };
}

// =====================================================
// SLA METRICS HOOK
// =====================================================

export function useSLAMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SLAMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMetrics = useCallback(async (days = 30) => {
    if (!user) return;
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data, error } = await supabase
        .from('horizon_sla_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });
      
      if (error) throw error;
      setMetrics(data as SLAMetric[] || []);
    } catch (err) {
      console.error('Error fetching SLA metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, isLoading, refetch: fetchMetrics };
}
