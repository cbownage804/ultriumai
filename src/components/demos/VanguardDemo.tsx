import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Activity, 
  Monitor,
  Target,
  FileCheck,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  ArrowRight,
  TrendingUp,
  Users,
  Server,
  HardDrive,
  Cpu,
  RefreshCw,
  Ticket,
  MessageSquare,
  Bot,
  Network,
  Globe,
  Lock,
  Database,
  Layers,
  Zap,
  Search,
  Play,
  Settings,
  Building2,
  UserCheck,
  ShieldCheck,
  FileSearch,
  Radio,
  Terminal,
  FileText,
  ClipboardCheck
} from "lucide-react";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { useThrottle } from '@/hooks/useThrottle';
// Demo data for marketing showcase (inline since this is a demo-only component)
const mockRMMDevices = [
  { id: 1, name: "PROD-WEB-01", customer: "Acme Corp", os: "Ubuntu 22.04", status: "online" as const, cpu: 45, memory: 62, patches: "current" as const },
  { id: 2, name: "DC-PRIMARY", customer: "TechStart Inc", os: "Windows Server 2022", status: "online" as const, cpu: 28, memory: 71, patches: "pending" as const },
  { id: 3, name: "EXEC-LAPTOP-01", customer: "Acme Corp", os: "Windows 11", status: "online" as const, cpu: 12, memory: 45, patches: "current" as const },
  { id: 4, name: "DEV-MAC-03", customer: "Design Studio", os: "macOS Sonoma", status: "offline" as const, cpu: 0, memory: 0, patches: "unknown" as const },
  { id: 5, name: "FILE-SERVER-01", customer: "TechStart Inc", os: "Windows Server 2019", status: "online" as const, cpu: 55, memory: 78, patches: "outdated" as const },
];

const mockTickets = [
  { id: "TKT-1042", title: "VPN connection failing from home office", customer: "Acme Corp", priority: "high" as const, status: "open" as const, assignee: "John D.", created: "2h ago" },
  { id: "TKT-1041", title: "Email sync issues on mobile device", customer: "TechStart Inc", priority: "medium" as const, status: "in_progress" as const, assignee: "Sarah M.", created: "4h ago" },
  { id: "TKT-1040", title: "Request for new software installation", customer: "Design Studio", priority: "low" as const, status: "open" as const, assignee: null, created: "6h ago" },
  { id: "TKT-1039", title: "Printer not connecting to network", customer: "Acme Corp", priority: "medium" as const, status: "resolved" as const, assignee: "John D.", created: "1d ago" },
];

const mockSOCAlerts = [
  { id: 1, title: "Suspicious PowerShell Execution", severity: "critical" as const, device: "DC-PRIMARY", source: "Pursuit EDR", time: "5m ago", status: "investigating" as const, mitre: "T1059.001" },
  { id: 2, title: "Brute Force Login Attempts Detected", severity: "high" as const, device: "PROD-WEB-01", source: "Cortex SIEM", time: "12m ago", status: "new" as const, mitre: "T1110" },
  { id: 3, title: "Unusual Outbound Traffic Pattern", severity: "medium" as const, device: "FILE-SERVER-01", source: "Recon", time: "45m ago", status: "investigating" as const, mitre: "T1041" },
  { id: 4, title: "Failed MFA Attempts - Executive Account", severity: "high" as const, device: "EXEC-LAPTOP-01", source: "Sentinel", time: "1h ago", status: "resolved" as const, mitre: "T1078" },
];

const mockCompliance = [
  { framework: "SOC 2 Type II", score: 94, status: "compliant" as const, lastAudit: "2024-01-15" },
  { framework: "HIPAA", score: 88, status: "at_risk" as const, lastAudit: "2024-01-10" },
  { framework: "PCI-DSS", score: 96, status: "compliant" as const, lastAudit: "2024-01-20" },
  { framework: "NIST CSF", score: 91, status: "compliant" as const, lastAudit: "2024-01-18" },
];

const mockMSPClients = [
  { name: "Acme Corp", devices: 45, tickets: 3, threats: 1, status: "healthy" as const },
  { name: "TechStart Inc", devices: 28, tickets: 5, threats: 2, status: "warning" as const },
  { name: "Design Studio", devices: 12, tickets: 1, threats: 0, status: "healthy" as const },
  { name: "Legal Partners LLP", devices: 32, tickets: 2, threats: 0, status: "healthy" as const },
];

const vanguardModules = [
  { id: 'horizon', name: 'Horizon', fullName: 'Vanguard Horizon', description: 'RMM & Health Monitoring', icon: 'Monitor', color: 'cyan', gradient: 'from-cyan-400 via-blue-500 to-purple-600' },
  { id: 'pursuit', name: 'Pursuit', fullName: 'Vanguard Pursuit', description: 'Threat Detection & Security', icon: 'Target', color: 'red', gradient: 'from-red-500 to-orange-600' },
  { id: 'response', name: 'Response', fullName: 'Vanguard Response', description: 'Incident Management & Helpdesk', icon: 'Ticket', color: 'purple', gradient: 'from-purple-500 to-violet-600' },
  { id: 'recon', name: 'Recon', fullName: 'Vanguard Recon', description: 'Network Discovery & Assets', icon: 'Network', color: 'blue', gradient: 'from-blue-500 to-indigo-600' },
  { id: 'atlas', name: 'Atlas', fullName: 'Vanguard Atlas', description: 'Knowledge Base & Documentation', icon: 'FileText', color: 'amber', gradient: 'from-amber-500 to-orange-600' },
  { id: 'ledger', name: 'Ledger', fullName: 'Vanguard Ledger', description: 'Compliance & Audit Trails', icon: 'ClipboardCheck', color: 'emerald', gradient: 'from-emerald-500 to-green-600' },
  { id: 'cortex', name: 'Cortex', fullName: 'Vanguard Cortex', description: 'AI-Assisted Operations', icon: 'Bot', color: 'violet', gradient: 'from-violet-500 to-purple-600' }
];

const platformModules = [
  { icon: 'Monitor', title: "Horizon", desc: "RMM & Monitoring", color: "from-cyan-500 to-cyan-600", module: "horizon" },
  { icon: 'Target', title: "Pursuit", desc: "Threat Detection", color: "from-red-500 to-red-600", module: "pursuit" },
  { icon: 'Ticket', title: "Response", desc: "Service Desk", color: "from-purple-500 to-purple-600", module: "response" },
  { icon: 'Network', title: "Recon", desc: "Asset Discovery", color: "from-blue-500 to-indigo-600", module: "recon" },
  { icon: 'FileText', title: "Atlas", desc: "Knowledge Base", color: "from-amber-500 to-orange-600", module: "atlas" },
  { icon: 'ClipboardCheck', title: "Ledger", desc: "Compliance", color: "from-emerald-500 to-green-600", module: "ledger" },
  { icon: 'Bot', title: "Cortex", desc: "AI Operations", color: "from-violet-500 to-purple-600", module: "cortex" },
  { icon: 'Shield', title: "Sentinel", desc: "M365 Security", color: "from-rose-500 to-rose-600", module: "sentinel" },
];

const liveActivityFeed = [
  { icon: 'Shield', text: "Pursuit blocked threat on DC-PRIMARY", time: "2m ago", color: "text-red-400" },
  { icon: 'CheckCircle', text: "Response ticket TKT-1038 resolved", time: "5m ago", color: "text-green-400" },
  { icon: 'Monitor', text: "Horizon agent deployed to LAPTOP-042", time: "8m ago", color: "text-cyan-400" },
  { icon: 'FileCheck', text: "Ledger: SOC 2 compliance scan completed", time: "12m ago", color: "text-emerald-400" },
];

// Module logo imports
import horizonLogo from '@/assets/vanguard/module-horizon.png';
import pursuitLogo from '@/assets/vanguard/module-pursuit.png';
import responseLogo from '@/assets/vanguard/module-response.png';
import reconLogo from '@/assets/vanguard/module-recon.png';
import atlasLogo from '@/assets/vanguard/module-atlas.png';
import ledgerLogo from '@/assets/vanguard/module-ledger.png';
import cortexLogo from '@/assets/vanguard/module-cortex.png';

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Ticket, Eye, Target, FileCheck, Shield, Globe, Database, Network, Lock, Bot, Layers,
  CheckCircle, Radio, FileText, ClipboardCheck
};

// Module logo mapping
const moduleLogos: Record<string, string> = {
  horizon: horizonLogo,
  pursuit: pursuitLogo,
  response: responseLogo,
  recon: reconLogo,
  atlas: atlasLogo,
  ledger: ledgerLogo,
  cortex: cortexLogo,
};

// =============== COMPONENT ===============

export const VanguardDemo = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Throttle tab changes to prevent rapid clicking
  const handleTabChange = useThrottle((value: string) => {
    setActiveTab(value);
  }, 150);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="p-4 space-y-4 bg-background min-h-screen" role="region" aria-label="Vanguard Platform Demo">
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-purple-500/20 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-center gap-2">
        <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white border-0 animate-pulse">
          DEMO MODE
        </Badge>
        <span className="text-sm text-cyan-400">
          This is a product demonstration with sample data. <a href="/vanguard/auth" className="underline font-medium hover:text-cyan-300">Sign up</a> to deploy real agents.
        </span>
      </div>

      {/* Header with Vanguard branding */}
      <div className="flex justify-center mb-4">
        <img src={vanguardLogo} alt="Vanguard Command Platform" className="h-28 w-auto" loading="lazy" />
      </div>

      {/* Product Suite Badges - Updated with correct module names */}
      <div className="flex flex-wrap justify-center gap-2 mb-4" role="list" aria-label="Platform modules">
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30" role="listitem">
          <Monitor className="h-3 w-3 mr-1" aria-hidden="true" />Horizon RMM
        </Badge>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30" role="listitem">
          <Ticket className="h-3 w-3 mr-1" aria-hidden="true" />Response Helpdesk
        </Badge>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30" role="listitem">
          <Target className="h-3 w-3 mr-1" aria-hidden="true" />Pursuit Security
        </Badge>
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" role="listitem">
          <ClipboardCheck className="h-3 w-3 mr-1" aria-hidden="true" />Ledger Compliance
        </Badge>
        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30" role="listitem">
          <Bot className="h-3 w-3 mr-1" aria-hidden="true" />Cortex AI
        </Badge>
      </div>

      {/* Module Tabs - Updated with correct names */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-black/80 border border-cyan-500/30" aria-label="Platform modules">
          <TabsTrigger 
            value="overview" 
            className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/20 data-[state=active]:via-blue-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="Platform overview"
          >
            Command
          </TabsTrigger>
          <TabsTrigger 
            value="horizon" 
            className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/20 data-[state=active]:via-blue-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="Vanguard Horizon RMM"
          >
            Horizon
          </TabsTrigger>
          <TabsTrigger 
            value="response" 
            className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/20 data-[state=active]:via-blue-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="Vanguard Response Helpdesk"
          >
            Response
          </TabsTrigger>
          <TabsTrigger 
            value="pursuit" 
            className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/20 data-[state=active]:via-blue-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="Vanguard Pursuit Security"
          >
            Pursuit
          </TabsTrigger>
          <TabsTrigger 
            value="clients" 
            className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400/20 data-[state=active]:via-blue-500/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="MSP Clients Portal"
          >
            Clients
          </TabsTrigger>
        </TabsList>

        {/* ============ COMMAND OVERVIEW TAB ============ */}
        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-cyan-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-500/20">
                    <Monitor className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">127</p>
                    <p className="text-[10px] text-white/60">Managed Devices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-purple-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400/20 to-violet-500/20">
                    <Ticket className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">11</p>
                    <p className="text-[10px] text-white/60">Open Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-red-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-red-400/20 to-orange-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">3</p>
                    <p className="text-[10px] text-white/60">Active Threats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border-cyan-500/30 shadow-lg shadow-emerald-500/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-400/20 to-green-500/20">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">8</p>
                    <p className="text-[10px] text-white/60">MSP Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vanguard Modules Grid with Logos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {vanguardModules.map((mod) => (
              <Card key={mod.id} className="bg-black/80 border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={moduleLogos[mod.id]} 
                      alt={mod.fullName}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                        {mod.name}
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                      </h4>
                      <p className="text-[10px] text-white/60">{mod.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Additional capability card */}
            <Card className="bg-black/80 border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                      Sentinel
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                    </h4>
                    <p className="text-[10px] text-white/60">M365 Security</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live Activity Feed */}
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-white">
                <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {liveActivityFeed.map((item, i) => {
                const IconComponent = iconMap[item.icon] || Shield;
                return (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-cyan-500/20 last:border-0">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-3 w-3 ${item.color}`} />
                      <span className="text-white/80">{item.text}</span>
                    </div>
                    <span className="text-white/40">{item.time}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ HORIZON (RMM) TAB ============ */}
        <TabsContent value="horizon" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={horizonLogo} alt="Vanguard Horizon" className="h-8 w-8 rounded-lg" />
              <div>
                <h3 className="text-sm font-semibold text-white">Vanguard Horizon</h3>
                <p className="text-[10px] text-white/60">Remote Monitoring & Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Wifi className="h-3 w-3 mr-1" />4 Online
              </Badge>
              <Badge className="bg-black/60 text-white/60 border-white/20">
                <WifiOff className="h-3 w-3 mr-1" />1 Offline
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs h-7 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Open remote shell">
              <Terminal className="h-3 w-3 mr-1" aria-hidden="true" />Remote Shell
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Refresh device list">
              <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />Refresh
            </Button>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {mockRMMDevices.map((device) => (
                <Card key={device.id} className="bg-black/80 border-cyan-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${device.status === 'online' ? 'bg-cyan-500/10' : 'bg-white/5'}`}>
                          <Server className={`h-4 w-4 ${device.status === 'online' ? 'text-cyan-400' : 'text-white/40'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-white">{device.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4 border-cyan-500/30 text-cyan-400">{device.customer}</Badge>
                          </div>
                          <p className="text-[10px] text-white/60">{device.os}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={device.patches === 'current' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : device.patches === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} >
                          {device.patches === 'current' ? 'Patched' : device.patches === 'pending' ? 'Updates' : 'Outdated'}
                        </Badge>
                        <Badge className={device.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-black/60 text-white/40'}>
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                    {device.status === 'online' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-white/60">CPU</span>
                            <span className="text-white">{device.cpu}%</span>
                          </div>
                          <Progress value={device.cpu} className="h-1 bg-white/10" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-white/60">Memory</span>
                            <span className="text-white">{device.memory}%</span>
                          </div>
                          <Progress value={device.memory} className="h-1 bg-white/10" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ============ RESPONSE (HELPDESK) TAB ============ */}
        <TabsContent value="response" className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <img src={responseLogo} alt="Vanguard Response" className="h-8 w-8 rounded-lg" />
            <div>
              <h3 className="text-sm font-semibold text-white">Vanguard Response</h3>
              <p className="text-[10px] text-white/60">Incident Management & Service Desk</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-black/80 border-cyan-500/30">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-amber-400">2</p>
                <p className="text-[10px] text-white/60">Open</p>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border-cyan-500/30">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-blue-400">1</p>
                <p className="text-[10px] text-white/60">In Progress</p>
              </CardContent>
            </Card>
            <Card className="bg-black/80 border-cyan-500/30">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">1</p>
                <p className="text-[10px] text-white/60">Resolved</p>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[220px]">
            <div className="space-y-2">
              {mockTickets.map((ticket) => (
                <Card key={ticket.id} className="bg-black/80 border-cyan-500/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-4 border-cyan-500/30 text-cyan-400">{ticket.id}</Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <Badge className={
                        ticket.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        ticket.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-white truncate">{ticket.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-white/60">
                      <span>{ticket.customer}</span>
                      <div className="flex items-center gap-2">
                        {ticket.assignee && <span className="text-cyan-400">{ticket.assignee}</span>}
                        <span>{ticket.created}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ============ PURSUIT (SOC/SECURITY) TAB ============ */}
        <TabsContent value="pursuit" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={pursuitLogo} alt="Vanguard Pursuit" className="h-8 w-8 rounded-lg" />
              <div>
                <h3 className="text-sm font-semibold text-white">Vanguard Pursuit</h3>
                <p className="text-[10px] text-white/60">Active Threat Detection & Security Intelligence</p>
              </div>
            </div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              3 Active Threats
            </Badge>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {mockSOCAlerts.map((alert) => (
                <Card key={alert.id} className={`bg-black/80 border-l-2 ${
                  alert.severity === 'critical' ? 'border-l-red-500 border-cyan-500/30' :
                  alert.severity === 'high' ? 'border-l-orange-500 border-cyan-500/30' :
                  'border-l-yellow-500 border-cyan-500/30'
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 border-cyan-500/30 text-cyan-400">
                          {alert.mitre}
                        </Badge>
                      </div>
                      <Badge className={
                        alert.status === 'new' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        alert.status === 'investigating' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }>
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-white/60">
                      <div className="flex items-center gap-2">
                        <Server className="h-3 w-3" />
                        <span>{alert.device}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400">{alert.source}</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ============ CLIENTS TAB ============ */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">MSP Client Portfolio</h3>
              <p className="text-[10px] text-white/60">Multi-tenant client management</p>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white border-0 text-xs h-7">
              <Building2 className="h-3 w-3 mr-1" />
              Add Client
            </Button>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {mockMSPClients.map((client, i) => (
                <Card key={i} className="bg-black/80 border-cyan-500/30 hover:border-cyan-400/60 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          client.status === 'healthy' ? 'bg-emerald-500/10' :
                          client.status === 'warning' ? 'bg-amber-500/10' : 'bg-red-500/10'
                        }`}>
                          <Building2 className={`h-4 w-4 ${
                            client.status === 'healthy' ? 'text-emerald-400' :
                            client.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                          }`} />
                        </div>
                        <div>
                          <span className="font-medium text-sm text-white">{client.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-white/60">
                            <span>{client.devices} devices</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {client.threats > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {client.threats}
                          </Badge>
                        )}
                        <Badge className={
                          client.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          client.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-cyan-500/10 rounded p-1">
                        <p className="text-sm font-bold text-cyan-400">{client.devices}</p>
                        <p className="text-[10px] text-white/60">Devices</p>
                      </div>
                      <div className="bg-purple-500/10 rounded p-1">
                        <p className="text-sm font-bold text-purple-400">{client.tickets}</p>
                        <p className="text-[10px] text-white/60">Tickets</p>
                      </div>
                      <div className="bg-red-500/10 rounded p-1">
                        <p className="text-sm font-bold text-red-400">{client.threats}</p>
                        <p className="text-[10px] text-white/60">Threats</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Footer CTA */}
      <div className="text-center pt-4 border-t border-cyan-500/30">
        <p className="text-xs text-white/60 mb-2">
          Ready to deploy Vanguard for your MSP?
        </p>
        <Button className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white border-0">
          <Shield className="h-4 w-4 mr-2" />
          Start Free Trial
        </Button>
      </div>
    </div>
  );
};
