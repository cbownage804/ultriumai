import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useComplianceManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const createConnector = async (connectorType: string, connectorName: string, configuration: any) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('compliance-manager', {
        body: { action: 'create_connector', connectorType, connectorName, configuration }
      });
      
      if (error) throw error;
      await fetchDashboardData(); // Refresh data
      return { success: true, connector: data.connector };
    } catch (error) {
      console.error('Error creating connector:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const syncConnector = async (connectorId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('compliance-manager', {
        body: { action: 'sync_connector', connectorId }
      });
      
      if (error) throw error;
      await fetchDashboardData(); // Refresh data
      return { success: true, result: data.result };
    } catch (error) {
      console.error('Error syncing connector:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const collectEvidence = async (framework: string, controlId: string, evidenceType: string, data: any) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('compliance-evidence-collector', {
        body: { action: 'collect_evidence', framework, controlId, evidenceType, data }
      });
      
      if (error) throw error;
      return { success: true, evidenceId: result.evidenceId };
    } catch (error) {
      console.error('Error collecting evidence:', error);
      return { success: false, error: error.message };
    }
  };

  const generateComplianceReport = async (framework: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('compliance-manager', {
        body: { action: 'get_compliance_report', framework }
      });
      
      if (error) throw error;
      return { success: true, report: data };
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('compliance-manager', {
        body: { action: 'get_dashboard_data' }
      });
      
      if (error) throw error;
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return {
    loading,
    dashboardData,
    createConnector,
    syncConnector,
    collectEvidence,
    generateComplianceReport,
    fetchDashboardData
  };
};