/**
 * Hook for managing Vanguard Network Scanner agents
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScannerAgent {
  id: string;
  device_id: string;
  name: string;
  ip_address: string | null;
  status: string;
  is_network_scanner: boolean;
  scanner_subnets: string[];
  scan_interval_seconds: number;
  last_scan_at: string | null;
  last_heartbeat: string | null;
}

interface DiscoveredDevice {
  id: string;
  ip_address: string;
  mac_address: string | null;
  hostname: string | null;
  device_type: string;
  manufacturer: string | null;
  os_info: string | null;
  open_ports: number[];
  services: Record<string, any>;
  vulnerabilities: any[];
  risk_level: string;
  first_seen_at: string;
  last_seen_at: string;
  is_managed: boolean;
  scanner_agent_id: string | null;
}

const API_URL = 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api';

export function useVanguardScanner() {
  const [scanners, setScanners] = useState<ScannerAgent[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchScanners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}?action=list_scanners`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scanners');
      }

      const data = await response.json();
      setScanners(data.scanners || []);
      return data.scanners;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching scanners:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDiscoveredDevices = useCallback(async (scannerId?: string, riskLevel?: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}?action=list_discovered_devices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          scanner_id: scannerId,
          risk_level: riskLevel,
          limit: 200
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discovered devices');
      }

      const data = await response.json();
      setDiscoveredDevices(data.devices || []);
      return data.devices;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching discovered devices:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const setScannerRole = useCallback(async (
    agentId: string, 
    isScanner: boolean, 
    subnets?: string[], 
    scanInterval?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}?action=set_scanner_role`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: agentId,
          is_scanner: isScanner,
          subnets,
          scan_interval: scanInterval
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update scanner role');
      }

      const data = await response.json();
      
      toast.success(isScanner ? 'Agent designated as network scanner' : 'Scanner role removed');
      
      // Refresh scanners list
      await fetchScanners();
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to update scanner role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchScanners]);

  const triggerScan = useCallback(async (agentId: string, subnet?: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}?action=send_command`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agent_id: agentId,
          command_type: 'network_scan',
          payload: { subnet, scan_type: 'discovery' }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trigger scan');
      }

      toast.success('Network scan triggered');
      return await response.json();
    } catch (err: any) {
      toast.error(err.message || 'Failed to trigger scan');
      throw err;
    }
  }, []);

  return {
    scanners,
    discoveredDevices,
    loading,
    error,
    fetchScanners,
    fetchDiscoveredDevices,
    setScannerRole,
    triggerScan
  };
}
