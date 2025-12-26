import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  ArrowDownUp, 
  Globe, 
  AlertTriangle,
  Play,
  Square,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Clock,
  Shield,
  Eye,
  RefreshCw,
  Wifi
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TrafficFlow {
  id: string;
  srcIp: string;
  dstIp: string;
  protocol: string;
  port: number;
  bytes: number;
  packets: number;
  timestamp: string;
  flag?: 'normal' | 'suspicious' | 'malicious';
}

interface Anomaly {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  srcIp: string;
  timestamp: string;
}

export function TrafficAnalysis() {
  const { toast } = useToast();
  const { agents } = useVanguardAgents();
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureFilter, setCaptureFilter] = useState('');
  const [flows, setFlows] = useState<TrafficFlow[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  
  // Sample traffic data
  const [trafficData] = useState([
    { time: '00:00', inbound: 45, outbound: 32 },
    { time: '04:00', inbound: 23, outbound: 18 },
    { time: '08:00', inbound: 89, outbound: 67 },
    { time: '12:00', inbound: 156, outbound: 123 },
    { time: '16:00', inbound: 134, outbound: 98 },
    { time: '20:00', inbound: 78, outbound: 56 },
  ]);

  const [protocolData] = useState([
    { name: 'HTTPS', value: 45, color: '#3b82f6' },
    { name: 'HTTP', value: 25, color: '#10b981' },
    { name: 'DNS', value: 15, color: '#f59e0b' },
    { name: 'SSH', value: 10, color: '#8b5cf6' },
    { name: 'Other', value: 5, color: '#6b7280' },
  ]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const onlineAgent = agents.find(a => a.status === 'online');
      if (onlineAgent) setSelectedAgent(onlineAgent.id);
    }
  }, [agents, selectedAgent]);

  const startCapture = async () => {
    if (!selectedAgent) {
      toast({ title: "Select an agent", variant: "destructive" });
      return;
    }

    setIsCapturing(true);
    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: 'capture_traffic',
          payload: {
            filter: captureFilter || 'all',
            duration: 60,
            analyze: true
          },
          status: 'pending'
        });

      if (error) throw error;
      toast({ title: "Capture Started", description: "Network traffic capture is now active" });
    } catch (error: any) {
      setIsCapturing(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const stopCapture = async () => {
    if (!selectedAgent) return;

    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: 'stop_capture',
          payload: {},
          status: 'pending'
        });

      if (error) throw error;
      setIsCapturing(false);
      toast({ title: "Capture Stopped" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const analyzeFlows = async () => {
    if (!selectedAgent) return;

    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: 'analyze_flows',
          payload: { detect_anomalies: true, detect_exfiltration: true },
          status: 'pending'
        });

      if (error) throw error;
      toast({ title: "Analysis Started", description: "Analyzing traffic patterns for anomalies" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const detectDNSTunneling = async () => {
    if (!selectedAgent) return;

    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          command_type: 'dns_tunnel_detect',
          payload: {},
          status: 'pending'
        });

      if (error) throw error;
      toast({ title: "DNS Analysis Started", description: "Scanning for DNS tunneling attempts" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const onlineAgents = agents.filter(a => a.status === 'online');
  const totalBytes = flows.reduce((acc, f) => acc + f.bytes, 0);
  const suspiciousFlows = flows.filter(f => f.flag === 'suspicious' || f.flag === 'malicious').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Capture Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isCapturing ? 'bg-red-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-2xl font-bold">{isCapturing ? 'Recording' : 'Idle'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Traffic</CardTitle>
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(totalBytes / 1024 / 1024).toFixed(2)} MB</div>
            <p className="text-xs text-muted-foreground">Captured data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flows Captured</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flows.length}</div>
            <p className="text-xs text-muted-foreground">Network connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Flows</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{suspiciousFlows}</div>
            <p className="text-xs text-muted-foreground">Flagged for review</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="capture" className="space-y-4">
        <TabsList>
          <TabsTrigger value="capture">Traffic Capture</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Network Traffic Capture
              </CardTitle>
              <CardDescription>Capture and analyze network traffic in real-time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
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

                <div className="space-y-2">
                  <Label>Capture Filter</Label>
                  <Input 
                    placeholder="e.g., port 443, host 192.168.1.1"
                    value={captureFilter}
                    onChange={e => setCaptureFilter(e.target.value)}
                  />
                </div>

                <div className="flex items-end gap-2">
                  {isCapturing ? (
                    <Button variant="destructive" onClick={stopCapture} className="flex-1">
                      <Square className="mr-2 h-4 w-4" />
                      Stop Capture
                    </Button>
                  ) : (
                    <Button onClick={startCapture} disabled={!selectedAgent} className="flex-1">
                      <Play className="mr-2 h-4 w-4" />
                      Start Capture
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={analyzeFlows} disabled={!selectedAgent}>
                  <Eye className="mr-2 h-4 w-4" />
                  Analyze Flows
                </Button>
                <Button variant="outline" onClick={detectDNSTunneling} disabled={!selectedAgent}>
                  <Shield className="mr-2 h-4 w-4" />
                  Detect DNS Tunneling
                </Button>
                <Button variant="outline" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  Export PCAP
                </Button>
              </div>

              {/* Live Traffic Table */}
              {flows.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No traffic captured yet</p>
                  <p className="text-sm">Start a capture to see network flows</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {flows.map(flow => (
                      <div key={flow.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                        <div className="flex items-center gap-4">
                          <Badge variant={flow.flag === 'malicious' ? 'destructive' : flow.flag === 'suspicious' ? 'secondary' : 'outline'}>
                            {flow.protocol}
                          </Badge>
                          <span>{flow.srcIp}</span>
                          <ArrowDownUp className="h-3 w-3 text-muted-foreground" />
                          <span>{flow.dstIp}:{flow.port}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{(flow.bytes / 1024).toFixed(1)} KB</span>
                          <span>{flow.packets} pkts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Over Time</CardTitle>
                <CardDescription>Inbound vs Outbound traffic (MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Area type="monotone" dataKey="inbound" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="outbound" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Protocol Distribution</CardTitle>
                <CardDescription>Traffic by protocol type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={protocolData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {protocolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Talkers</CardTitle>
              <CardDescription>Hosts with most network activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { ip: '192.168.1.100', bytes: 1245000000, percent: 35 },
                  { ip: '192.168.1.50', bytes: 890000000, percent: 25 },
                  { ip: '192.168.1.200', bytes: 534000000, percent: 15 },
                  { ip: '192.168.1.75', bytes: 356000000, percent: 10 },
                  { ip: '192.168.1.150', bytes: 178000000, percent: 5 },
                ].map((host, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-32 font-mono text-sm">{host.ip}</div>
                    <div className="flex-1">
                      <Progress value={host.percent} className="h-2" />
                    </div>
                    <div className="w-24 text-right text-sm text-muted-foreground">
                      {(host.bytes / 1024 / 1024 / 1024).toFixed(2)} GB
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Detected Anomalies</CardTitle>
                <CardDescription>Unusual network behavior patterns</CardDescription>
              </div>
              <Button variant="outline" onClick={analyzeFlows} disabled={!selectedAgent}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Analysis
              </Button>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No anomalies detected</p>
                  <p className="text-sm">Run flow analysis to detect unusual patterns</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {anomalies.map(anomaly => (
                      <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 ${anomaly.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
                          <div>
                            <p className="font-medium">{anomaly.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {anomaly.type} from {anomaly.srcIp}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={anomaly.severity === 'critical' || anomaly.severity === 'high' ? 'destructive' : 'secondary'}>
                            {anomaly.severity}
                          </Badge>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(anomaly.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
