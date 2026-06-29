import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface MSPPasswordVault {
  id: string;
  client_id: string;
  client_name: string;
  user_id: string;
  vault_name: string;
  total_entries: number;
  weak_passwords: number;
  breached_passwords: number;
  last_accessed: string;
  security_score: number;
}

export interface MSPPasswordEntry {
  id: string;
  client_id: string;
  client_name: string;
  vault_id: string;
  user_id: string;
  entry_type: string;
  title: string;
  category: string;
  url?: string;
  password_strength_score: number;
  is_compromised: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MSPSecurityReport {
  overview: {
    total_clients: number;
    total_entries: number;
    average_security_score: number;
    high_risk_clients: number;
  };
  client_breakdown: Array<{
    client_id: string;
    client_name: string;
    security_score: number;
    total_passwords: number;
    weak_passwords: number;
    breached_passwords: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: string[];
}

export const useVaultMSP = () => {
  const [loading, setLoading] = useState(false);
  const [vaults, setVaults] = useState<MSPPasswordVault[]>([]);
  const [entries, setEntries] = useState<MSPPasswordEntry[]>([]);
  const [report, setReport] = useState<MSPSecurityReport | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Get MSP ID for current user
  const getMSPId = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching MSP ID:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in getMSPId:', error);
      return null;
    }
  };

  // Load MSP client vaults
  const loadMSPVaults = async () => {
    setLoading(true);
    try {
      const mspId = await getMSPId();
      if (!mspId) {
        throw new Error('MSP not found for current user');
      }

      // Get all clients for this MSP
      const { data: clients, error: clientsError } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .eq('msp_id', mspId);

      if (clientsError) throw clientsError;

      const vaultsData: MSPPasswordVault[] = [];

      // For each client, get their Vault vault information
      for (const client of clients || []) {
        const { data: clientVaults, error: vaultsError } = await supabase
          .from('safepass_vaults')
          .select(`
            id,
            vault_name,
            user_id,
            last_accessed_at,
            created_at
          `)
          .eq('client_id', client.id);

        if (vaultsError) {
          console.error(`Error loading vaults for client ${client.id}:`, vaultsError);
          continue;
        }

        for (const vault of clientVaults || []) {
          // Get entry count and security metrics for this vault
          const { data: entriesCount } = await supabase
            .from('safepass_entries')
            .select('id, password_strength_score, is_compromised')
            .eq('vault_id', vault.id);

          const totalEntries = entriesCount?.length || 0;
          const weakPasswords = entriesCount?.filter(e => e.password_strength_score < 60).length || 0;
          const breachedPasswords = entriesCount?.filter(e => e.is_compromised).length || 0;
          
          const securityScore = totalEntries > 0 
            ? Math.round((entriesCount?.reduce((sum, e) => sum + e.password_strength_score, 0) || 0) / totalEntries)
            : 100;

          vaultsData.push({
            id: vault.id,
            client_id: client.id,
            client_name: client.company_name,
            user_id: vault.user_id,
            vault_name: vault.vault_name,
            total_entries: totalEntries,
            weak_passwords: weakPasswords,
            breached_passwords: breachedPasswords,
            last_accessed: vault.last_accessed_at || vault.created_at,
            security_score: securityScore
          });
        }
      }

      setVaults(vaultsData);
    } catch (error) {
      console.error('Error loading MSP vaults:', error);
      toast({
        title: "Error",
        description: "Failed to load client password vaults",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load MSP entries for a specific client
  const loadMSPEntries = async (clientId?: string) => {
    setLoading(true);
    try {
      const mspId = await getMSPId();
      if (!mspId) {
        throw new Error('MSP not found for current user');
      }

      let query = supabase
        .from('safepass_entries')
        .select(`
          id,
          vault_id,
          user_id,
          entry_type,
          title,
          category,
          url,
          password_strength_score,
          is_compromised,
          last_used_at,
          created_at,
          updated_at,
          client_id
        `)
        .eq('msp_id', mspId);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data: entriesData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get client names for the entries
      const clientIds = [...new Set(entriesData?.map(e => e.client_id).filter(Boolean) || [])];
      const { data: clients } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .in('id', clientIds);

      const clientMap = new Map(clients?.map(c => [c.id, c.company_name]) || []);

      const enrichedEntries: MSPPasswordEntry[] = entriesData?.map(entry => ({
        ...entry,
        client_name: clientMap.get(entry.client_id) || 'Unknown Client'
      })) || [];

      setEntries(enrichedEntries);
    } catch (error) {
      console.error('Error loading MSP entries:', error);
      toast({
        title: "Error",
        description: "Failed to load client password entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate MSP security report
  const generateMSPReport = async (): Promise<MSPSecurityReport | null> => {
    setLoading(true);
    try {
      const mspId = await getMSPId();
      if (!mspId) {
        throw new Error('MSP not found for current user');
      }

      const { data, error } = await supabase.functions.invoke('safepass-scanner', {
        body: {
          action: 'generate_security_report',
          userId: user?.id,
          mspId: mspId,
          scope: 'msp_overview'
        }
      });

      if (error) throw error;

      const reportData: MSPSecurityReport = {
        overview: {
          total_clients: data.client_count || 0,
          total_entries: data.total_entries || 0,
          average_security_score: data.average_security_score || 0,
          high_risk_clients: data.high_risk_clients || 0
        },
        client_breakdown: data.client_breakdown || [],
        recommendations: data.recommendations || []
      };

      setReport(reportData);
      return reportData;
    } catch (error) {
      console.error('Error generating MSP report:', error);
      toast({
        title: "Error",
        description: "Failed to generate security report",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Analyze specific client vault
  const analyzeClientVault = async (clientId: string, userId: string) => {
    setLoading(true);
    try {
      const mspId = await getMSPId();
      if (!mspId) {
        throw new Error('MSP not found for current user');
      }

      const { data, error } = await supabase.functions.invoke('safepass-scanner', {
        body: {
          action: 'analyze_vault',
          userId: userId,
          clientId: clientId,
          mspId: mspId
        }
      });

      if (error) throw error;

      toast({
        title: "Vault Analysis Complete",
        description: `Security Score: ${data.summary.securityScore}/100`,
        variant: data.summary.securityScore >= 70 ? "default" : "destructive"
      });

      return data;
    } catch (error) {
      console.error('Error analyzing client vault:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze client vault",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Send password security recommendations to client
  const sendSecurityRecommendations = async (clientId: string, recommendations: string[]) => {
    try {
      // This would integrate with the notification system
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to_client_id: clientId,
          subject: 'Password Security Recommendations',
          template: 'security_recommendations',
          data: {
            recommendations: recommendations,
            generated_by: 'Vault Security Analysis'
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Recommendations Sent",
        description: "Security recommendations have been sent to the client",
      });

      return true;
    } catch (error) {
      console.error('Error sending recommendations:', error);
      toast({
        title: "Failed to Send",
        description: "Unable to send recommendations to client",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initialize MSP data
  useEffect(() => {
    if (user) {
      loadMSPVaults();
    }
  }, [user]);

  return {
    loading,
    vaults,
    entries,
    report,
    loadMSPVaults,
    loadMSPEntries,
    generateMSPReport,
    analyzeClientVault,
    sendSecurityRecommendations,
    refresh: () => {
      loadMSPVaults();
      loadMSPEntries();
    }
  };
};