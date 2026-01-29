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
  Terminal
} from "lucide-react";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { useThrottle } from '@/hooks/useThrottle';
import { 
  mockRMMDevices, 
  mockTickets, 
  mockSOCAlerts, 
  mockCompliance, 
  mockMSPClients,
  platformModules,
  liveActivityFeed 
} from '@/data/vanguard-demo-data';

// Icon mapping for dynamic rendering
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Ticket, Eye, Target, FileCheck, Shield, Globe, Database, Network, Lock, Bot, Layers,
  CheckCircle, Radio
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
    <div className="p-4 space-y-4" role="region" aria-label="Vanguard Platform Demo">
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex items-center justify-center gap-2">
        <Badge className="bg-amber-500 text-white border-0 animate-pulse">
          DEMO MODE
        </Badge>
        <span className="text-sm text-amber-600 dark:text-amber-400">
          This is a product demonstration with sample data. <a href="/vanguard/auth" className="underline font-medium hover:text-amber-500">Sign up</a> to deploy real agents.
        </span>
      </div>

      {/* Header with Vanguard branding */}
      <div className="flex justify-center mb-4">
        <img src={vanguardLogo} alt="Vanguard MSP Platform" className="h-28 w-auto" loading="lazy" />
      </div>

      {/* Product Suite Badges */}
      <div className="flex flex-wrap justify-center gap-2 mb-4" role="list" aria-label="Platform capabilities">
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30" role="listitem">
          <Monitor className="h-3 w-3 mr-1" aria-hidden="true" />SafeOps RMM
        </Badge>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30" role="listitem">
          <Ticket className="h-3 w-3 mr-1" aria-hidden="true" />SafeDesk Helpdesk
        </Badge>
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30" role="listitem">
          <Eye className="h-3 w-3 mr-1" aria-hidden="true" />SOC Operations
        </Badge>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30" role="listitem">
          <FileCheck className="h-3 w-3 mr-1" aria-hidden="true" />Compliance
        </Badge>
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30" role="listitem">
          <Building2 className="h-3 w-3 mr-1" aria-hidden="true" />Multi-Tenant MSP
        </Badge>
      </div>

      {/* Module Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50" aria-label="Platform modules">
          <TabsTrigger 
            value="overview" 
            className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="Platform overview"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="rmm" 
            className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="SafeOps Remote Monitoring"
          >
            SafeOps
          </TabsTrigger>
          <TabsTrigger 
            value="helpdesk" 
            className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="SafeDesk Helpdesk"
          >
            SafeDesk
          </TabsTrigger>
          <TabsTrigger 
            value="soc" 
            className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="Security Operations Center"
          >
            SOC
          </TabsTrigger>
          <TabsTrigger 
            value="msp" 
            className="text-xs data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            aria-label="MSP Management Portal"
          >
            MSP Portal
          </TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Monitor className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">127</p>
                    <p className="text-[10px] text-muted-foreground">Managed Devices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Ticket className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">11</p>
                    <p className="text-[10px] text-muted-foreground">Open Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">3</p>
                    <p className="text-[10px] text-muted-foreground">Active Threats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Building2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">8</p>
                    <p className="text-[10px] text-muted-foreground">MSP Clients</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Modules Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { icon: Monitor, title: "RMM", desc: "Remote monitoring", color: "from-cyan-500 to-cyan-600" },
              { icon: Ticket, title: "Helpdesk", desc: "IT service desk", color: "from-purple-500 to-purple-600" },
              { icon: Eye, title: "SOC", desc: "Security operations", color: "from-red-500 to-red-600" },
              { icon: Target, title: "Threat Detection", desc: "AI-powered", color: "from-orange-500 to-orange-600" },
              { icon: FileCheck, title: "Compliance", desc: "Multi-framework", color: "from-green-500 to-green-600" },
              { icon: Shield, title: "Pen Testing", desc: "Automated scans", color: "from-rose-500 to-rose-600" },
              { icon: Globe, title: "Dark Web", desc: "Credential monitoring", color: "from-slate-600 to-slate-700" },
              { icon: Database, title: "SIEM", desc: "Log aggregation", color: "from-blue-500 to-blue-600" },
              { icon: Network, title: "Network Map", desc: "Topology view", color: "from-indigo-500 to-indigo-600" },
              { icon: Lock, title: "Vault", desc: "Credential mgmt", color: "from-amber-500 to-amber-600" },
              { icon: Bot, title: "AI Copilot", desc: "Security assistant", color: "from-violet-500 to-violet-600" },
              { icon: Layers, title: "Multi-Tenant", desc: "MSP management", color: "from-teal-500 to-teal-600" },
            ].map((mod, i) => (
              <Card key={i} className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-colors cursor-pointer group">
                <CardContent className="p-3">
                  <div className={`inline-flex p-1.5 rounded-lg bg-gradient-to-br ${mod.color} mb-1`}>
                    <mod.icon className="h-3 w-3 text-white" />
                  </div>
                  <h4 className="font-medium text-xs flex items-center justify-between">
                    {mod.title}
                    <ArrowRight className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                  </h4>
                  <p className="text-[10px] text-muted-foreground">{mod.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Live Activity Feed */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                Live Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Shield, text: "Threat blocked on DC-PRIMARY", time: "2m ago", color: "text-red-400" },
                { icon: CheckCircle, text: "Ticket TKT-1038 resolved", time: "5m ago", color: "text-green-400" },
                { icon: Monitor, text: "Agent deployed to LAPTOP-042", time: "8m ago", color: "text-cyan-400" },
                { icon: FileCheck, text: "SOC 2 compliance scan completed", time: "12m ago", color: "text-emerald-400" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-3 w-3 ${item.color}`} />
                    <span>{item.text}</span>
                  </div>
                  <span className="text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ RMM TAB ============ */}
        <TabsContent value="rmm" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Wifi className="h-3 w-3 mr-1" />4 Online
              </Badge>
              <Badge className="bg-muted text-muted-foreground">
                <WifiOff className="h-3 w-3 mr-1" />1 Offline
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-7 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Open remote shell">
                <Terminal className="h-3 w-3 mr-1" aria-hidden="true" />Remote Shell
              </Button>
              <Button size="sm" variant="outline" className="text-xs h-7 focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Refresh device list">
                <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />Refresh
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[280px]">
            <div className="space-y-2">
              {mockRMMDevices.map((device) => (
                <Card key={device.id} className="bg-card/50 border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${device.status === 'online' ? 'bg-cyan-500/10' : 'bg-muted'}`}>
                          <Server className={`h-4 w-4 ${device.status === 'online' ? 'text-cyan-400' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{device.name}</span>
                            <Badge variant="outline" className="text-[10px] h-4">{device.customer}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{device.os}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={device.patches === 'current' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : device.patches === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} >
                          {device.patches === 'current' ? 'Patched' : device.patches === 'pending' ? 'Updates' : 'Outdated'}
                        </Badge>
                        <Badge className={device.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                    {device.status === 'online' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">CPU</span>
                            <span>{device.cpu}%</span>
                          </div>
                          <Progress value={device.cpu} className="h-1" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">Memory</span>
                            <span>{device.memory}%</span>
                          </div>
                          <Progress value={device.memory} className="h-1" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ============ HELPDESK TAB ============ */}
        <TabsContent value="helpdesk" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-amber-400">2</p>
                <p className="text-[10px] text-muted-foreground">Open</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-blue-400">1</p>
                <p className="text-[10px] text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">1</p>
                <p className="text-[10px] text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[240px]">
            <div className="space-y-2">
              {mockTickets.map((ticket) => (
                <Card key={ticket.id} className={`bg-card/50 ${ticket.status === 'open' ? 'border-l-4 border-l-amber-500' : ticket.status === 'in_progress' ? 'border-l-4 border-l-blue-500' : ''} border-border/50`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono text-cyan-400">{ticket.id}</span>
                          <Badge className={getPriorityColor(ticket.priority)} >{ticket.priority}</Badge>
                        </div>
                        <p className="font-medium text-sm truncate">{ticket.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{ticket.customer}</span>
                          <span>•</span>
                          <span>{ticket.created}</span>
                          {ticket.assignee && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />{ticket.assignee}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={ticket.status === 'resolved' ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
            <Bot className="h-3 w-3 mr-1" />
            AI Ticket Assistant
          </Button>
        </TabsContent>

        {/* ============ SOC TAB ============ */}
        <TabsContent value="soc" className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-red-400">1</p>
                <p className="text-[10px] text-muted-foreground">Critical</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-orange-400">2</p>
                <p className="text-[10px] text-muted-foreground">High</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-yellow-400">1</p>
                <p className="text-[10px] text-muted-foreground">Medium</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-emerald-400">12</p>
                <p className="text-[10px] text-muted-foreground">Resolved</p>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-[220px]">
            <div className="space-y-2">
              {mockSOCAlerts.map((alert) => (
                <Card key={alert.id} className={`bg-card/50 ${alert.status === 'new' || alert.status === 'investigating' ? 'border-l-4 border-l-red-500' : ''} border-border/50`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                            {alert.mitre}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">{alert.source}</Badge>
                        </div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          <span className="text-cyan-400">{alert.device}</span> • {alert.time}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={alert.status === 'investigating' ? 'secondary' : alert.status === 'new' ? 'destructive' : 'outline'} className="text-[10px]">
                          {alert.status}
                        </Badge>
                        {alert.status !== 'resolved' && (
                          <Button size="sm" variant="outline" className="h-6 text-[10px]">
                            <Search className="h-3 w-3 mr-1" />Investigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-xs">
              <Play className="h-3 w-3 mr-1" />
              Run Threat Scan
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <Bot className="h-3 w-3 mr-1" />
              AI Analysis
            </Button>
          </div>
        </TabsContent>

        {/* ============ MSP TAB ============ */}
        <TabsContent value="msp" className="space-y-4">
          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20">
            <CardContent className="p-3">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold">8</p>
                  <p className="text-[10px] text-muted-foreground">Active Clients</p>
                </div>
                <div>
                  <p className="text-xl font-bold">127</p>
                  <p className="text-[10px] text-muted-foreground">Total Devices</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-400">$12.4K</p>
                  <p className="text-[10px] text-muted-foreground">Monthly MRR</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-400">98.2%</p>
                  <p className="text-[10px] text-muted-foreground">Uptime SLA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {mockMSPClients.map((client, i) => (
                <Card key={i} className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-colors cursor-pointer">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${client.status === 'healthy' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                          <Building2 className={`h-4 w-4 ${client.status === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {client.devices} devices • {client.tickets} tickets
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {client.threats > 0 && (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                            {client.threats} threats
                          </Badge>
                        )}
                        <Badge className={client.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                          {client.status}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Compliance Summary */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                Compliance Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {mockCompliance.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                  <span className="text-xs">{item.framework}</span>
                  <Badge className={item.status === 'compliant' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'} >
                    {item.score}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CTA with cyan branding */}
      <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" role="region" aria-label="Call to action">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={vanguardLogo} alt="Vanguard Platform" className="h-16 w-auto" loading="lazy" />
          </div>
          <h4 className="text-lg font-bold mb-1">Complete MSP Security Platform</h4>
          <p className="text-muted-foreground text-sm mb-3">
            RMM, Helpdesk, SOC, Compliance, and AI-Powered Security in one unified platform
          </p>
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2">
            Launch Vanguard Platform
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
