import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVanguardAgent } from '@/hooks/useVanguardAgents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Thermometer,
  Send,
  RefreshCw,
  Play,
  Terminal,
  MessageSquare,
  Loader2,
  Download,
  Upload,
  Power,
  Shield,
  Package,
  FileCode,
  Monitor,
  Wifi,
  Settings
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

export function VanguardDeviceDetails() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { agent, metrics, commands, isLoading, askVanguard, sendCommand, refetch } = useVanguardAgent(deviceId);
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    
    setIsAsking(true);
    try {
      const response = await askVanguard(question);
      setAnswer(response);
    } catch (err: any) {
      toast.error(err.message || 'Failed to ask Vanguard');
    } finally {
      setIsAsking(false);
    }
  };

  const handleCommand = async (commandType: string, payload?: Record<string, any>) => {
    try {
      await sendCommand(commandType, payload);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send command');
    }
  };

  if (isLoading || !agent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Get latest metrics
  const latestMetric = metrics[metrics.length - 1];
  
  // Prepare chart data
  const chartData = metrics.map(m => ({
    time: format(new Date(m.recorded_at), 'HH:mm'),
    cpu: m.cpu_percent,
    memory: m.memory_percent,
    disk: m.disk_percent
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vanguard/devices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">
            {agent.location || 'No location'} • {agent.ip_address || 'No IP'}
          </p>
        </div>
        <Badge variant={agent.status === 'online' ? 'default' : agent.status === 'critical' ? 'destructive' : 'secondary'}>
          {agent.status}
        </Badge>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Current Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard 
          icon={Cpu} 
          label="CPU Usage" 
          value={latestMetric?.cpu_percent ?? 0}
          unit="%"
        />
        <MetricCard 
          icon={MemoryStick} 
          label="Memory Usage" 
          value={latestMetric?.memory_percent ?? 0}
          unit="%"
        />
        <MetricCard 
          icon={HardDrive} 
          label="Disk Usage" 
          value={latestMetric?.disk_percent ?? 0}
          unit="%"
        />
        <MetricCard 
          icon={Thermometer} 
          label="Temperature" 
          value={latestMetric?.temperature ?? 0}
          unit="°C"
        />
      </div>

      {/* Charts & Ask Panel */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" name="CPU %" dot={false} />
                  <Line type="monotone" dataKey="memory" stroke="hsl(var(--destructive))" name="Memory %" dot={false} />
                  <Line type="monotone" dataKey="disk" stroke="hsl(var(--chart-3))" name="Disk %" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No metrics data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ask Vanguard Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Ask Vanguard
            </CardTitle>
            <CardDescription>
              Query the on-device AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                disabled={isAsking}
              />
              <Button onClick={handleAsk} disabled={isAsking || !question.trim()}>
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {answer && (
              <div className="p-4 bg-muted rounded-lg text-sm">
                <p className="font-medium mb-1">Response:</p>
                <p className="text-muted-foreground">{answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RMM Tabs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Remote Management</CardTitle>
          <CardDescription>Monitor, manage, and execute commands on this device</CardDescription>
        </CardHeader>
        <CardContent>
          <RMMTabs agent={agent} handleCommand={handleCommand} />
        </CardContent>
      </Card>

      {/* Device Info */}
      <Card>
        <CardHeader>
          <CardTitle>Device Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Device ID</dt>
              <dd className="font-mono text-xs">{agent.device_id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Agent Version</dt>
              <dd>{agent.agent_version || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Firmware</dt>
              <dd>{agent.firmware_version || 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hailo Board</dt>
              <dd>{agent.hailo_board_name || 'Not detected'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">VPN IP</dt>
              <dd>{agent.vpn_ip || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Local IP</dt>
              <dd>{agent.ip_address || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd>{agent.location || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Heartbeat</dt>
              <dd>{agent.last_heartbeat ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true }) : 'Never'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle>Command History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            {commands.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No commands sent yet</p>
            ) : (
              <div className="space-y-2">
                {commands.map(cmd => (
                  <div key={cmd.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{cmd.command_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(cmd.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={
                      cmd.status === 'completed' ? 'default' : 
                      cmd.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }>
                      {cmd.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  unit 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  unit: string;
}) {
  const getColor = () => {
    if (value >= 90) return 'text-destructive';
    if (value >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${getColor()}`}>
              {value.toFixed(1)}{unit}
            </p>
          </div>
        </div>
        <Progress value={value} className="mt-3 h-2" />
      </CardContent>
    </Card>
  );
}

// RMM Tabs Component
function RMMTabs({ agent, handleCommand }: { agent: any; handleCommand: (cmd: string, payload?: any) => void }) {
  const [script, setScript] = useState('');
  const [scriptOutput, setScriptOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runScript = async () => {
    if (!script.trim()) return;
    setIsRunning(true);
    setScriptOutput('Executing script...');
    try {
      await handleCommand('run_script', { script, shell: 'bash' });
      setScriptOutput('Script queued for execution. Check command history for results.');
    } catch (err) {
      setScriptOutput('Failed to queue script');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Tabs defaultValue="actions" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        <TabsTrigger value="scripts">Scripts</TabsTrigger>
        <TabsTrigger value="software">Software</TabsTrigger>
        <TabsTrigger value="network">Network</TabsTrigger>
        <TabsTrigger value="power">Power</TabsTrigger>
      </TabsList>

      <TabsContent value="actions" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('scan_network')}>
            <Wifi className="h-5 w-5" />
            <span className="text-xs">Network Scan</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('scan_vulnerabilities')}>
            <Shield className="h-5 w-5" />
            <span className="text-xs">Vuln Scan</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('get_inventory')}>
            <Package className="h-5 w-5" />
            <span className="text-xs">Get Inventory</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('update_agent')}>
            <Download className="h-5 w-5" />
            <span className="text-xs">Update Agent</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('check_patches')}>
            <RefreshCw className="h-5 w-5" />
            <span className="text-xs">Check Patches</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('clear_cache')}>
            <HardDrive className="h-5 w-5" />
            <span className="text-xs">Clear Cache</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('sync_time')}>
            <Settings className="h-5 w-5" />
            <span className="text-xs">Sync Time</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => handleCommand('health_check')}>
            <Monitor className="h-5 w-5" />
            <span className="text-xs">Health Check</span>
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="scripts" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Execute Script</h4>
            <Badge variant="outline">Bash</Badge>
          </div>
          <Textarea
            placeholder="#!/bin/bash&#10;# Enter your script here...&#10;echo 'Hello from Vanguard'"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="font-mono text-sm h-32"
          />
          <div className="flex gap-2">
            <Button onClick={runScript} disabled={isRunning || !script.trim()}>
              {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Run Script
            </Button>
            <Button variant="outline" onClick={() => setScript('')}>Clear</Button>
          </div>
          {scriptOutput && (
            <div className="p-3 bg-muted rounded-lg font-mono text-xs">
              <pre className="whitespace-pre-wrap">{scriptOutput}</pre>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Quick Scripts</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleCommand('run_script', { script: 'df -h', shell: 'bash' })}>
              <FileCode className="h-4 w-4 mr-2" />
              Disk Usage
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleCommand('run_script', { script: 'top -bn1 | head -20', shell: 'bash' })}>
              <FileCode className="h-4 w-4 mr-2" />
              Top Processes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleCommand('run_script', { script: 'netstat -tuln', shell: 'bash' })}>
              <FileCode className="h-4 w-4 mr-2" />
              Open Ports
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleCommand('run_script', { script: 'uptime', shell: 'bash' })}>
              <FileCode className="h-4 w-4 mr-2" />
              Uptime
            </Button>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="software" className="space-y-4 mt-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Software Management</h4>
          <Button variant="outline" size="sm" onClick={() => handleCommand('get_software_list')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh List
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('apt_update')}>
            <Download className="h-4 w-4 mr-2" />
            Update Package Lists
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('apt_upgrade')}>
            <Upload className="h-4 w-4 mr-2" />
            Upgrade All Packages
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('apt_autoremove')}>
            <Package className="h-4 w-4 mr-2" />
            Remove Unused
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('check_security_updates')}>
            <Shield className="h-4 w-4 mr-2" />
            Security Updates
          </Button>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
          Software inventory will appear here after running "Get Inventory"
        </div>
      </TabsContent>

      <TabsContent value="network" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('scan_network')}>
            <Wifi className="h-4 w-4 mr-2" />
            Scan Local Network
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('get_interfaces')}>
            <Monitor className="h-4 w-4 mr-2" />
            Network Interfaces
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('get_routing_table')}>
            <Settings className="h-4 w-4 mr-2" />
            Routing Table
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('get_dns_config')}>
            <FileCode className="h-4 w-4 mr-2" />
            DNS Configuration
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('get_firewall_rules')}>
            <Shield className="h-4 w-4 mr-2" />
            Firewall Rules
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('get_connections')}>
            <Wifi className="h-4 w-4 mr-2" />
            Active Connections
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="power" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('reboot')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reboot Device
          </Button>
          <Button variant="outline" className="justify-start text-destructive" onClick={() => handleCommand('shutdown')}>
            <Power className="h-4 w-4 mr-2" />
            Shutdown
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('restart_agent')}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restart Agent
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => handleCommand('restart_services')}>
            <Settings className="h-4 w-4 mr-2" />
            Restart Services
          </Button>
        </div>
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive font-medium">Warning</p>
          <p className="text-xs text-muted-foreground mt-1">
            Power commands will affect device availability. Use with caution.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
