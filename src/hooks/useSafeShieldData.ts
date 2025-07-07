import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSafeShieldData = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const initializeSampleData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Check if user already has data
      const { data: existingEndpoints } = await supabase
        .from('safe_shield_endpoints')
        .select('id')
        .eq('user_id', user.user.id)
        .limit(1);

      if (existingEndpoints && existingEndpoints.length > 0) {
        setInitialized(true);
        return;
      }

      // Create sample endpoints
      const sampleEndpoints = [
        {
          user_id: user.user.id,
          hostname: 'WORKSTATION-001',
          ip_address: '192.168.1.100',
          os_version: 'Windows 11 Pro',
          agent_version: '3.2.1',
          status: 'online',
          last_seen: new Date().toISOString(),
          metadata: { department: 'IT', location: 'Main Office' }
        },
        {
          user_id: user.user.id,
          hostname: 'LAPTOP-SALES-02',
          ip_address: '192.168.1.101',
          os_version: 'Windows 10 Pro',
          agent_version: '3.2.1',
          status: 'online',
          last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          metadata: { department: 'Sales', location: 'Remote' }
        },
        {
          user_id: user.user.id,
          hostname: 'SERVER-DC-01',
          ip_address: '192.168.1.10',
          os_version: 'Windows Server 2022',
          agent_version: '3.2.1',
          status: 'online',
          last_seen: new Date().toISOString(),
          metadata: { department: 'IT', location: 'Data Center' }
        }
      ];

      const { data: endpoints, error: endpointsError } = await supabase
        .from('safe_shield_endpoints')
        .insert(sampleEndpoints)
        .select();

      if (endpointsError) throw endpointsError;

      // Create sample AV definitions
      const { error: definitionsError } = await supabase
        .from('safe_av_definitions')
        .insert({
          user_id: user.user.id,
          definition_version: '2024.12.07.001',
          update_date: new Date().toISOString(),
          total_signatures: 8765432,
          engine_version: '3.2.1',
          update_status: 'current',
          next_update_check: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (definitionsError) throw definitionsError;

      // Create sample AV scans
      const sampleScans = [
        {
          user_id: user.user.id,
          endpoint_id: endpoints[0].id,
          scan_type: 'full',
          status: 'completed',
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          files_scanned: 245678,
          threats_found: 3,
          threats_quarantined: 3,
          scan_duration_seconds: 1800,
          scan_path: 'C:\\',
          scan_results: { 
            performance: 'good',
            threats: [
              { name: 'Trojan.Win32.Agent', path: 'C:\\temp\\malware.exe', action: 'quarantined' },
              { name: 'Adware.Generic', path: 'C:\\Users\\Public\\Downloads\\installer.exe', action: 'quarantined' },
              { name: 'PUP.Optional.BundleInstaller', path: 'C:\\Windows\\Temp\\setup.tmp', action: 'quarantined' }
            ]
          }
        },
        {
          user_id: user.user.id,
          endpoint_id: endpoints[1].id,
          scan_type: 'quick',
          status: 'completed',
          started_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 6 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
          files_scanned: 12456,
          threats_found: 1,
          threats_quarantined: 1,
          scan_duration_seconds: 300,
          scan_path: 'C:\\Windows\\System32',
          scan_results: { 
            performance: 'excellent',
            threats: [
              { name: 'Suspicious.Generic.7z', path: 'C:\\Windows\\System32\\drivers\\temp.tmp', action: 'quarantined' }
            ]
          }
        }
      ];

      const { error: scansError } = await supabase
        .from('safe_av_scans')
        .insert(sampleScans);

      if (scansError) throw scansError;

      // Create sample MDR alerts
      const sampleAlerts = [
        {
          user_id: user.user.id,
          msp_client_id: null,
          alert_type: 'Suspicious Process Execution',
          severity: 'high',
          title: 'Suspicious PowerShell Activity Detected',
          description: 'Unusual PowerShell execution with obfuscated commands detected on WORKSTATION-001',
          source_system: 'SafeShield EDR',
          affected_assets: ['WORKSTATION-001'],
          tactics: { mitre: ['T1059'] },
          techniques: { mitre: ['Command and Scripting Interpreter'] },
          indicators: [
            { type: 'file_hash', value: 'sha256:abc123def456', confidence: 90 },
            { type: 'process_name', value: 'powershell.exe', confidence: 95 }
          ],
          status: 'investigating',
          escalation_level: 1,
          response_actions: [
            { action: 'isolated_endpoint', timestamp: new Date().toISOString(), analyst: 'System' },
            { action: 'collected_memory_dump', timestamp: new Date().toISOString(), analyst: 'Auto' }
          ],
          timeline: [
            { event: 'Alert Created', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
            { event: 'Investigation Started', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() }
          ]
        },
        {
          user_id: user.user.id,
          msp_client_id: null,
          alert_type: 'Malware Detection',
          severity: 'critical',
          title: 'Trojan.Win32.Agent Detected',
          description: 'Critical malware detected and quarantined on LAPTOP-SALES-02',
          source_system: 'SafeShield EDR',
          affected_assets: ['LAPTOP-SALES-02'],
          tactics: { mitre: ['T1055'] },
          techniques: { mitre: ['Process Injection'] },
          indicators: [
            { type: 'file_path', value: 'C:\\temp\\malware.exe', confidence: 95 },
            { type: 'file_hash', value: 'sha256:def789ghi012', confidence: 98 }
          ],
          status: 'resolved',
          escalation_level: 2,
          response_actions: [
            { action: 'quarantined_file', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), analyst: 'Auto' },
            { action: 'full_system_scan', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), analyst: 'System' }
          ],
          timeline: [
            { event: 'Malware Detected', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
            { event: 'File Quarantined', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString() },
            { event: 'Investigation Completed', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
          ],
          resolved_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ];

      const { error: alertsError } = await supabase
        .from('safe_mdr_alerts')
        .insert(sampleAlerts);

      if (alertsError) throw alertsError;

      setInitialized(true);
      
      toast({
        title: "SafeShield Initialized",
        description: "Sample data has been created for your SafeShield products",
      });

    } catch (error) {
      console.error('Error initializing SafeShield data:', error);
      toast({
        title: "Initialization Error",
        description: "Failed to initialize SafeShield sample data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeSampleData();
  }, []);

  return {
    initialized,
    loading,
    reinitialize: initializeSampleData
  };
};