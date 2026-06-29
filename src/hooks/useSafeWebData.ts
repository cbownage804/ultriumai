import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface WatchAsset {
  id: string;
  asset_type: 'email' | 'domain' | 'brand' | 'executive' | 'ip_range';
  asset_value: string;
  status: 'active' | 'paused' | 'archived';
  scan_frequency: 'hourly' | 'daily' | 'weekly';
  last_scan_at: string | null;
  next_scan_at: string;
  threats_found: number;
  metadata: any;
  created_at: string;
  updated_at: string;
  msp_client_id?: string;
  safeweb_threats?: WatchThreat[];
}

export interface WatchThreat {
  id: string;
  threat_type: 'credential' | 'data_breach' | 'threat_actor' | 'marketplace' | 'brand_mention' | 'executive_mention';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence_score: number;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  source_name: string;
  source_url?: string;
  raw_data: any;
  affected_assets: string[];
  threat_indicators: any;
  first_seen: string;
  last_seen: string;
  resolved_at?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  asset_id?: string;
  msp_client_id?: string;
}

export interface MSPClient {
  id: string;
  company_name: string;
  domain?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  subscription_plan: 'basic' | 'professional' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  monthly_price: number;
  max_assets: number;
  trial_ends_at: string;
  settings: any;
  branding: any;
  created_at: string;
  updated_at: string;
  threat_stats?: {
    total_threats: number;
    critical_threats: number;
    high_threats: number;
    medium_threats: number;
    low_threats: number;
  };
}

export const useWatchData = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<WatchAsset[]>([]);
  const [threats, setThreats] = useState<WatchThreat[]>([]);
  const [mspClients, setMspClients] = useState<MSPClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user assets
  const fetchAssets = async (clientId?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('safeweb-assets', {
        method: 'GET'
      });

      if (error) throw error;
      setAssets(data.assets || []);
    } catch (err) {
      setError('Failed to fetch assets');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch threats
  const fetchThreats = async (clientId?: string) => {
    try {
      let query = supabase
        .from('safeweb_threats')
        .select('*')
        .eq('user_id', user?.id);

      if (clientId) {
        query = query.eq('msp_client_id', clientId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setThreats((data || []) as WatchThreat[]);
    } catch (err) {
      setError('Failed to fetch threats');
      console.error('Error fetching threats:', err);
    }
  };

  // Fetch MSP clients
  const fetchMspClients = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-msp-clients', {
        method: 'GET'
      });

      if (error) throw error;
      setMspClients(data.clients || []);
    } catch (err) {
      setError('Failed to fetch MSP clients');
      console.error('Error fetching MSP clients:', err);
    }
  };

  // Add new asset
  const addAsset = async (assetData: {
    asset_type: string;
    asset_value: string;
    scan_frequency?: string;
    msp_client_id?: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-assets', {
        body: assetData,
        method: 'POST'
      });

      if (error) throw error;
      
      // Refresh assets list
      await fetchAssets();
      return { success: true, asset: data.asset };
    } catch (err) {
      console.error('Error adding asset:', err);
      return { success: false, error: err.message };
    }
  };

  // Update asset (status / scan_frequency / metadata)
  // Sent via POST + action=update so functions.invoke transport stays consistent
  // with how delete is handled and so the id rides in the body (PUT + query string
  // is unreliable through supabase.functions.invoke).
  const updateAsset = async (assetId: string, updates: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-assets', {
        method: 'POST',
        body: { action: 'update', id: assetId, updates }
      });

      if (error) throw error;

      // Refresh assets list
      await fetchAssets();
      return { success: true, asset: data?.asset };
    } catch (err) {
      console.error('Error updating asset:', err);
      return { success: false, error: err.message };
    }
  };

  // Delete asset - using POST with action to avoid DELETE request issues
  const deleteAsset = async (assetId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-assets', {
        method: 'POST',
        body: { action: 'delete', id: assetId }
      });

      if (error) throw error;
      
      // Refresh assets list
      await fetchAssets();
      return { success: true };
    } catch (err) {
      console.error('Error deleting asset:', err);
      return { success: false, error: err.message };
    }
  };

  // Trigger manual scan
  const triggerScan = async (assetId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-scanner', {
        body: { asset_id: assetId, scan_type: 'manual' }
      });

      if (error) throw error;
      
      // Refresh data
      await Promise.all([fetchAssets(), fetchThreats()]);
      return { success: true, data };
    } catch (err) {
      console.error('Error triggering scan:', err);
      return { success: false, error: err.message };
    }
  };

  // Update threat status
  const updateThreatStatus = async (threatId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user?.id;
      }

      const { data, error } = await supabase
        .from('safeweb_threats')
        .update(updates)
        .eq('id', threatId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh threats list
      await fetchThreats();
      return { success: true, threat: data };
    } catch (err) {
      console.error('Error updating threat:', err);
      return { success: false, error: err.message };
    }
  };

  // Add MSP client
  const addMspClient = async (clientData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-msp-clients', {
        body: clientData,
        method: 'POST'
      });

      if (error) throw error;
      
      // Refresh clients list
      await fetchMspClients();
      return { success: true, client: data.client };
    } catch (err) {
      console.error('Error adding MSP client:', err);
      return { success: false, error: err.message };
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchAssets(),
        fetchThreats(),
        fetchMspClients()
      ]);
    }
  }, [user]);

  return {
    // Data
    assets,
    threats,
    mspClients,
    loading,
    error,
    
    // Actions
    fetchAssets,
    fetchThreats,
    fetchMspClients,
    addAsset,
    updateAsset,
    deleteAsset,
    triggerScan,
    updateThreatStatus,
    addMspClient,
    
    // Computed values
    totalThreats: threats.length,
    criticalThreats: threats.filter(t => t.severity === 'critical').length,
    newThreats: threats.filter(t => t.status === 'new').length,
    activeAssets: assets.filter(a => a.status === 'active').length,
  };
};