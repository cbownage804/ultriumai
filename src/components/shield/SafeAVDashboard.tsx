import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Scan, 
  Activity, 
  AlertTriangle,
  Zap,
  Eye,
  Lock,
  RefreshCw,
  Play,
  Pause,
  FileSearch,
  Clock,
  HardDrive
} from "lucide-react";

interface AVScan {
  id: string;
  scan_type: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  files_scanned: number;
  threats_found: number;
  threats_quarantined: number;
  scan_duration_seconds?: number | null;
  scan_path?: string | null;
}

interface AVDefinition {
  id: string;
  definition_version: string;
  update_date: string;
  total_signatures: number;
  engine_version: string;
  update_status: string;
  next_update_check: string;
}

interface DashboardStats {
  total_scans: number;
  active_scans: number;
  threats_found_24h: number;
  threats_quarantined: number;
  endpoints_protected: number;
  definition_version: string;
  last_update: string;
}

export const SafeAVDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_scans: 0,
    active_scans: 0,
    threats_found_24h: 0,
    threats_quarantined: 0,
    endpoints_protected: 0,
    definition_version: '1.0.0',
    last_update: new Date().toISOString()
  });
  const [scans, setScans] = useState<AVScan[]>([]);
  const [definitions, setDefinitions] = useState<AVDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'scans' | 'definitions' | 'quarantine'>('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Load scans
      const { data: scansData } = await supabase
        .from('safe_av_scans')
        .select('*')
        .eq('user_id', user.user.id)
        .order('started_at', { ascending: false })
        .limit(10);

      // Load definitions
      const { data: definitionsData } = await supabase
        .from('safe_av_definitions')
        .select('*')
        .eq('user_id', user.user.id)
        .order('update_date', { ascending: false })
        .limit(5);

      // Load endpoints count
      const { data: endpointsData } = await supabase
        .from('safe_shield_endpoints')
        .select('id')
        .eq('user_id', user.user.id);

      setScans(scansData || []);
      setDefinitions(definitionsData || []);
      
      // Calculate stats
      const activeScanCount = scansData?.filter(scan => scan.status === 'running').length || 0;
      const threats24h = scansData?.reduce((sum, scan) => {
        const scanDate = new Date(scan.started_at);
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return scanDate > yesterday ? sum + scan.threats_found : sum;
      }, 0) || 0;
      
      setStats({
        total_scans: scansData?.length || 0,
        active_scans: activeScanCount,
        threats_found_24h: threats24h,
        threats_quarantined: scansData?.reduce((sum, scan) => sum + scan.threats_quarantined, 0) || 0,
        endpoints_protected: endpointsData?.length || 0,
        definition_version: definitionsData?.[0]?.definition_version || '1.0.0',
        last_update: definitionsData?.[0]?.update_date || new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading SafeAV data:', error);
      toast({
        title: "Error",
        description: "Failed to load SafeAV data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startScan = async (scanType: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('safe_av_scans')
        .insert({
          user_id: user.user.id,
          scan_type: scanType as 'quick' | 'full' | 'custom' | 'real_time',
          status: 'running',
          files_scanned: 0,
          threats_found: 0,
          threats_quarantined: 0,
          scan_path: scanType === 'quick' ? 'C:\\Windows\\System32' : 'C:\\'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Scan Started",
        description: `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} scan initiated`,
      });

      // Simulate scan progress
      simulateScanProgress(data.id);
      await loadDashboardData();
    } catch (error) {
      console.error('Error starting scan:', error);
      toast({
        title: "Error",
        description: "Failed to start scan",
        variant: "destructive",
      });
    }
  };

  const simulateScanProgress = async (scanId: string) => {
    // Simulate scan progress with random results
    const randomFiles = Math.floor(Math.random() * 50000) + 10000;
    const randomThreats = Math.floor(Math.random() * 5);
    const randomDuration = Math.floor(Math.random() * 300) + 60; // 1-5 minutes

    setTimeout(async () => {
      await supabase
        .from('safe_av_scans')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          files_scanned: randomFiles,
          threats_found: randomThreats,
          threats_quarantined: randomThreats,
          scan_duration_seconds: randomDuration
        })
        .eq('id', scanId);

      toast({
        title: "Scan Completed",
        description: `Found ${randomThreats} threats in ${randomFiles.toLocaleString()} files`,
        variant: randomThreats > 0 ? "destructive" : "default",
      });

      await loadDashboardData();
    }, randomDuration * 1000);
  };

  const updateDefinitions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const newVersion = `${Date.now()}`;
      const { error } = await supabase
        .from('safe_av_definitions')
        .insert({
          user_id: user.user.id,
          definition_version: newVersion,
          update_date: new Date().toISOString(),
          total_signatures: Math.floor(Math.random() * 1000000) + 5000000,
          engine_version: '2.1.0',
          update_status: 'current',
          next_update_check: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Definitions Updated",
        description: "Antivirus definitions have been updated successfully",
      });

      await loadDashboardData();
    } catch (error) {
      console.error('Error updating definitions:', error);
      toast({
        title: "Error",
        description: "Failed to update definitions",
        variant: "destructive",
      });
    }
  };

  const getScanStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'quick': return <Zap className="h-4 w-4" />;
      case 'full': return <HardDrive className="h-4 w-4" />;
      case 'custom': return <FileSearch className="h-4 w-4" />;
      case 'real_time': return <Activity className="h-4 w-4" />;
      default: return <Scan className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            SafeAV Antivirus
          </h1>
          <p className="text-muted-foreground">
            Advanced Threat Protection & Malware Detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => startScan('quick')} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Quick Scan
          </Button>
          <Button onClick={() => startScan('full')} variant="secondary">
            <HardDrive className="h-4 w-4 mr-2" />
            Full Scan
          </Button>
          <Button onClick={updateDefinitions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Definitions
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <Button 
          variant={activeView === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveView('overview')}
        >
          <Activity className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button 
          variant={activeView === 'scans' ? 'default' : 'outline'}
          onClick={() => setActiveView('scans')}
        >
          <Scan className="h-4 w-4 mr-2" />
          Scans ({stats.total_scans})
        </Button>
        <Button 
          variant={activeView === 'definitions' ? 'default' : 'outline'}
          onClick={() => setActiveView('definitions')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Definitions
        </Button>
        <Button 
          variant={activeView === 'quarantine' ? 'default' : 'outline'}
          onClick={() => setActiveView('quarantine')}
        >
          <Lock className="h-4 w-4 mr-2" />
          Quarantine ({stats.threats_quarantined})
        </Button>
      </div>

      {/* Critical Alerts */}
      {stats.active_scans > 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            🔄 <strong>{stats.active_scans} active scans</strong> are currently running.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Dashboard */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protected Endpoints</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.endpoints_protected}</div>
                <p className="text-xs text-muted-foreground">Active protection</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.active_scans}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threats (24h)</CardTitle>
                <ShieldAlert className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.threats_found_24h}</div>
                <p className="text-xs text-muted-foreground">Recent detections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quarantined</CardTitle>
                <Lock className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.threats_quarantined}</div>
                <p className="text-xs text-muted-foreground">Threats isolated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Definition Version</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">{stats.definition_version}</div>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(stats.last_update).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scan className="h-5 w-5" />
                  Recent Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scans.slice(0, 5).map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getScanTypeIcon(scan.scan_type)}
                        <div>
                          <p className="font-medium capitalize">{scan.scan_type} Scan</p>
                          <p className="text-sm text-muted-foreground">
                            {scan.files_scanned.toLocaleString()} files scanned
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={scan.threats_found > 0 ? 'destructive' : 'default'}>
                          {scan.threats_found} threats
                        </Badge>
                        <div className={`text-sm ${getScanStatusColor(scan.status)}`}>
                          {scan.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {scans.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No scans performed yet. Start your first scan above.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Protection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Real-time Protection</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Definition Updates</span>
                      <span className="text-green-600">Current</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Web Protection</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Email Protection</span>
                      <span className="text-green-600">Enabled</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Detailed Scans View */}
      {activeView === 'scans' && (
        <Card>
          <CardHeader>
            <CardTitle>Scan History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getScanTypeIcon(scan.scan_type)}
                    <div>
                      <p className="font-medium capitalize">{scan.scan_type} Scan</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(scan.started_at).toLocaleString()}
                      </p>
                      {scan.scan_path && (
                        <p className="text-xs text-muted-foreground">Path: {scan.scan_path}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`font-medium ${getScanStatusColor(scan.status)}`}>
                      {scan.status.toUpperCase()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {scan.files_scanned.toLocaleString()} files
                    </div>
                    <Badge variant={scan.threats_found > 0 ? 'destructive' : 'default'}>
                      {scan.threats_found} threats
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};