import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface NetworkDevice {
  id: string;
  network_id: string;
  user_id: string;
  device_name: string;
  ip_address: string | unknown;
  mac_address: string;
  device_type: string;
  os_version?: string;
  manufacturer?: string;
  model?: string;
  status: string;
  last_seen_at?: string;
  vulnerability_count: number;
  is_managed: boolean;
  security_patches_needed: number;
  created_at: string;
  updated_at: string;
}

export interface NetworkVulnerability {
  id: string;
  device_id: string;
  network_id: string;
  user_id: string;
  vulnerability_id: string;
  title: string;
  description: string;
  severity: string;
  cvss_score?: number;
  cve_id?: string;
  affected_service?: string;
  port?: number;
  solution?: string;
  status: string;
  discovered_at: string;
  patched_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SafeNetNetwork {
  id: string;
  msp_org_id?: string;
  user_id: string;
  network_name: string;
  network_range: string;
  location?: string;
  network_type: string;
  monitoring_enabled: boolean;
  last_scan_at?: string;
  device_count: number;
  vulnerability_count: number;
  threat_count: number;
  security_score: number;
  created_at: string;
  updated_at: string;
}

export interface NetworkScanResult {
  success: boolean;
  network_range: string;
  devices_discovered: number;
  vulnerabilities_found: number;
  critical_issues: number;
  scan_duration: number;
  recommendations: string[];
  devices: NetworkDevice[];
  vulnerabilities: NetworkVulnerability[];
}

export const useSafeNet = () => {
  const [networks, setNetworks] = useState<SafeNetNetwork[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<NetworkVulnerability[]>([]);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Load networks
  const loadNetworks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safenet_networks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNetworks(data || []);
    } catch (error) {
      console.error('Error loading networks:', error);
      toast({
        title: "Error",
        description: "Failed to load networks",
        variant: "destructive",
      });
    }
  };

  // Load devices for selected network
  const loadDevices = async (networkId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('safenet_devices')
        .select('*')
        .eq('user_id', user.id);

      if (networkId) {
        query = query.eq('network_id', networkId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    }
  };

  // Load vulnerabilities
  const loadVulnerabilities = async (networkId?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('safenet_vulnerabilities')
        .select('*')
        .eq('user_id', user.id);

      if (networkId) {
        query = query.eq('network_id', networkId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setVulnerabilities(data || []);
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
      toast({
        title: "Error",
        description: "Failed to load vulnerabilities",
        variant: "destructive",
      });
    }
  };

  // Load scan history
  const loadScanHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('network_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setScanHistory(data || []);
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  // Create network
  const createNetwork = async (networkData: {
    name: string;
    network_range: string;
    location?: string;
    network_type: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('safenet_networks')
        .insert({
          user_id: user.id,
          network_name: networkData.name,
          network_range: networkData.network_range,
          location: networkData.location,
          network_type: networkData.network_type,
          monitoring_enabled: true,
          device_count: 0,
          vulnerability_count: 0,
          threat_count: 0,
          security_score: 0
        })
        .select()
        .single();

      if (error) throw error;

      setNetworks(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Network created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating network:', error);
      toast({
        title: "Error",
        description: "Failed to create network",
        variant: "destructive",
      });
      return null;
    }
  };

  // Scan network
  const scanNetwork = async (networkRange: string): Promise<NetworkScanResult | null> => {
    if (!user) return null;

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ultrium-safenet-scanner', {
        body: {
          action: 'scan_network',
          network_range: networkRange,
          user_id: user.id
        }
      });

      if (error) throw error;

      const result: NetworkScanResult = {
        success: true,
        network_range: networkRange,
        devices_discovered: data.devices_discovered || 0,
        vulnerabilities_found: data.vulnerabilities_found || 0,
        critical_issues: data.critical_issues || 0,
        scan_duration: data.scan_duration || 0,
        recommendations: data.recommendations || [],
        devices: data.devices || [],
        vulnerabilities: data.vulnerabilities || []
      };

      // Save scan results to database
      await supabase
        .from('network_scans')
        .insert({
          user_id: user.id,
          connector_id: 'web-interface',
          target_ip: networkRange,
          scan_type: 'discovery',
          scan_status: 'completed',
          scan_result: data,
          vulnerabilities_found: data.vulnerabilities_found || 0,
          devices_found: data.devices_discovered || 0,
          network_ranges: [networkRange],
          scan_duration: 0,
          hostname: 'web-interface',
          results: data
        });

      toast({
        title: "Network Scan Complete",
        description: `Found ${data.devices_discovered} devices, ${data.vulnerabilities_found} vulnerabilities`,
        variant: data.critical_issues > 0 ? "destructive" : "default"
      });

      // Reload data
      await Promise.all([
        loadNetworks(),
        loadDevices(),
        loadVulnerabilities(),
        loadScanHistory()
      ]);

      return result;
    } catch (error) {
      console.error('Network scan error:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete network scan. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  // Vulnerability assessment
  const runVulnerabilityAssessment = async (deviceIds: string[]) => {
    if (!user || deviceIds.length === 0) return null;

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ultrium-safenet-scanner', {
        body: {
          action: 'vulnerability_scan',
          device_ids: deviceIds,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Vulnerability Assessment Complete",
        description: `Assessed ${deviceIds.length} devices`,
      });

      // Reload vulnerabilities
      await loadVulnerabilities();

      return data;
    } catch (error) {
      console.error('Vulnerability assessment error:', error);
      toast({
        title: "Assessment Failed",
        description: "Unable to complete vulnerability assessment.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsScanning(false);
    }
  };

  // Real-time monitoring toggle
  const toggleMonitoring = async (networkId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('safenet_networks')
        .update({ monitoring_enabled: enabled })
        .eq('id', networkId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNetworks(prev => prev.map(network => 
        network.id === networkId 
          ? { ...network, monitoring_enabled: enabled }
          : network
      ));

      toast({
        title: enabled ? "Monitoring Enabled" : "Monitoring Disabled",
        description: `Real-time monitoring ${enabled ? 'started' : 'stopped'} for network`,
      });
    } catch (error) {
      console.error('Error toggling monitoring:', error);
      toast({
        title: "Error",
        description: "Failed to update monitoring settings",
        variant: "destructive",
      });
    }
  };

  // Initialize
  useEffect(() => {
    if (user) {
      Promise.all([
        loadNetworks(),
        loadDevices(),
        loadVulnerabilities(),
        loadScanHistory()
      ]).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Load devices and vulnerabilities when network is selected
  useEffect(() => {
    if (selectedNetwork) {
      loadDevices(selectedNetwork);
      loadVulnerabilities(selectedNetwork);
    }
  }, [selectedNetwork]);

  return {
    networks,
    devices,
    vulnerabilities,
    scanHistory,
    isLoading,
    isScanning,
    selectedNetwork,
    setSelectedNetwork,
    createNetwork,
    scanNetwork,
    runVulnerabilityAssessment,
    toggleMonitoring,
    loadNetworks,
    loadDevices,
    loadVulnerabilities,
    loadScanHistory
  };
};