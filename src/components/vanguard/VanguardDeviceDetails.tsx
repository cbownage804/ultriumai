import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVanguardAgent } from '@/hooks/useVanguardAgents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Cpu, HardDrive, MemoryStick, Thermometer,
  Send, RefreshCw, Terminal, MessageSquare, Loader2,
  Monitor, FileCode, Lock, Shield, Settings, Activity,
  Zap, Wifi, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, Area, AreaChart } from 'recharts';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getVanguardBasePath } from '@/utils/subdomain';
import { launchProtocolWithFallback } from '@/utils/launchProtocolUrl';
import { openMeshCentralSession } from '@/config/vanguardMeshCentral';
import { cn } from '@/lib/utils';
import { ModuleIntroBanner } from '@/components/vanguard/shared/ModuleInstructions';

import { AgentConsole } from './device/console/AgentConsole';
import { RemoteAccessPanel } from './device/RemoteAccessPanel';
import { ScriptLibrary } from './device/ScriptLibrary';
import { ConfigurationPolicies } from './device/ConfigurationPolicies';
import { ProfileManager } from './profiles/ProfileManager';

const sidebarSections = [
  { id: 'summary', label: 'Summary', icon: Activity },
  { id: 'system', label: 'System', icon: Cpu },
  { id: 'performance', label: 'Performance', icon: Activity },
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'scripts', label: 'Scripts', icon: FileCode },
  { id: 'remote', label: 'Remote Access', icon: Monitor },
  { id: 'policies', label: 'Policies', icon: Lock },
  { id: 'profiles', label: 'Profiles', icon: Settings },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'ai-copilot', label: 'AI Copilot', icon: MessageSquare },
];

export function VanguardDeviceDetails() {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const { agent, metrics, commands, isLoading, sendCommand, refetch, updateAgentConfig } = useVanguardAgent(deviceId);
  
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [activeSection, setActiveSection] = useState('summary');
  const [consoleActivated, setConsoleActivated] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Track active section on scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const viewportMid = containerRect.top + containerRect.height * 0.35;
      let current = 'summary';
      let closestDist = Infinity;
      
      for (const section of sidebarSections) {
        const el = sectionRefs.current[section.id];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - viewportMid);
        if (rect.top <= viewportMid + rect.height * 0.5 && dist < closestDist) {
          closestDist = dist;
          current = section.id;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Latch console as activated once user navigates to it (stays mounted forever after)
  useEffect(() => {
    if (activeSection === 'console' && !consoleActivated) {
      setConsoleActivated(true);
    }
  }, [activeSection, consoleActivated]);

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el && contentRef.current) {
      contentRef.current.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth',
      });
    }
    setActiveSection(id);
  }, []);

  const setSectionRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  }, []);

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
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
          body: JSON.stringify({ messages: newHistory, agentId: deviceId, stream: false }),
        }
      );
      if (!response.ok) throw new Error('AI request failed');
      const data = await response.json();
      setChatHistory([...newHistory, { role: 'assistant', content: data.response || 'No response' }]);
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
    rustdeskId?: string; splashtopId?: string; anydeskId?: string; teamviewerId?: string;
  }) => {
    await updateAgentConfig({
      remote_access: {
        rustdesk_id: ids.rustdeskId, splashtop_id: ids.splashtopId,
        anydesk_id: ids.anydeskId, teamviewer_id: ids.teamviewerId,
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

  const remoteAccess = {
    rustdesk_id: agent.rustdesk_id || agent.config?.remote_access?.rustdesk_id,
    splashtop_id: agent.config?.remote_access?.splashtop_id,
    anydesk_id: agent.config?.remote_access?.anydesk_id,
    teamviewer_id: agent.config?.remote_access?.teamviewer_id,
  };
  const hw = (agent.config as any)?.hardware || {};
  const sysInfo = {
    os_name: hw.os_name,
    os_arch: hw.form_factor,
    os_version: hw.os_version,
    manufacturer: hw.manufacturer || hw.bios_manufacturer,
    model: hw.model,
    serial_number: hw.serial_number,
    processor: hw.cpu_info,
    cpu_cores: hw.cores,
    total_memory: hw.total_memory_gb ? hw.total_memory_gb * 1073741824 : null,
    domain: hw.domain,
    last_user: hw.last_user,
    ...((agent as any).system_info || {}),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Top Header Bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur-sm flex-shrink-0">
        <Button 
          variant="ghost" size="icon" 
          onClick={() => navigate(`${basePath}/devices`)}
          className="hover:bg-cyan-500/20 hover:text-cyan-400"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Badge className={cn(
            "w-2.5 h-2.5 rounded-full p-0",
            agent.status === 'online' ? 'bg-green-400 animate-pulse' : 
            agent.status === 'critical' ? 'bg-red-400' : 'bg-yellow-400'
          )} />
          <h1 className="text-xl font-bold text-slate-100">{agent.name}</h1>
          <Badge className={cn(
            "text-xs",
            agent.status === 'online' 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : agent.status === 'critical' 
              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
          )}>
            {agent.status}
          </Badge>
          {agent.hailo_board_name && (
            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 gap-1 text-xs">
              <Zap className="h-3 w-3" /> Hailo AI
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* MeshCentral Remote In button */}
          {(agent as any).meshcentral_node_id ? (
            <Button
              size="sm"
              onClick={async () => {
                const nodeId = (agent as any).meshcentral_node_id;
                toast.info('Opening MeshCentral remote desktop...');
                const success = await openMeshCentralSession(nodeId);
                if (!success) {
                  toast.error('Failed to open MeshCentral session');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              <Monitor className="h-4 w-4" />
              Remote In
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              className="bg-slate-700 text-slate-400 gap-2 cursor-not-allowed"
              title="MeshCentral agent not yet detected on this device"
            >
              <Monitor className="h-4 w-4" />
              Remote In
            </Button>
          )}
          <span className="text-sm text-slate-400 hidden md:block">
            {agent.ip_address || 'No IP'} • {agent.location || 'No location'}
          </span>
          <Button 
            variant="outline" size="sm" onClick={refetch}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-2"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Sidebar + Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-48 flex-shrink-0 border-r border-cyan-500/20 bg-slate-900/40 overflow-y-auto hidden md:block">
          <div className="py-3">
            {sidebarSections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all text-left",
                  activeSection === section.id
                    ? "bg-cyan-500/15 text-cyan-400 border-l-2 border-cyan-400"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent"
                )}
              >
                <section.icon className="h-4 w-4 flex-shrink-0" />
                {section.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile section selector */}
        <div className="md:hidden flex overflow-x-auto border-b border-cyan-500/20 bg-slate-900/40 flex-shrink-0 px-2 py-1 gap-1">
          {sidebarSections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap rounded-md transition-all",
                activeSection === section.id
                  ? "bg-cyan-500/20 text-cyan-400"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <section.icon className="h-3.5 w-3.5" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* MeshCentral Setup Banner (replaces RustDesk banner) */}
          {!(agent as any).meshcentral_node_id && (
            <ModuleIntroBanner
              title="MeshCentral Not Detected on This Device"
              description="MeshCentral agent needs to be installed for zero-touch browser-based remote access. Rebuild and redeploy the Vanguard agent to enable it."
              features={["Browser-based — no client install needed", "Zero-touch unattended access"]}
              docsUrl="https://meshcentral.com"
              docsLabel="Learn about MeshCentral"
              storageKey="meshcentral-setup-notice"
              accentColor="green"
            />
          )}

          {/* Summary Section */}
          <div ref={setSectionRef('summary')} id="section-summary">
            <SectionHeader icon={Activity} title="Summary" />
            <div className="grid gap-4 md:grid-cols-4 mt-4">
              <MetricCard icon={Cpu} label="CPU Usage" value={currentMetrics.cpu} unit="%" color="cyan" />
              <MetricCard icon={MemoryStick} label="Memory Usage" value={currentMetrics.memory} unit="%" color="purple" />
              <MetricCard icon={HardDrive} label="Disk Usage" value={currentMetrics.disk} unit="%" color="blue" />
              <MetricCard icon={Thermometer} label="Temperature" value={latestMetric?.temperature ?? 0} unit="°C" color="orange" />
            </div>
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm mt-4">
              <CardContent className="p-4">
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
          </div>

          {/* System Section */}
          <div ref={setSectionRef('system')} id="section-system">
            <SectionHeader icon={Cpu} title="System" />
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm mt-4">
              <CardContent className="p-4">
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoCard label="Operating System" value={sysInfo.os_name || (agent as any).os || 'Unknown'} />
                  <InfoCard label="Architecture" value={sysInfo.os_arch || 'Unknown'} />
                  <InfoCard label="OS Version" value={sysInfo.os_version || 'Unknown'} />
                  <InfoCard label="Manufacturer" value={sysInfo.manufacturer || 'Unknown'} />
                  <InfoCard label="Model" value={sysInfo.model || 'Unknown'} />
                  <InfoCard label="Serial Number" value={sysInfo.serial_number || 'N/A'} highlight />
                  <InfoCard label="Processor" value={sysInfo.processor || 'Unknown'} />
                  <InfoCard label="Total Cores" value={sysInfo.cpu_cores?.toString() || 'Unknown'} />
                  <InfoCard label="Memory (Installed)" value={sysInfo.total_memory ? `${(sysInfo.total_memory / 1073741824).toFixed(1)} GB` : 'Unknown'} />
                  <InfoCard label="Domain" value={sysInfo.domain || 'WORKGROUP'} />
                  <InfoCard label="Last User" value={sysInfo.last_user || 'Unknown'} />
                  <InfoCard label="Last Reboot" value={agent.last_heartbeat ? formatDistanceToNow(new Date(agent.last_heartbeat), { addSuffix: true }) : 'Unknown'} />
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Performance Section */}
          <div ref={setSectionRef('performance')} id="section-performance">
            <SectionHeader icon={Activity} title="Performance (24h)" />
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm mt-4">
              <CardContent className="p-4">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
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
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px', color: '#e2e8f0' }} />
                      <Legend />
                      <Area type="monotone" dataKey="cpu" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                      <Area type="monotone" dataKey="memory" stroke="#a855f7" fillOpacity={1} fill="url(#colorMemory)" name="Memory %" />
                      <Line type="monotone" dataKey="disk" stroke="#3b82f6" name="Disk %" dot={false} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                      <p>No metrics data available yet</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Console Section - lazy rendered, once activated stays mounted */}
          <div ref={setSectionRef('console')} id="section-console">
            <SectionHeader icon={Terminal} title="Console" />
            <div className="mt-4">
              {consoleActivated ? (
                <AgentConsole 
                  agentId={agent.id} 
                  deviceName={agent.name}
                  sendCommand={sendCommand}
                  currentMetrics={currentMetrics}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                    <Terminal className="h-5 w-5 mr-2" />
                    Click "Console" in the sidebar to load management tools
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Scripts Section */}
          <div ref={setSectionRef('scripts')} id="section-scripts">
            <SectionHeader icon={FileCode} title="Scripts" />
            <div className="mt-4">
              <ScriptLibrary agentId={agent.id} sendCommand={sendCommand} />
            </div>
          </div>

          {/* Remote Access Section */}
          <div ref={setSectionRef('remote')} id="section-remote">
            <SectionHeader icon={Monitor} title="Remote Access" />
            <div className="mt-4">
              <RemoteAccessPanel
                agentId={agent.id}
                deviceName={agent.name}
                rustdeskId={remoteAccess.rustdesk_id}
                splashtopId={remoteAccess.splashtop_id}
                anydeskId={remoteAccess.anydesk_id}
                teamviewerId={remoteAccess.teamviewer_id}
                meshcentralNodeId={(agent as any).meshcentral_node_id}
                onUpdateIds={handleUpdateRemoteIds}
              />
            </div>
          </div>

          {/* Policies Section */}
          <div ref={setSectionRef('policies')} id="section-policies">
            <SectionHeader icon={Lock} title="Policies" />
            <div className="mt-4">
              <ConfigurationPolicies agentId={agent.id} sendCommand={sendCommand} />
            </div>
          </div>

          {/* Profiles Section */}
          <div ref={setSectionRef('profiles')} id="section-profiles">
            <SectionHeader icon={Settings} title="Profiles" />
            <div className="mt-4">
              <ProfileManager />
            </div>
          </div>

          {/* Commands Section */}
          <div ref={setSectionRef('commands')} id="section-commands">
            <SectionHeader icon={Terminal} title="Command History" />
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm mt-4">
              <CardContent className="p-4">
                {commands.length === 0 ? (
                  <div className="text-center py-12">
                    <Terminal className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No commands sent yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
              </CardContent>
            </Card>
          </div>

          {/* AI Copilot Section */}
          <div ref={setSectionRef('ai-copilot')} id="section-ai-copilot">
            <SectionHeader icon={MessageSquare} title="AI Copilot" />
            <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm mt-4">
              <CardContent className="p-4 space-y-4">
                {chatHistory.length > 0 && (
                  <ScrollArea className="h-[250px] border border-cyan-500/20 rounded-lg p-3 bg-slate-900/50">
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
                      key={prompt} variant="outline" size="sm" 
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

          {/* Bottom spacer for scroll */}
          <div className="h-32" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-cyan-500/20">
      <Icon className="h-5 w-5 text-cyan-400" />
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, unit, color = 'cyan' }: { 
  icon: React.ElementType; label: string; value: number; unit: string;
  color?: 'cyan' | 'purple' | 'blue' | 'orange';
}) {
  const getStatusColor = () => {
    if (value >= 90) return { bg: 'bg-red-500/20', text: 'text-red-400', progress: 'bg-red-500' };
    if (value >= 70) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', progress: 'bg-yellow-500' };
    return { bg: 'bg-green-500/20', text: 'text-green-400', progress: 'bg-green-500' };
  };
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  };
  const iconColors = { cyan: 'text-cyan-400', purple: 'text-purple-400', blue: 'text-blue-400', orange: 'text-orange-400' };
  const status = getStatusColor();

  return (
    <Card className={cn("bg-gradient-to-br from-slate-900/80 to-slate-800/60 border backdrop-blur-sm", colorClasses[color])}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", status.bg)}>
            <Icon className={cn("h-6 w-6", iconColors[color])} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-400 truncate">{label}</p>
            <p className={cn("text-2xl font-bold", status.text)}>{value.toFixed(1)}{unit}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-500", status.progress)} style={{ width: `${Math.min(value, 100)}%` }} />
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
      <dd className={cn("text-sm truncate", mono ? "font-mono text-xs" : "", highlight ? "text-cyan-400" : "text-slate-200")}>
        {value}
      </dd>
    </div>
  );
}
