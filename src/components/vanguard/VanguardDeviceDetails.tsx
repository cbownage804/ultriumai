import { useState, useEffect } from 'react';
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
import { 
  ArrowLeft, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Thermometer,
  Send,
  RefreshCw,
  Terminal,
  MessageSquare,
  Loader2,
  Monitor,
  FileCode,
  Lock,
  Shield,
  Settings,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Import new components
import { AgentConsole } from './device/console/AgentConsole';
import { RemoteAccessPanel } from './device/RemoteAccessPanel';
import { ScriptLibrary } from './device/ScriptLibrary';
import { ConfigurationPolicies } from './device/ConfigurationPolicies';
import { ProfileManager } from './profiles/ProfileManager';

export function VanguardDeviceDetails() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { agent, metrics, commands, isLoading, sendCommand, refetch, updateAgentConfig } = useVanguardAgent(deviceId);
  
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [activeMainTab, setActiveMainTab] = useState('overview');

  // Use AI Copilot directly for instant responses
  const handleAsk = async () => {
    if (!question.trim() || !deviceId) return;
    
    setIsAsking(true);
    const userMessage = question;
    setQuestion('');
    
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
      
      setChatHistory([...newHistory, { role: 'assistant', content: aiResponse }]);
      
      if (data.command) {
        toast.info(`Executing: ${data.command.command_type}`);
        await sendCommand(data.command.command_type, data.command.payload);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to get response');
    } finally {
      setIsAsking(false);
    }
  };

  const handleUpdateRemoteIds = async (ids: {
    rustdeskId?: string;
    splashtopId?: string;
    anydeskId?: string;
    teamviewerId?: string;
  }) => {
    await updateAgentConfig({
      remote_access: {
        rustdesk_id: ids.rustdeskId,
        splashtop_id: ids.splashtopId,
        anydesk_id: ids.anydeskId,
        teamviewer_id: ids.teamviewerId,
      },
    });
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

  const latestMetric = metrics[metrics.length - 1];
  const currentMetrics = {
    cpu: latestMetric?.cpu_percent ?? 0,
    memory: latestMetric?.memory_percent ?? 0,
    disk: latestMetric?.disk_percent ?? 0,
    networkIn: latestMetric?.network_rx_bytes ?? 0,
    networkOut: latestMetric?.network_tx_bytes ?? 0,
  };
  
  const chartData = metrics.map(m => ({
    time: format(new Date(m.recorded_at), 'HH:mm'),
    cpu: m.cpu_percent,
    memory: m.memory_percent,
    disk: m.disk_percent
  }));

  const remoteAccess = agent.config?.remote_access || {};

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
        <MetricCard icon={Cpu} label="CPU Usage" value={currentMetrics.cpu} unit="%" />
        <MetricCard icon={MemoryStick} label="Memory Usage" value={currentMetrics.memory} unit="%" />
        <MetricCard icon={HardDrive} label="Disk Usage" value={currentMetrics.disk} unit="%" />
        <MetricCard icon={Thermometer} label="Temperature" value={latestMetric?.temperature ?? 0} unit="°C" />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="gap-1">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="console" className="gap-1">
            <Terminal className="h-4 w-4" />
            Console
          </TabsTrigger>
          <TabsTrigger value="scripts" className="gap-1">
            <FileCode className="h-4 w-4" />
            Scripts
          </TabsTrigger>
          <TabsTrigger value="remote" className="gap-1">
            <Monitor className="h-4 w-4" />
            Remote
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-1">
            <Lock className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="profiles" className="gap-1">
            <Settings className="h-4 w-4" />
            Profiles
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Chart */}
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

            {/* AI Chat Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Vanguard AI Copilot
                </CardTitle>
                <CardDescription>
                  Chat with AI about this device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                
                <div className="flex flex-wrap gap-2">
                  {['What is the status?', 'Scan the network', 'Check for vulnerabilities'].map(prompt => (
                    <Button key={prompt} variant="outline" size="sm" className="text-xs" onClick={() => setQuestion(prompt)}>
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

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
        </TabsContent>

        {/* Console Tab - Live Agent Management */}
        <TabsContent value="console" className="mt-6">
          <AgentConsole 
            agentId={agent.id} 
            deviceName={agent.name}
            sendCommand={sendCommand}
            currentMetrics={currentMetrics}
          />
        </TabsContent>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="mt-6">
          <ScriptLibrary agentId={agent.id} sendCommand={sendCommand} />
        </TabsContent>

        {/* Remote Access Tab */}
        <TabsContent value="remote" className="mt-6">
          <RemoteAccessPanel
            agentId={agent.id}
            deviceName={agent.name}
            rustdeskId={remoteAccess.rustdesk_id}
            splashtopId={remoteAccess.splashtop_id}
            anydeskId={remoteAccess.anydesk_id}
            teamviewerId={remoteAccess.teamviewer_id}
            onUpdateIds={handleUpdateRemoteIds}
          />
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="mt-6">
          <ConfigurationPolicies agentId={agent.id} sendCommand={sendCommand} />
        </TabsContent>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="mt-6">
          <ProfileManager />
        </TabsContent>
      </Tabs>
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
