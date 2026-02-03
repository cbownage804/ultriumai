import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Types
export interface XDRThreat {
  id: string;
  agent_id: string | null;
  threat_id: string;
  threat_name: string;
  threat_type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status: "detected" | "investigating" | "contained" | "remediated" | "false_positive";
  mitre_tactic: string | null;
  mitre_technique: string | null;
  mitre_subtechnique: string | null;
  detection_source: string | null;
  file_path: string | null;
  file_hash: string | null;
  process_name: string | null;
  process_id: number | null;
  parent_process: string | null;
  command_line: string | null;
  user_account: string | null;
  source_ip: string | null;
  destination_ip: string | null;
  destination_port: number | null;
  dns_query: string | null;
  raw_event: any;
  ai_analysis: string | null;
  ai_confidence: number | null;
  remediation_action: string | null;
  remediated_at: string | null;
  remediated_by: string | null;
  automation_mode: string;
  created_at: string;
  updated_at: string;
  agent?: { name: string } | null;
}

export interface XDRIOC {
  id: string;
  ioc_type: string;
  ioc_value: string;
  threat_name: string | null;
  severity: string;
  source: string | null;
  confidence: number;
  first_seen: string | null;
  last_seen: string | null;
  tags: string[] | null;
  description: string | null;
  is_active: boolean;
  matches_count: number;
  last_matched_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface XDRYaraRule {
  id: string;
  rule_name: string;
  rule_content: string;
  description: string | null;
  author: string | null;
  category: string | null;
  severity: string;
  tags: string[] | null;
  is_active: boolean;
  matches_count: number;
  last_matched_at: string | null;
  false_positives: number;
  created_at: string;
}

export interface XDRThreatFeed {
  id: string;
  feed_name: string;
  feed_url: string | null;
  feed_type: string;
  provider: string | null;
  is_active: boolean;
  sync_interval_hours: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  ioc_count: number;
  created_at: string;
}

export interface XDRForensics {
  id: string;
  agent_id: string | null;
  threat_id: string | null;
  collection_type: string;
  status: string;
  file_path: string | null;
  file_size_bytes: number | null;
  file_hash: string | null;
  storage_url: string | null;
  metadata: any;
  collected_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface XDRRansomwareEvent {
  id: string;
  agent_id: string | null;
  event_type: string;
  severity: string;
  status: string;
  process_name: string | null;
  process_id: number | null;
  files_affected: number;
  directories_affected: number;
  encryption_pattern: string | null;
  ransom_note_content: string | null;
  ransom_note_path: string | null;
  honeypot_file: string | null;
  shadow_copies_protected: boolean;
  rollback_available: boolean;
  rollback_initiated_at: string | null;
  rollback_completed_at: string | null;
  files_recovered: number | null;
  created_at: string;
  agent?: { name: string } | null;
}

export interface XDRAutomationPolicy {
  id: string;
  policy_name: string;
  policy_scope: string;
  scope_id: string | null;
  automation_mode: "full_auto" | "guided" | "alert_only";
  auto_isolate_on_critical: boolean;
  auto_kill_malicious_processes: boolean;
  auto_quarantine_files: boolean;
  auto_block_c2: boolean;
  auto_protect_shadow_copies: boolean;
  require_approval_for: string[] | null;
  notification_channels: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface XDRResponseAction {
  id: string;
  agent_id: string | null;
  threat_id: string | null;
  action_type: string;
  action_status: string;
  action_payload: any;
  initiated_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  executed_at: string | null;
  result: any;
  error_message: string | null;
  requires_approval: boolean;
  created_at: string;
}

export interface XDRNetworkEvent {
  id: string;
  agent_id: string | null;
  event_type: string;
  protocol: string | null;
  source_ip: string | null;
  source_port: number | null;
  destination_ip: string | null;
  destination_port: number | null;
  destination_domain: string | null;
  dns_query: string | null;
  process_name: string | null;
  process_id: number | null;
  bytes_sent: number | null;
  bytes_received: number | null;
  is_blocked: boolean;
  is_suspicious: boolean;
  threat_intel_match: boolean;
  geo_country: string | null;
  geo_city: string | null;
  created_at: string;
}

export interface XDRTimelineEvent {
  id: string;
  agent_id: string | null;
  threat_id: string | null;
  incident_id: string | null;
  event_type: string;
  event_source: string | null;
  event_data: any;
  process_tree: any;
  mitre_mapping: any;
  severity: string | null;
  sequence_number: number | null;
  event_time: string;
  created_at: string;
}

// Hooks
export function useXDRThreats(filters?: { status?: string; severity?: string; agentId?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-threats", user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from("xdr_threats")
        .select(`*, agent:vanguard_agents(name)`)
        .order("created_at", { ascending: false });
      
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.severity) query = query.eq("severity", filters.severity);
      if (filters?.agentId) query = query.eq("agent_id", filters.agentId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as XDRThreat[];
    },
    enabled: !!user,
  });
}

export function useXDRIOCs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-iocs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xdr_iocs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as XDRIOC[];
    },
    enabled: !!user,
  });
}

export function useXDRYaraRules() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-yara-rules", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xdr_yara_rules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as XDRYaraRule[];
    },
    enabled: !!user,
  });
}

export function useXDRThreatFeeds() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-threat-feeds", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xdr_threat_feeds")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as XDRThreatFeed[];
    },
    enabled: !!user,
  });
}

export function useXDRForensics(threatId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-forensics", user?.id, threatId],
    queryFn: async () => {
      let query = supabase
        .from("xdr_forensics")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (threatId) query = query.eq("threat_id", threatId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as XDRForensics[];
    },
    enabled: !!user,
  });
}

export function useXDRRansomwareEvents() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-ransomware-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xdr_ransomware_events")
        .select(`*, agent:vanguard_agents(name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as XDRRansomwareEvent[];
    },
    enabled: !!user,
  });
}

export function useXDRAutomationPolicies() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-automation-policies", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xdr_automation_policies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as XDRAutomationPolicy[];
    },
    enabled: !!user,
  });
}

export function useXDRResponseActions(filters?: { status?: string; threatId?: string }) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-response-actions", user?.id, filters],
    queryFn: async () => {
      let query = supabase
        .from("xdr_response_actions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (filters?.status) query = query.eq("action_status", filters.status);
      if (filters?.threatId) query = query.eq("threat_id", filters.threatId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as XDRResponseAction[];
    },
    enabled: !!user,
  });
}

export function useXDRNetworkEvents(agentId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-network-events", user?.id, agentId],
    queryFn: async () => {
      let query = supabase
        .from("xdr_network_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      
      if (agentId) query = query.eq("agent_id", agentId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as XDRNetworkEvent[];
    },
    enabled: !!user,
  });
}

export function useXDRTimeline(incidentId?: string, threatId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-timeline", user?.id, incidentId, threatId],
    queryFn: async () => {
      let query = supabase
        .from("xdr_timeline_events")
        .select("*")
        .order("event_time", { ascending: true });
      
      if (incidentId) query = query.eq("incident_id", incidentId);
      if (threatId) query = query.eq("threat_id", threatId);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as XDRTimelineEvent[];
    },
    enabled: !!user && (!!incidentId || !!threatId),
  });
}

// Mutations
export function useCreateIOC() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ioc: Partial<XDRIOC>) => {
      const insertData = { ...ioc, user_id: user?.id } as any;
      const { data, error } = await supabase
        .from("xdr_iocs")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-iocs"] });
      toast.success("IOC added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add IOC: ${error.message}`);
    },
  });
}

export function useCreateYaraRule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (rule: Partial<XDRYaraRule>) => {
      const insertData = { ...rule, user_id: user?.id } as any;
      const { data, error } = await supabase
        .from("xdr_yara_rules")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-yara-rules"] });
      toast.success("YARA rule created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create YARA rule: ${error.message}`);
    },
  });
}

export function useUpdateThreatStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ threatId, status, remediationAction }: { threatId: string; status: string; remediationAction?: string }) => {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === "remediated") {
        updates.remediated_at = new Date().toISOString();
        updates.remediation_action = remediationAction;
      }
      
      const { data, error } = await supabase
        .from("xdr_threats")
        .update(updates)
        .eq("id", threatId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-threats"] });
      toast.success("Threat status updated");
    },
  });
}

export function useCreateResponseAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (action: Partial<XDRResponseAction>) => {
      const insertData = { ...action, user_id: user?.id } as any;
      const { data, error } = await supabase
        .from("xdr_response_actions")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-response-actions"] });
      toast.success("Response action queued");
    },
  });
}

export function useApproveResponseAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (actionId: string) => {
      const { data, error } = await supabase
        .from("xdr_response_actions")
        .update({ 
          action_status: "approved",
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq("id", actionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-response-actions"] });
      toast.success("Action approved for execution");
    },
  });
}

export function useCreateAutomationPolicy() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (policy: Partial<XDRAutomationPolicy>) => {
      const insertData = { ...policy, user_id: user?.id } as any;
      const { data, error } = await supabase
        .from("xdr_automation_policies")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-automation-policies"] });
      toast.success("Automation policy created");
    },
  });
}

export function useUpdateAutomationPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<XDRAutomationPolicy> }) => {
      const { data, error } = await supabase
        .from("xdr_automation_policies")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["xdr-automation-policies"] });
      toast.success("Policy updated");
    },
  });
}

export function useXDRStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["xdr-stats", user?.id],
    queryFn: async () => {
      const [threats, ransomware, pendingActions] = await Promise.all([
        supabase.from("xdr_threats").select("severity, status", { count: "exact" }),
        supabase.from("xdr_ransomware_events").select("status", { count: "exact" }),
        supabase.from("xdr_response_actions").select("action_status", { count: "exact" }).eq("action_status", "pending"),
      ]);
      
      const threatData = threats.data || [];
      const critical = threatData.filter(t => t.severity === "critical" && t.status !== "remediated").length;
      const high = threatData.filter(t => t.severity === "high" && t.status !== "remediated").length;
      const active = threatData.filter(t => !["remediated", "false_positive"].includes(t.status)).length;
      
      return {
        totalThreats: threats.count || 0,
        criticalThreats: critical,
        highThreats: high,
        activeThreats: active,
        ransomwareEvents: ransomware.count || 0,
        pendingActions: pendingActions.count || 0,
      };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
