import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Activity, 
  Eye, 
  FileCheck, 
  Cpu, 
  Network, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface MonitoringConfig {
  fileIntegrity: boolean;
  processMonitoring: boolean;
  networkAnomalies: boolean;
  logAnalysis: boolean;
  configDrift: boolean;
}

interface SecurityBaseline {
  id: string;
  name: string;
  createdAt: string;
  metrics: {
    openPorts: number;
    runningServices: number;
    installedPackages: number;
    configFiles: number;
  };
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export function ContinuousMonitoring() {
  const { toast } = useToast();
  const { agents } = useVanguardAgents();
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [posture, setPosture] = useState(85);
  const [config, setConfig] = useState<MonitoringConfig>({
    fileIntegrity: true,
    processMonitoring: true,
    networkAnomalies: true,
    logAnalysis: false,
    configDrift: true
  });
  const [baselines, setBaselines] = useState<SecurityBaseline[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([
    { id: '1', type: 'file_change', severity: 'medium', message: '/etc/passwd modified', timestamp: new Date().toISOString(), resolved: false },
    { id: '2', type: 'new_process', severity: 'low', message: 'New process detected: cron job', timestamp: new Date(Date.now() - 3600000).toISOString(), resolved: true },
  ]);
  const [isCreatingBaseline, setIsCreatingBaseline] = useState(false);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const onlineAgent = agents.find(a => a.status === 'online');
      if (onlineAgent) setSelectedAgent(onlineAgent.id);
    }
  }, [agents, selectedAgent]);

  const toggleMonitoring = async () => {
    if (!selectedAgent) {
      toast({ title: "Select an agent", variant: "destructive" });
      return;
    }

    const newState = !isMonitoring;
    setIsMonitoring(newState);

    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: newState ? 'start_monitoring' : 'stop_monitoring',
          payload: {
            file_integrity: config.fileIntegrity,
            process_monitoring: config.processMonitoring,
            network_anomalies: config.networkAnomalies,
            log_analysis: config.logAnalysis,
            config_drift: config.configDrift
          },
          status: 'pending'
        });

      if (error) throw error;

      toast({ 
        title: newState ? "Monitoring Started" : "Monitoring Stopped",
        description: newState ? "Continuous security monitoring is now active" : "Monitoring has been paused"
      });
    } catch (error: any) {
      setIsMonitoring(!newState);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createBaseline = async () => {
    if (!selectedAgent) {
      toast({ title: "Select an agent", variant: "destructive" });
      return;
    }

    setIsCreatingBaseline(true);
    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: 'baseline_create',
          payload: { capture_all: true },
          status: 'pending'
        });

      if (error) throw error;

      // Add mock baseline for now
      setBaselines(prev => [...prev, {
        id: Date.now().toString(),
        name: `Baseline ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        metrics: {
          openPorts: 12,
          runningServices: 45,
          installedPackages: 234,
          configFiles: 89
        }
      }]);

      toast({ title: "Baseline Created", description: "Security baseline snapshot captured" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsCreatingBaseline(false);
    }
  };

  const runPostureCheck = async () => {
    if (!selectedAgent) {
      toast({ title: "Select an agent", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: 'posture_score',
          payload: {},
          status: 'pending'
        });

      if (error) throw error;
      toast({ title: "Posture Check Started", description: "Security posture assessment in progress" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPostureColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const onlineAgents = agents.filter(a => a.status === 'online');
  const unresolvedAlerts = alerts.filter(a => !a.resolved).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Posture</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPostureColor(posture)}`}>{posture}%</div>
            <Progress value={posture} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-2xl font-bold">{isMonitoring ? 'Active' : 'Paused'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Baselines</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{baselines.length}</div>
            <p className="text-xs text-muted-foreground">Captured snapshots</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring">Real-time Monitoring</TabsTrigger>
          <TabsTrigger value="baselines">Security Baselines</TabsTrigger>
          <TabsTrigger value="alerts">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Monitoring Configuration
                </CardTitle>
                <CardDescription>Configure what to monitor continuously</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {onlineAgents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-muted-foreground" />
                      <Label>File Integrity Monitoring</Label>
                    </div>
                    <Switch 
                      checked={config.fileIntegrity} 
                      onCheckedChange={v => setConfig(p => ({ ...p, fileIntegrity: v }))} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <Label>Process Monitoring</Label>
                    </div>
                    <Switch 
                      checked={config.processMonitoring} 
                      onCheckedChange={v => setConfig(p => ({ ...p, processMonitoring: v }))} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      <Label>Network Anomaly Detection</Label>
                    </div>
                    <Switch 
                      checked={config.networkAnomalies} 
                      onCheckedChange={v => setConfig(p => ({ ...p, networkAnomalies: v }))} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <Label>Log Analysis</Label>
                    </div>
                    <Switch 
                      checked={config.logAnalysis} 
                      onCheckedChange={v => setConfig(p => ({ ...p, logAnalysis: v }))} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <Label>Configuration Drift Detection</Label>
                    </div>
                    <Switch 
                      checked={config.configDrift} 
                      onCheckedChange={v => setConfig(p => ({ ...p, configDrift: v }))} 
                    />
                  </div>
                </div>

                <Button onClick={toggleMonitoring} className="w-full" disabled={!selectedAgent}>
                  {isMonitoring ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Stop Monitoring
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Start Monitoring
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Posture
                </CardTitle>
                <CardDescription>Current security health assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className={`text-6xl font-bold ${getPostureColor(posture)}`}>{posture}</div>
                  <p className="text-muted-foreground">Security Score</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Patch Level</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" /> 92%
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Configuration Compliance</span>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Minus className="h-3 w-3" /> 78%
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Vulnerability Exposure</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingDown className="h-3 w-3" /> Low
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Network Hygiene</span>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" /> 88%
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={runPostureCheck} disabled={!selectedAgent}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Run Posture Assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="baselines" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Baselines</CardTitle>
                <CardDescription>Capture system state snapshots for drift detection</CardDescription>
              </div>
              <Button onClick={createBaseline} disabled={isCreatingBaseline || !selectedAgent}>
                {isCreatingBaseline ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="mr-2 h-4 w-4" />
                )}
                Create Baseline
              </Button>
            </CardHeader>
            <CardContent>
              {baselines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No baselines created yet</p>
                  <p className="text-sm">Create a baseline to track configuration drift</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {baselines.map(baseline => (
                    <div key={baseline.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{baseline.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(baseline.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">Compare</Button>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="font-medium">{baseline.metrics.openPorts}</p>
                          <p className="text-xs text-muted-foreground">Open Ports</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="font-medium">{baseline.metrics.runningServices}</p>
                          <p className="text-xs text-muted-foreground">Services</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="font-medium">{baseline.metrics.installedPackages}</p>
                          <p className="text-xs text-muted-foreground">Packages</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="font-medium">{baseline.metrics.configFiles}</p>
                          <p className="text-xs text-muted-foreground">Config Files</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Events detected by continuous monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {alert.resolved ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{alert.message}</p>
                            <Badge variant={getSeverityColor(alert.severity) as any}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
