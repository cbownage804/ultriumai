import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Scan,
  Settings,
  Activity,
  Clock,
  Zap
} from "lucide-react";

interface DefenderEndpoint {
  id: string;
  hostname: string;
  os_version: string;
  defender_version: string;
  status: 'protected' | 'at_risk' | 'updating' | 'offline';
  last_scan: string;
  threat_count: number;
  real_time_protection: boolean;
  tamper_protection: boolean;
  network_protection: boolean;
  controlled_folder_access: boolean;
  exclusions_count: number;
  last_seen: string;
}

interface DefenderThreat {
  id: string;
  threat_name: string;
  severity: 'low' | 'medium' | 'high' | 'severe';
  status: 'detected' | 'quarantined' | 'removed' | 'allowed';
  detected_at: string;
  file_path?: string;
  process_name?: string;
  endpoint_hostname: string;
}

export const WindowsDefenderAgent = () => {
  const [endpoints, setEndpoints] = useState<DefenderEndpoint[]>([]);
  const [threats, setThreats] = useState<DefenderThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDefenderData();
    
    // Set up real-time updates
    const channel = supabase
      .channel('defender-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'windows_defender_endpoints' },
        () => loadDefenderData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'windows_defender_threats' },
        () => loadDefenderData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDefenderData = async () => {
    try {
      setLoading(true);
      
      // For now, use mock data since we need to set up the database tables first
      const mockEndpoints: DefenderEndpoint[] = [
        {
          id: '1',
          hostname: 'WKS-001',
          os_version: 'Windows 11 Pro',
          defender_version: '4.18.24010.12',
          status: 'protected',
          last_scan: '2024-01-15T10:30:00Z',
          threat_count: 2,
          real_time_protection: true,
          tamper_protection: true,
          network_protection: true,
          controlled_folder_access: false,
          exclusions_count: 3,
          last_seen: '2024-01-15T11:45:00Z'
        },
        {
          id: '2',
          hostname: 'SRV-DC01',
          os_version: 'Windows Server 2022',
          defender_version: '4.18.24010.12',
          status: 'at_risk',
          last_scan: '2024-01-14T08:15:00Z',
          threat_count: 0,
          real_time_protection: false,
          tamper_protection: true,
          network_protection: true,
          controlled_folder_access: true,
          exclusions_count: 8,
          last_seen: '2024-01-15T11:40:00Z'
        }
      ];

      const mockThreats: DefenderThreat[] = [
        {
          id: '1',
          threat_name: 'Trojan:Win32/Wacatac.B!ml',
          severity: 'severe',
          status: 'quarantined',
          detected_at: '2024-01-15T09:15:00Z',
          file_path: 'C:\\Users\\User\\Downloads\\suspicious.exe',
          process_name: 'suspicious.exe',
          endpoint_hostname: 'WKS-001'
        },
        {
          id: '2',
          threat_name: 'PUA:Win32/Presenoker',
          severity: 'medium',
          status: 'removed',
          detected_at: '2024-01-15T08:30:00Z',
          file_path: 'C:\\Temp\\adware.dll',
          endpoint_hostname: 'WKS-001'
        }
      ];

      setEndpoints(mockEndpoints);
      setThreats(mockThreats);
    } catch (error) {
      console.error('Error loading Defender data:', error);
      toast({
        title: "Error",
        description: "Failed to load Windows Defender data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async (endpointId: string, scanType: 'quick' | 'full') => {
    try {
      // This would integrate with Windows Defender API
      toast({
        title: "Scan Initiated",
        description: `${scanType} scan started on endpoint`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate scan",
        variant: "destructive"
      });
    }
  };

  const updateDefenderSettings = async (endpointId: string, settings: any) => {
    try {
      // This would update Defender settings via API
      toast({
        title: "Settings Updated",
        description: "Windows Defender settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: DefenderEndpoint['status']) => {
    switch (status) {
      case 'protected': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'at_risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'updating': return <Activity className="h-5 w-5 text-blue-500" />;
      case 'offline': return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: DefenderThreat['severity']) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'; 
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading Windows Defender data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Windows Defender for SafeShield</h2>
            <p className="text-muted-foreground">Centralized management and monitoring</p>
          </div>
        </div>
        <Button onClick={() => loadDefenderData()}>
          <Zap className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Protected Endpoints</p>
                <p className="text-2xl font-bold">{endpoints.filter(e => e.status === 'protected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold">{endpoints.filter(e => e.status === 'at_risk').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Threats</p>
                <p className="text-2xl font-bold">{threats.filter(t => t.status === 'detected').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved Threats</p>
                <p className="text-2xl font-bold">{threats.filter(t => ['quarantined', 'removed'].includes(t.status)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints List */}
        <Card>
          <CardHeader>
            <CardTitle>Managed Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div key={endpoint.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(endpoint.status)}
                      <div>
                        <h4 className="font-medium">{endpoint.hostname}</h4>
                        <p className="text-sm text-muted-foreground">{endpoint.os_version}</p>
                      </div>
                    </div>
                    <Badge variant={endpoint.status === 'protected' ? 'default' : 'destructive'}>
                      {endpoint.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Defender Version:</span>
                      <p className="font-mono">{endpoint.defender_version}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Scan:</span>
                      <p>{new Date(endpoint.last_scan).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${endpoint.real_time_protection ? 'bg-green-500' : 'bg-red-500'}`} />
                      Real-time Protection
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${endpoint.tamper_protection ? 'bg-green-500' : 'bg-red-500'}`} />
                      Tamper Protection
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${endpoint.network_protection ? 'bg-green-500' : 'bg-red-500'}`} />
                      Network Protection
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${endpoint.controlled_folder_access ? 'bg-green-500' : 'bg-red-500'}`} />
                      Controlled Folder Access
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => triggerScan(endpoint.id, 'quick')}
                    >
                      <Scan className="h-4 w-4 mr-1" />
                      Quick Scan
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => triggerScan(endpoint.id, 'full')}
                    >
                      <Scan className="h-4 w-4 mr-1" />
                      Full Scan
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedEndpoint(endpoint.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Threats */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threats.map((threat) => (
                <div key={threat.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{threat.threat_name}</h4>
                      <p className="text-sm text-muted-foreground">{threat.endpoint_hostname}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(threat.detected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {threat.file_path && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">File Path:</span>
                      <p className="font-mono text-xs bg-muted p-2 rounded mt-1">{threat.file_path}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Badge variant={threat.status === 'quarantined' || threat.status === 'removed' ? 'default' : 'destructive'}>
                      {threat.status}
                    </Badge>
                    {threat.process_name && (
                      <span className="text-sm text-muted-foreground">Process: {threat.process_name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Deploy Windows Defender Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <Shield className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h4 className="font-medium mb-2">PowerShell Module</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Install the SafeShield Defender integration module
              </p>
              <Button className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Module
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <Settings className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h4 className="font-medium mb-2">Group Policy Template</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Deploy via Active Directory Group Policy
              </p>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download ADMX
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <Activity className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h4 className="font-medium mb-2">SIEM Integration</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Forward events to SafeShield SIEM
              </p>
              <Button className="w-full" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};