/**
 * Recon Unit Detail Page
 * Full security appliance management: Scanner, HAILO AI, Firewall, Traffic Analysis
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVanguardBasePath } from '@/utils/subdomain';
import { useVanguardAgent } from '@/hooks/useVanguardAgents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Cpu,
  Wifi,
  WifiOff,
  AlertTriangle,
  Brain,
  Radar,
  Shield,
  Flame,
  Network,
  Activity,
  Eye,
  Settings,
  RefreshCw,
  Play,
  Pause,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScannerRoleToggle } from '@/components/vanguard/ScannerRoleToggle';
import { DiscoveredDevicesPanel, LiveTrafficPanel, ThreatAlertsPanel, VulnerabilityScanPanel } from '@/components/vanguard/recon';
import { useVanguardScanner } from '@/hooks/useVanguardScanner';
import { toast } from 'sonner';

export default function VanguardPiDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { agent, metrics, isLoading, sendCommand, refetch } = useVanguardAgent(agentId);
  const { discoveredDevices, fetchDiscoveredDevices } = useVanguardScanner();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (agent) {
      document.title = `${agent.name} | Recon Unit`;
    }
  }, [agent]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48 bg-white/10" />
        <Skeleton className="h-64 w-full bg-white/10" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-black/40 border-purple-500/20">
          <CardContent className="p-12 text-center">
            <Cpu className="h-12 w-12 mx-auto mb-4 text-white/40" />
            <h3 className="text-lg font-semibold mb-2 text-white">Recon Unit Not Found</h3>
            <p className="text-white/60 mb-4">
              This unit may have been removed or you don't have access.
            </p>
            <Button onClick={() => navigate(`${basePath}/devices`)} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = agent.status === 'online' ? Wifi : 
                     agent.status === 'offline' ? WifiOff : 
                     AlertTriangle;

  const threatCount = agent.threat_detections?.length || 0;
  const inferenceStats = agent.inference_stats || {};
  const trafficStats = agent.traffic_stats || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`${basePath}/devices`)}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${agent.status === 'online' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <Cpu className={`h-6 w-6 ${agent.status === 'online' ? 'text-green-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{agent.name}</h1>
              <p className="text-white/60">{agent.location || 'No location'} • {agent.ip_address}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${agent.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {agent.status}
          </Badge>
          <Button onClick={refetch} variant="outline" size="sm" className="border-purple-500/30">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-black/40 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Brain className="h-6 w-6 mx-auto mb-2 text-purple-400" />
            <p className="text-xl font-bold text-white">{agent.hailo_board_name || 'HAILO-8'}</p>
            <p className="text-xs text-white/40">AI Accelerator</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-cyan-500/20">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-xl font-bold text-white">{inferenceStats.fps || 0} FPS</p>
            <p className="text-xs text-white/40">Inference Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-red-500/20">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 mx-auto mb-2 text-red-400" />
            <p className="text-xl font-bold text-white">{threatCount}</p>
            <p className="text-xs text-white/40">Threats Detected</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Network className="h-6 w-6 mx-auto mb-2 text-blue-400" />
            <p className="text-xl font-bold text-white">{formatBytes(trafficStats.bytes_in || 0)}</p>
            <p className="text-xs text-white/40">Traffic In</p>
          </CardContent>
        </Card>
        <Card className="bg-black/40 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <Flame className="h-6 w-6 mx-auto mb-2 text-orange-400" />
            <p className="text-xl font-bold text-white">{agent.firewall_rules?.length || 0}</p>
            <p className="text-xs text-white/40">Firewall Rules</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-black/40 border border-purple-500/20 p-1 h-auto flex-wrap">
          <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="hailo" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2">
            <Brain className="h-4 w-4" />
            HAILO AI
          </TabsTrigger>
          <TabsTrigger value="scanner" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2">
            <Radar className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="threats" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2">
            <Shield className="h-4 w-4" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="firewall" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2">
            <Flame className="h-4 w-4" />
            Firewall
          </TabsTrigger>
          <TabsTrigger value="traffic" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white gap-2">
            <Network className="h-4 w-4" />
            Traffic
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Device ID" value={agent.device_id} />
                <InfoRow label="IP Address" value={agent.ip_address || 'N/A'} />
                <InfoRow label="VPN IP" value={agent.vpn_ip || 'Not connected'} />
                <InfoRow label="Firmware" value={agent.firmware_version || 'N/A'} />
                <InfoRow label="Agent Version" value={`v${agent.agent_version || '?'}`} />
                <InfoRow 
                  label="Last Heartbeat" 
                  value={agent.last_heartbeat 
                    ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true })
                    : 'Never'
                  } 
                />
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Resource Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResourceBar label="CPU" value={agent.cpu_usage || 0} color="purple" />
                <ResourceBar label="Memory" value={agent.memory_usage || 0} color="cyan" />
                <ResourceBar label="Disk" value={agent.disk_usage || 0} color="blue" />
                <ResourceBar label="Temperature" value={inferenceStats.temp || 45} max={85} color="orange" unit="°C" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* HAILO AI Tab */}
        <TabsContent value="hailo" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Brain className="h-5 w-5 text-purple-400" />
                  AI Accelerator Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{agent.hailo_board_name || 'HAILO-8'}</p>
                    <p className="text-xs text-white/40">Neural Processing Unit</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                </div>
                <InfoRow label="ML Model Version" value={agent.ml_model_version || 'v1.0.0'} />
                <InfoRow label="Inference FPS" value={`${inferenceStats.fps || 0} frames/sec`} />
                <InfoRow label="Latency" value={`${inferenceStats.latency || 0}ms`} />
                <InfoRow label="Power Draw" value={`${inferenceStats.power || 0}W`} />
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Detection Models</CardTitle>
                <CardDescription className="text-white/60">Active ML models for threat detection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ModelCard name="Network Anomaly Detection" version="v2.1.0" status="active" accuracy={96.4} />
                <ModelCard name="Malware Traffic Analysis" version="v1.8.0" status="active" accuracy={94.2} />
                <ModelCard name="DDoS Pattern Recognition" version="v1.5.0" status="active" accuracy={98.1} />
                <ModelCard name="Intrusion Detection" version="v2.0.0" status="active" accuracy={95.8} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-4">
          <ScannerRoleToggle 
            agentId={agent.id} 
            agentName={agent.name}
            isScanner={agent.is_network_scanner || false}
            subnets={agent.scanner_subnets || []}
            scanInterval={agent.scan_interval_seconds || 3600}
            lastScan={agent.last_scan_at || null}
            onUpdate={refetch}
          />
          
          {/* Discovered Devices */}
          {agent.is_network_scanner && (
            <DiscoveredDevicesPanel agentId={agent.id} />
          )}
          
          {/* Vulnerability Scanning */}
          <VulnerabilityScanPanel agentId={agent.id} discoveredDevices={discoveredDevices} />
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <ThreatAlertsPanel 
            threats={(agent.threat_detections || []).map((t: any, i: number) => ({
              id: `threat-${i}`,
              type: t.type || 'unknown',
              severity: t.severity || 'medium',
              title: t.title || t.type || 'Security Alert',
              description: t.description,
              source_ip: t.source_ip,
              destination_ip: t.destination_ip,
              port: t.port,
              protocol: t.protocol,
              mitre_tactic: t.mitre_tactic,
              mitre_technique: t.mitre_technique,
              detected_at: t.detected_at || new Date().toISOString(),
              status: t.status || 'active',
              confidence: t.confidence
            }))}
            onResolve={(id) => toast.success(`Threat ${id} marked as resolved`)}
            onInvestigate={(id) => toast.info(`Opening investigation for ${id}`)}
          />
        </TabsContent>

        {/* Firewall Tab */}
        <TabsContent value="firewall" className="space-y-4">
          <Card className="bg-black/40 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Flame className="h-5 w-5 text-orange-400" />
                  Firewall Rules
                </CardTitle>
                <CardDescription className="text-white/60">
                  Manage network traffic filtering rules
                </CardDescription>
              </div>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
                onClick={() => toast.info('Firewall rule management for Recon units is coming in a future update.')}
              >
                <Zap className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {(agent.firewall_rules?.length || 0) === 0 ? (
                <div className="text-center py-12 text-white/40">
                  <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No firewall rules configured</p>
                  <p className="text-sm">Add rules to control network traffic</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agent.firewall_rules?.map((rule: any, i: number) => (
                    <FirewallRuleCard key={i} rule={rule} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <LiveTrafficPanel 
            trafficStats={trafficStats} 
            networkRxBytes={metrics?.[0]?.network_rx_bytes}
            networkTxBytes={metrics?.[0]?.network_tx_bytes}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-white/60 text-sm">{label}</span>
      <span className="text-white font-mono text-sm">{value}</span>
    </div>
  );
}

function ResourceBar({ 
  label, 
  value, 
  max = 100, 
  color, 
  unit = '%' 
}: { 
  label: string; 
  value: number; 
  max?: number; 
  color: string; 
  unit?: string;
}) {
  const percentage = (value / max) * 100;
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="text-white font-medium">{value.toFixed(0)}{unit}</span>
      </div>
      <Progress value={percentage} className={`h-2 bg-slate-800 [&>div]:${colorMap[color]}`} />
    </div>
  );
}

function ModelCard({ 
  name, 
  version, 
  status, 
  accuracy 
}: { 
  name: string; 
  version: string; 
  status: string; 
  accuracy: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div>
        <p className="font-medium text-white text-sm">{name}</p>
        <p className="text-xs text-white/40">{version}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-green-400">{accuracy}%</span>
        <Badge className="bg-green-500/20 text-green-400 text-xs">Active</Badge>
      </div>
    </div>
  );
}

function ThreatCard({ threat }: { threat: any }) {
  const severityColors: Record<string, string> = {
    critical: 'border-red-500 bg-red-500/10',
    high: 'border-orange-500 bg-orange-500/10',
    medium: 'border-amber-500 bg-amber-500/10',
    low: 'border-blue-500 bg-blue-500/10',
  };

  return (
    <div className={`p-4 rounded-lg border mb-2 ${severityColors[threat.severity] || severityColors.medium}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white">{threat.type}</span>
        <Badge className={threat.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}>
          {threat.severity}
        </Badge>
      </div>
      <p className="text-sm text-white/60">{threat.description}</p>
      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
        <span>Source: {threat.source_ip}</span>
        <span>•</span>
        <span>{threat.detected_at}</span>
      </div>
    </div>
  );
}

function FirewallRuleCard({ rule }: { rule: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded ${rule.action === 'allow' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {rule.action === 'allow' ? (
            <Play className="h-4 w-4 text-green-400" />
          ) : (
            <Pause className="h-4 w-4 text-red-400" />
          )}
        </div>
        <div>
          <p className="font-medium text-white text-sm">{rule.name}</p>
          <p className="text-xs text-white/40">
            {rule.source} → {rule.destination} : {rule.port}
          </p>
        </div>
      </div>
      <Badge variant="outline" className="text-xs">
        {rule.protocol}
      </Badge>
    </div>
  );
}

function ProtocolBar({ protocol, percentage, color }: { protocol: string; percentage: number; color: string }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    cyan: 'bg-cyan-500',
    purple: 'bg-purple-500',
    slate: 'bg-slate-500',
  };
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white">{protocol}</span>
        <span className="text-white/60">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorMap[color]} transition-all`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
