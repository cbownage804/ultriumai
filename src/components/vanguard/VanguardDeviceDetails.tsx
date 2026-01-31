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
  Zap,
  Wifi,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getVanguardBasePath } from '@/utils/subdomain';
import { cn } from '@/lib/utils';

// Import new components
import { AgentConsole } from './device/console/AgentConsole';
import { RemoteAccessPanel } from './device/RemoteAccessPanel';
import { ScriptLibrary } from './device/ScriptLibrary';
import { ConfigurationPolicies } from './device/ConfigurationPolicies';
import { ProfileManager } from './profiles/ProfileManager';

export function VanguardDeviceDetails() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
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
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-slate-900/50 border-cyan-500/20">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2 bg-slate-800" />
                <Skeleton className="h-4 w-24 bg-slate-800" />
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
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(`${basePath}/devices`)}
          className="hover:bg-cyan-500/20 hover:text-cyan-400"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">{agent.name}</h1>
            <Badge className={cn(
              "gap-1",
              agent.status === 'online' 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : agent.status === 'critical' 
                ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                agent.status === 'online' ? "bg-green-400 animate-pulse" : 
                agent.status === 'critical' ? "bg-red-400" : "bg-yellow-400"
              )} />
              {agent.status}
            </Badge>
            {agent.hailo_board_name && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 gap-1">
                <Zap className="h-3 w-3" />
                Hailo AI
              </Badge>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5" />
            {agent.location || 'No location'} • {agent.ip_address || 'No IP'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch}
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Current Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Cpu} label="CPU Usage" value={currentMetrics.cpu} unit="%" color="cyan" />
        <MetricCard icon={MemoryStick} label="Memory Usage" value={currentMetrics.memory} unit="%" color="purple" />
        <MetricCard icon={HardDrive} label="Disk Usage" value={currentMetrics.disk} unit="%" color="blue" />
        <MetricCard icon={Thermometer} label="Temperature" value={latestMetric?.temperature ?? 0} unit="°C" color="orange" />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList className="grid w-full grid-cols-6 bg-slate-900/50 border border-cyan-500/20 p-1">
          <TabsTrigger 
            value="overview" 
            className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="console" 
            className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Terminal className="h-4 w-4" />
            Console
          </TabsTrigger>
          <TabsTrigger 
            value="scripts" 
            className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <FileCode className="h-4 w-4" />
            Scripts
          </TabsTrigger>
          <TabsTrigger 
            value="remote" 
            className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Monitor className="h-4 w-4" />
            Remote
          </TabsTrigger>
          <TabsTrigger 
            value="policies" 
            className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Lock className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger 
            value="profiles" 
            className="gap-1.5 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
          >
            <Settings className="h-4 w-4" />
            Profiles
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Performance Chart */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-slate-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Performance (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid rgba(6,182,212,0.3)',
                          borderRadius: '8px',
                          color: '#e2e8f0'
                        }} 
                      />
                      <Legend />
                      <Area type="monotone" dataKey="cpu" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                      <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#colorMemory)" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="#3b82f6" name="Disk %" dot={false} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                      <p>No metrics data available yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Chat Panel */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <div className="p-1.5 rounded-lg bg-cyan-500/20">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                  </div>
                  Vanguard AI Copilot
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Chat with AI about this device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {chatHistory.length > 0 && (
                  <ScrollArea className="h-[180px] border border-cyan-500/20 rounded-lg p-3 bg-slate-900/50">
                    <div className="space-y-3">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={cn(
                            "max-w-[80%] p-3 rounded-lg text-sm",
                            msg.role === 'user' 
                              ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30' 
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          )}>
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
                    className="bg-slate-900/50 border-cyan-500/20 text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50"
                  />
                  <Button 
                    onClick={handleAsk} 
                    disabled={isAsking || !question.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['What is the status?', 'Scan the network', 'Check for vulnerabilities'].map(prompt => (
                    <Button 
                      key={prompt} 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" 
                      onClick={() => setQuestion(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Info */}
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-400" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard label="Device ID" value={agent.device_id} mono />
                <InfoCard label="Agent Version" value={agent.agent_version || 'Unknown'} />
                <InfoCard label="Firmware" value={agent.firmware_version || 'Unknown'} />
                <InfoCard label="Hailo Board" value={agent.hailo_board_name || 'Not detected'} highlight={!!agent.hailo_board_name} />
                <InfoCard label="VPN IP" value={agent.vpn_ip || 'N/A'} />
                <InfoCard label="Local IP" value={agent.ip_address || 'N/A'} />
                <InfoCard label="Location" value={agent.location || 'Not set'} />
                <InfoCard label="Last Heartbeat" value={agent.last_heartbeat ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true }) : 'Never'} />
              </dl>
            </CardContent>
          </Card>

          {/* Command History */}
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-cyan-400" />
                Command History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {commands.length === 0 ? (
                  <div className="text-center py-12">
                    <Terminal className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No commands sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {commands.map(cmd => (
                      <div key={cmd.id} className="p-4 bg-slate-900/50 rounded-lg border border-cyan-500/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              cmd.status === 'completed' ? "bg-green-500/20" : 
                              cmd.status === 'failed' ? "bg-red-500/20" : "bg-yellow-500/20"
                            )}>
                              <Terminal className={cn(
                                "h-4 w-4",
                                cmd.status === 'completed' ? "text-green-400" : 
                                cmd.status === 'failed' ? "text-red-400" : "text-yellow-400"
                              )} />
                            </div>
                            <p className="font-medium text-slate-200">{cmd.command_type}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              {formatDistanceToNow(new Date(cmd.created_at), { addSuffix: true })}
                            </span>
                            <Badge className={cn(
                              cmd.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                              cmd.status === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            )}>
                              {cmd.status}
                            </Badge>
                          </div>
                        </div>
                        {cmd.payload && Object.keys(cmd.payload).length > 0 && (
                          <div className="text-xs text-slate-400 font-mono bg-slate-800/50 p-2 rounded border border-slate-700">
                            Payload: {JSON.stringify(cmd.payload)}
                          </div>
                        )}
                        {cmd.response && (
                          <div className="text-xs bg-green-500/10 border border-green-500/20 p-3 rounded font-mono">
                            <span className="text-green-400 font-semibold flex items-center gap-1 mb-1">
                              <CheckCircle className="h-3 w-3" /> Output:
                            </span>
                            <pre className="whitespace-pre-wrap text-slate-300">
                              {typeof cmd.response === 'string' ? cmd.response : JSON.stringify(cmd.response, null, 2)}
                            </pre>
                          </div>
                        )}
                        {cmd.error_message && (
                          <div className="text-xs bg-red-500/10 border border-red-500/20 p-3 rounded">
                            <span className="text-red-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Error:
                            </span>
                            <span className="text-slate-300 ml-1">{cmd.error_message}</span>
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
  unit,
  color = 'cyan'
}: { 
  icon: React.ElementType; 
  label: string; 
  value: number; 
  unit: string;
  color?: 'cyan' | 'purple' | 'blue' | 'orange';
}) {
  const getStatusColor = () => {
    if (value >= 90) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', progress: 'bg-red-500' };
    if (value >= 70) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', progress: 'bg-yellow-500' };
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', progress: 'bg-green-500' };
  };

  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  };

  const iconColors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };

  const status = getStatusColor();

  return (
    <Card className={cn(
      "bg-gradient-to-br from-slate-900/80 to-slate-800/60 border backdrop-blur-sm",
      colorClasses[color]
    )}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", status.bg)}>
            <Icon className={cn("h-6 w-6", iconColors[color])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 truncate">{label}</p>
            <p className={cn("text-2xl font-bold", status.text)}>
              {value.toFixed(1)}{unit}
            </p>
          </div>
        </div>
        <div className="mt-3 relative">
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", status.progress)}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoCard({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-500/10">
      <dt className="text-xs text-slate-500 mb-1">{label}</dt>
      <dd className={cn(
        "text-sm truncate",
        mono ? "font-mono text-xs" : "",
        highlight ? "text-cyan-400" : "text-slate-200"
      )}>
        {value}
      </dd>
    </div>
  );
}
