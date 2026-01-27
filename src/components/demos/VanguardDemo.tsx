import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  RefreshCw
} from "lucide-react";
import vanguardLogo from '@/assets/vanguard-logo.png';

// Mock data for the demo
const mockDevices = [
  { id: 1, name: "PROD-WEB-01", type: "Server", os: "Ubuntu 22.04", status: "online", lastSeen: "Just now", threats: 0 },
  { id: 2, name: "DC-PRIMARY", type: "Domain Controller", os: "Windows Server 2022", status: "online", lastSeen: "2m ago", threats: 1 },
  { id: 3, name: "EXEC-LAPTOP-01", type: "Workstation", os: "Windows 11", status: "online", lastSeen: "5m ago", threats: 0 },
  { id: 4, name: "DEV-MAC-03", type: "Workstation", os: "macOS Sonoma", status: "offline", lastSeen: "2h ago", threats: 0 },
  { id: 5, name: "FILE-SERVER-01", type: "Server", os: "Windows Server 2019", status: "online", lastSeen: "1m ago", threats: 2 },
];

const mockThreats = [
  { id: 1, title: "Suspicious PowerShell Execution", severity: "critical", device: "DC-PRIMARY", time: "5m ago", status: "investigating" },
  { id: 2, title: "Unauthorized File Access Attempt", severity: "high", device: "FILE-SERVER-01", time: "12m ago", status: "investigating" },
  { id: 3, title: "Unusual Network Traffic Pattern", severity: "medium", device: "FILE-SERVER-01", time: "1h ago", status: "resolved" },
  { id: 4, title: "Failed Login Attempts (Brute Force)", severity: "high", device: "PROD-WEB-01", time: "3h ago", status: "resolved" },
];

const mockCompliance = [
  { framework: "SOC 2 Type II", score: 94, status: "compliant", controls: { passed: 47, failed: 3, total: 50 } },
  { framework: "HIPAA", score: 88, status: "at_risk", controls: { passed: 42, failed: 6, total: 48 } },
  { framework: "PCI-DSS", score: 96, status: "compliant", controls: { passed: 24, failed: 1, total: 25 } },
  { framework: "ISO 27001", score: 91, status: "compliant", controls: { passed: 89, failed: 9, total: 98 } },
];

export const VanguardDemo = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Wifi className="h-3 w-3 mr-1" />Online</Badge>;
      case "offline": return <Badge className="bg-muted text-muted-foreground"><WifiOff className="h-3 w-3 mr-1" />Offline</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with Vanguard branding */}
      <div className="flex justify-center mb-4">
        <img src={vanguardLogo} alt="Vanguard" className="h-28 w-auto" />
      </div>

      {/* Module Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <BarChart3 className="h-4 w-4 mr-1 hidden sm:block" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="devices" className="text-xs sm:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Monitor className="h-4 w-4 mr-1 hidden sm:block" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="threats" className="text-xs sm:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Target className="h-4 w-4 mr-1 hidden sm:block" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileCheck className="h-4 w-4 mr-1 hidden sm:block" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Monitor className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-muted-foreground">Active Devices</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">Active Threats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-xs text-muted-foreground">Security Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Activity className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">Alerts Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { icon: Eye, title: "SOC Operations", desc: "24/7 monitoring", color: "from-purple-500 to-purple-600" },
              { icon: Target, title: "Threat Detection", desc: "AI-powered analysis", color: "from-red-500 to-red-600" },
              { icon: Shield, title: "Pen Testing", desc: "Automated scans", color: "from-orange-500 to-orange-600" },
              { icon: FileCheck, title: "Compliance", desc: "Multi-framework", color: "from-green-500 to-green-600" },
              { icon: Users, title: "User Behavior", desc: "Anomaly detection", color: "from-violet-500 to-violet-600" },
              { icon: Server, title: "Asset Inventory", desc: "Complete tracking", color: "from-cyan-500 to-cyan-600" },
            ].map((module, i) => (
              <Card key={i} className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-colors cursor-pointer group">
                <CardContent className="p-4">
                  <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${module.color} mb-2`}>
                    <module.icon className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-medium text-sm flex items-center justify-between">
                    {module.title}
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
                  </h4>
                  <p className="text-xs text-muted-foreground">{module.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">4 Online</Badge>
              <Badge className="bg-muted text-muted-foreground">1 Offline</Badge>
            </div>
            <Button size="sm" variant="outline" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {mockDevices.map((device) => (
              <Card key={device.id} className="bg-card/50 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-cyan-500/10' : 'bg-muted'}`}>
                        {device.type === 'Server' ? <Server className={`h-4 w-4 ${device.status === 'online' ? 'text-cyan-400' : 'text-muted-foreground'}`} /> :
                         device.type === 'Domain Controller' ? <HardDrive className={`h-4 w-4 ${device.status === 'online' ? 'text-cyan-400' : 'text-muted-foreground'}`} /> :
                         <Cpu className={`h-4 w-4 ${device.status === 'online' ? 'text-cyan-400' : 'text-muted-foreground'}`} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{device.name}</span>
                          {device.threats > 0 && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              {device.threats} threat{device.threats > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{device.os} • {device.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">{device.lastSeen}</span>
                      {getStatusBadge(device.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-red-400">1</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/5 border-orange-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-orange-400">2</p>
                <p className="text-xs text-muted-foreground">High</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/5 border-yellow-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-xl font-bold text-yellow-400">1</p>
                <p className="text-xs text-muted-foreground">Medium</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            {mockThreats.map((threat) => (
              <Card key={threat.id} className={`bg-card/50 ${threat.status === 'investigating' ? 'border-l-4 border-l-red-500' : ''} border-border/50`}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(threat.severity)}>{threat.severity}</Badge>
                        <span className="font-medium text-sm">{threat.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="text-cyan-400">{threat.device}</span> • {threat.time}
                      </p>
                    </div>
                    <Badge variant={threat.status === 'investigating' ? 'secondary' : 'outline'} className="text-xs shrink-0">
                      {threat.status === 'investigating' ? <Clock className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                      {threat.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {mockCompliance.map((item, i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{item.framework}</h4>
                    <Badge className={item.status === 'compliant' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}>
                      {item.status === 'compliant' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {item.status === 'compliant' ? 'Compliant' : 'At Risk'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Score</span>
                      <span className="font-bold">{item.score}%</span>
                    </div>
                    <Progress value={item.score} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-emerald-400">{item.controls.passed} passed</span>
                    <span className="text-red-400">{item.controls.failed} failed</span>
                    <span>{item.controls.total} total controls</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* CTA with cyan branding */}
      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={vanguardLogo} alt="Vanguard" className="h-16 w-auto" />
          </div>
          <h4 className="text-lg font-bold mb-1">Unified Security Operations</h4>
          <p className="text-muted-foreground text-sm mb-3">
            Deploy Vanguard agents and get complete visibility across your infrastructure
          </p>
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white">
            Launch Platform
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
