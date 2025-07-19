import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Wifi, HardDrive, Cpu, Activity, Shield, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemInfo {
  hostname: string;
  os: string;
  browser: string;
  screen: string;
  memory: string;
  connection: string;
  cpu: string;
  userAgent: string;
}

interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkLatency: number;
  uptime: number;
}

interface SecurityStatus {
  antivirusEnabled: boolean;
  firewallEnabled: boolean;
  lastScanDate: Date;
  vulnerabilities: number;
}

export const Agent = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [agentToken, setAgentToken] = useState('');
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [agentVersion] = useState('2.1.0');
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  const { toast } = useToast();

  // Load saved configuration
  useEffect(() => {
    const savedToken = localStorage.getItem('rmm_agent_token') || '';
    const savedHostname = localStorage.getItem('rmm_hostname') || window.location.hostname;
    const savedIpAddress = localStorage.getItem('rmm_ip_address') || '';
    
    setAgentToken(savedToken);
    setHostname(savedHostname);
    setIpAddress(savedIpAddress);
  }, []);

  // Collect comprehensive system information
  useEffect(() => {
    const collectSystemInfo = async (): Promise<SystemInfo> => {
      const nav = navigator as any;
      const screen = window.screen;
      
      // Get memory info if available
      let memoryInfo = 'Unknown';
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryInfo = `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used of ${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`;
      }

      // Get connection info
      let connectionInfo = 'Unknown';
      if ('connection' in navigator) {
        const conn = (navigator as any).connection;
        connectionInfo = `${conn.effectiveType} (${conn.downlink}Mbps)`;
      }

      // Get CPU info
      let cpuInfo = `${navigator.hardwareConcurrency || 'Unknown'} cores`;

      return {
        hostname: hostname || window.location.hostname,
        os: nav.platform || nav.userAgentData?.platform || 'Unknown',
        browser: `${nav.userAgent.split(' ').slice(-2).join(' ')}`,
        screen: `${screen.width}x${screen.height} (${screen.colorDepth}bit)`,
        memory: memoryInfo,
        connection: connectionInfo,
        cpu: cpuInfo,
        userAgent: navigator.userAgent
      };
    };

    const collectPerformanceMetrics = (): PerformanceMetrics => {
      const memory = (performance as any).memory;
      return {
        cpuUsage: Math.round(Math.random() * 30 + 10), // Simulated CPU usage
        memoryUsage: memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : 0,
        networkLatency: Math.round(Math.random() * 50 + 10), // Simulated latency
        uptime: Math.round(performance.now() / 1000) // Browser uptime in seconds
      };
    };

    const collectSecurityStatus = (): SecurityStatus => {
      // Simulated security status - in production this would check actual security tools
      return {
        antivirusEnabled: true,
        firewallEnabled: true,
        lastScanDate: new Date(),
        vulnerabilities: Math.floor(Math.random() * 3) // Random vulnerabilities for demo
      };
    };

    collectSystemInfo().then(setSystemInfo);
    setPerformanceMetrics(collectPerformanceMetrics());
    setSecurityStatus(collectSecurityStatus());
  }, [hostname]);

  // Perform agent check-in with RMM server
  const performCheckin = async () => {
    if (!agentToken || !ipAddress) {
      toast({
        title: "Configuration Required",
        description: "Please configure agent token and IP address",
        variant: "destructive"
      });
      return;
    }

    try {
      const checkinData = {
        agent_token: agentToken,
        hostname: hostname || window.location.hostname,
        ip_address: ipAddress,
        agent_version: agentVersion,
        system_info: systemInfo,
        performance_metrics: performanceMetrics,
        security_status: securityStatus,
        installed_software: [
          { name: "Chrome Browser", version: "Latest", vendor: "Google" },
          { name: "RMM Agent", version: agentVersion, vendor: "Ultrium" }
        ]
      };

      const { data, error } = await supabase.functions.invoke('rmm-agent-checkin', {
        body: checkinData
      });

      if (error) {
        throw error;
      }

      setIsConnected(true);
      setLastCheckin(new Date());
      
      toast({
        title: "Check-in Successful",
        description: `Device registered successfully. Next check-in in ${data.next_checkin || 300} seconds`,
      });

      // Save configuration
      localStorage.setItem('rmm_agent_token', agentToken);
      localStorage.setItem('rmm_hostname', hostname);
      localStorage.setItem('rmm_ip_address', ipAddress);

    } catch (error: any) {
      console.error('Check-in failed:', error);
      setIsConnected(false);
      toast({
        title: "Check-in Failed",
        description: error.message || "Failed to check in with RMM server",
        variant: "destructive"
      });
    }
  };

  // Auto check-in every 5 minutes
  useEffect(() => {
    if (!agentToken || !isConnected) return;

    const interval = setInterval(() => {
      performCheckin();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [agentToken, isConnected, systemInfo, performanceMetrics, securityStatus]);

  // Test connection to RMM server
  const testConnection = async () => {
    try {
      const response = await fetch('https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/rmm-agent-checkin', {
        method: 'OPTIONS'
      });
      
      if (response.ok) {
        toast({
          title: "Connection Test Successful",
          description: "RMM server is reachable",
        });
      } else {
        throw new Error('Server not reachable');
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: "Cannot reach RMM server",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Ultrium RMM Agent v{agentVersion}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Status: <Badge variant={isConnected ? "default" : "destructive"} className="ml-1">
                    {isConnected ? "Online" : "Offline"}
                  </Badge>
                </p>
                {lastCheckin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last check-in: {lastCheckin.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={testConnection}>
                  Test Connection
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Agent Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="agentToken">Agent Token</Label>
                <Input
                  id="agentToken"
                  type="password"
                  value={agentToken}
                  onChange={(e) => setAgentToken(e.target.value)}
                  placeholder="sk-safenet-xxxx"
                />
              </div>
              <div>
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="Device hostname"
                />
              </div>
              <div>
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="192.168.1.100"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={performCheckin}>
                Perform Check-in
              </Button>
              <Button variant="outline" onClick={() => {
                localStorage.removeItem('rmm_agent_token');
                localStorage.removeItem('rmm_hostname');
                localStorage.removeItem('rmm_ip_address');
                setAgentToken('');
                setHostname('');
                setIpAddress('');
                setIsConnected(false);
                toast({ title: "Configuration cleared" });
              }}>
                Clear Config
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        {systemInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Platform</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.os}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Screen</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.screen}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Memory</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.memory}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Connection</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.connection}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">CPU</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.cpu}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Hostname</p>
                    <p className="text-sm text-muted-foreground">{systemInfo.hostname}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Metrics */}
        {performanceMetrics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{performanceMetrics.cpuUsage}%</p>
                  <p className="text-sm text-muted-foreground">CPU Usage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{performanceMetrics.memoryUsage}%</p>
                  <p className="text-sm text-muted-foreground">Memory Usage</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{performanceMetrics.networkLatency}ms</p>
                  <p className="text-sm text-muted-foreground">Network Latency</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{Math.floor(performanceMetrics.uptime / 60)}m</p>
                  <p className="text-sm text-muted-foreground">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Status */}
        {securityStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant={securityStatus.antivirusEnabled ? "default" : "destructive"}>
                    {securityStatus.antivirusEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <span className="text-sm">Antivirus</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={securityStatus.firewallEnabled ? "default" : "destructive"}>
                    {securityStatus.firewallEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <span className="text-sm">Firewall</span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Last Scan</p>
                  <p className="text-sm">{securityStatus.lastScanDate.toLocaleDateString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{securityStatus.vulnerabilities}</p>
                  <p className="text-sm text-muted-foreground">Vulnerabilities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              1. Configure your agent token and network details above
            </p>
            <p className="text-sm text-muted-foreground">
              2. Click "Perform Check-in" to register this device with SafeNet RMM
            </p>
            <p className="text-sm text-muted-foreground">
              3. The agent will automatically check in every 5 minutes when online
            </p>
            <p className="text-sm text-muted-foreground">
              4. Keep this page open for continuous monitoring and management
            </p>
            <p className="text-sm text-muted-foreground">
              5. Use "Test Connection" to verify server connectivity
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};