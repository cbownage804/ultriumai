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
  Settings,
  Crosshair,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function VanguardDeviceDetails() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { agent, metrics, commands, isLoading, sendCommand, refetch } = useVanguardAgent(deviceId);
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isPentesting, setIsPentesting] = useState(false);

  // Use AI Copilot directly for instant responses
  const handleAsk = async () => {
    if (!question.trim() || !deviceId) return;
    
    setIsAsking(true);
    const userMessage = question;
    setQuestion('');
    
    // Add user message to history
    const newHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newHistory);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-ai-copilot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: newHistory,
            agentId: deviceId,
            stream: false,
          }),
        }
      );

      if (!response.ok) throw new Error('AI request failed');
      
      const data = await response.json();
      const aiResponse = data.response || 'No response';
      
      // Add AI response to history
      setChatHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      setAnswer(aiResponse);
      
      // If AI returned a command, execute it
      if (data.command) {
        toast.info(`Executing: ${data.command.command_type}`);
        await sendCommand(data.command.command_type, data.command.payload);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response');
      setAnswer('Error: ' + (err.message || 'Failed to connect to AI'));
    } finally {
      setIsAsking(false);
    }
  };

  const [commandsInProgress, setCommandsInProgress] = useState<Set<string>>(new Set());

  const handleCommand = async (commandType: string, payload?: Record<string, any>) => {
    setCommandsInProgress(prev => new Set(prev).add(commandType));
    try {
      await sendCommand(commandType, payload);
      toast.success(`Command "${commandType}" queued successfully`, {
        description: "The agent will execute it on the next poll cycle (~30s)"
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send command');
    } finally {
      setTimeout(() => {
        setCommandsInProgress(prev => {
          const next = new Set(prev);
          next.delete(commandType);
          return next;
        });
      }, 2000);
    }
  };

  const handleFullPentest = async () => {
    setIsPentesting(true);
    toast.info("Starting Full Pentest", { description: "Queuing network scan, vulnerability scan, and security checks..." });
    
    try {
      // Queue all pentest commands
      await Promise.all([
        sendCommand('scan_network'),
        sendCommand('scan_vulnerabilities'),
        sendCommand('get_inventory'),
        sendCommand('check_security_updates'),
        sendCommand('get_firewall_rules'),
      ]);
      
      toast.success("Full Pentest Started", {
        description: "All security scans queued. Results will appear in command history as they complete."
      });
      
      // Keep pentesting state for a reasonable time (commands take ~30s to poll + execution time)
      setTimeout(() => setIsPentesting(false), 60000);
    } catch (err: any) {
      toast.error("Failed to start pentest", { description: err.message });
      setIsPentesting(false);
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
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleFullPentest} 
          disabled={isPentesting}
          className="bg-destructive hover:bg-destructive/90"
        >
          {isPentesting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Pentesting...
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4 mr-2" />
              Start Pentest
            </>
          )}
        </Button>
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

        {/* Ask Vanguard AI Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Vanguard AI Copilot
            </CardTitle>
            <CardDescription>
              Chat with AI about this device - get instant answers and issue commands
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat History */}
            {chatHistory.length > 0 && (
              <ScrollArea className="h-[200px] border rounded-lg p-3">
                <div className="space-y-3">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            
            {/* Input */}
            <div className="flex gap-2">
              <Input 
                placeholder="Ask about status, run scans, get security insights..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
                disabled={isAsking}
              />
              <Button onClick={handleAsk} disabled={isAsking || !question.trim()}>
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2">
              {['What is the status?', 'Scan the network', 'Check for vulnerabilities', 'Show recent activity'].map(prompt => (
                <Button
                  key={prompt}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    setQuestion(prompt);
                  }}
                >
                  {prompt}
                </Button>
              ))}
            </div>
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
          <RMMTabs agent={agent} handleCommand={handleCommand} commandsInProgress={commandsInProgress} />
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
          <ScrollArea className="h-[300px]">
            {commands.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No commands sent yet</p>
            ) : (
              <div className="space-y-3">
                {commands.map(cmd => (
                  <div key={cmd.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">{cmd.command_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(cmd.created_at), { addSuffix: true })}
                        </span>
                        <Badge variant={
                          cmd.status === 'completed' ? 'default' : 
                          cmd.status === 'failed' ? 'destructive' : 
                          'secondary'
                        }>
                          {cmd.status}
                        </Badge>
                      </div>
                    </div>
                    {cmd.payload && Object.keys(cmd.payload).length > 0 && (
                      <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                        Payload: {JSON.stringify(cmd.payload)}
                      </div>
                    )}
                    {cmd.response && (
                      <div className="text-xs bg-green-500/10 border border-green-500/20 p-2 rounded font-mono">
                        <span className="text-green-600 font-semibold">Output:</span>
                        <pre className="whitespace-pre-wrap mt-1 text-foreground">
                          {typeof cmd.response === 'string' ? cmd.response : JSON.stringify(cmd.response, null, 2)}
                        </pre>
                      </div>
                    )}
                    {cmd.error_message && (
                      <div className="text-xs bg-destructive/10 border border-destructive/20 p-2 rounded">
                        <span className="text-destructive font-semibold">Error:</span> {cmd.error_message}
                      </div>
                    )}
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
function RMMTabs({ 
  agent, 
  handleCommand, 
  commandsInProgress 
}: { 
  agent: any; 
  handleCommand: (cmd: string, payload?: any) => void;
  commandsInProgress: Set<string>;
}) {
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

  const ActionButton = ({ cmd, icon: Icon, label }: { cmd: string; icon: any; label: string }) => {
    const isLoading = commandsInProgress.has(cmd);
    return (
      <Button 
        variant="outline" 
        className="h-20 flex-col gap-2" 
        onClick={() => handleCommand(cmd)}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
        <span className="text-xs">{label}</span>
      </Button>
    );
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
          <ActionButton cmd="scan_network" icon={Wifi} label="Network Scan" />
          <ActionButton cmd="scan_vulnerabilities" icon={Shield} label="Vuln Scan" />
          <ActionButton cmd="get_inventory" icon={Package} label="Get Inventory" />
          <ActionButton cmd="update_agent" icon={Download} label="Update Agent" />
          <ActionButton cmd="check_patches" icon={RefreshCw} label="Check Patches" />
          <ActionButton cmd="clear_cache" icon={HardDrive} label="Clear Cache" />
          <ActionButton cmd="sync_time" icon={Settings} label="Sync Time" />
          <ActionButton cmd="health_check" icon={Monitor} label="Health Check" />
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
