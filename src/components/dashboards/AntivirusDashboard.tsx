import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Play,
  Pause,
  RefreshCw,
  Settings,
  FileText,
  Download,
  Zap,
  BarChart3,
  Users,
  Cpu,
  HardDrive,
  Monitor
} from "lucide-react";

export const AntivirusDashboard = () => {
  const stats = {
    totalDevices: 247,
    protectedDevices: 243,
    unprotectedDevices: 4,
    threatsBlocked: 1247,
    quarantinedFiles: 23,
    lastScan: "15 minutes ago",
    realTimeProtection: true
  };

  const scanResults = [
    { device: "DC-PRIMARY", status: "clean", lastScan: "2 hours ago", threats: 0, files: 2847291 },
    { device: "EXCHANGE-01", status: "clean", lastScan: "1 hour ago", threats: 0, files: 1923847 },
    { device: "FILE-SERVER", status: "threats", lastScan: "30 min ago", threats: 3, files: 4782193 },
    { device: "WS-SALES-05", status: "quarantined", lastScan: "45 min ago", threats: 1, files: 847293 }
  ];

  const recentThreats = [
    { threat: "Trojan.Win32.Agent", device: "WS-MARKETING-03", action: "quarantined", time: "5 min ago", severity: "high" },
    { threat: "Adware.Generic.12345", device: "WS-ACCOUNTING-07", action: "removed", time: "12 min ago", severity: "medium" },
    { threat: "PUP.Optional.WebBar", device: "WS-SALES-11", action: "quarantined", time: "1 hour ago", severity: "low" }
  ];

  const protectionStatus = [
    { component: "Real-time Protection", status: "active", coverage: 98 },
    { component: "Email Protection", status: "active", coverage: 100 },
    { component: "Web Protection", status: "active", coverage: 95 },
    { component: "USB Protection", status: "active", coverage: 92 },
    { component: "Firewall Integration", status: "warning", coverage: 87 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'text-green-600';
      case 'threats': return 'text-red-600';
      case 'quarantined': return 'text-yellow-600';
      case 'active': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'clean': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'threats': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'quarantined': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <Shield className="h-10 w-10 text-primary" />
            Antivirus Protection
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Real-time threat protection and malware detection
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Definitions
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/90">
            <Play className="h-4 w-4 mr-2" />
            Full Scan
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protected Devices</CardTitle>
            <Shield className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.protectedDevices}</div>
            <p className="text-xs text-green-600 mt-2">
              {Math.round((stats.protectedDevices / stats.totalDevices) * 100)}% coverage
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.threatsBlocked}</div>
            <p className="text-xs text-blue-600 mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quarantined</CardTitle>
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.quarantinedFiles}</div>
            <p className="text-xs text-orange-600 mt-2">Isolated files</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Full Scan</CardTitle>
            <Clock className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">✓</div>
            <p className="text-xs text-muted-foreground mt-2">{stats.lastScan}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="devices" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Monitor className="h-4 w-4 mr-2" />
            Device Scans
          </TabsTrigger>
          <TabsTrigger value="threats" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Threat Log
          </TabsTrigger>
          <TabsTrigger value="protection" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Protection Status
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Real-time Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">Active Protection</p>
                      <p className="text-sm text-muted-foreground">All systems monitored</p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">Online</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Definition Version</span>
                    <span className="font-medium">2024.01.15.003</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Update</span>
                    <span className="font-medium">2 hours ago</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Engine Version</span>
                    <span className="font-medium">12.3.456.789</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Active Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentThreats.slice(0, 3).map((threat, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <AlertTriangle className={`h-5 w-5 ${
                        threat.severity === 'high' ? 'text-red-500' :
                        threat.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{threat.threat}</p>
                        <p className="text-xs text-muted-foreground">{threat.device}</p>
                      </div>
                      <Badge variant={threat.action === 'quarantined' ? 'secondary' : 'default'}>
                        {threat.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Device Scans Tab */}
        <TabsContent value="devices" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Device Scan Results
              </CardTitle>
              <CardDescription>Latest scan status for all protected devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanResults.map((result) => (
                  <div key={result.device} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium">{result.device}</h4>
                          <p className="text-sm text-muted-foreground">Last scan: {result.lastScan}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className={`text-sm font-medium ${result.threats > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {result.threats}
                          </div>
                          <div className="text-xs text-muted-foreground">Threats</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-600">
                            {result.files.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Files Scanned</div>
                        </div>
                        <Badge variant={result.status === 'clean' ? 'default' : result.status === 'threats' ? 'destructive' : 'secondary'}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threat Log Tab */}
        <TabsContent value="threats" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Recent Threat Activity
              </CardTitle>
              <CardDescription>Detailed log of detected and blocked threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentThreats.map((threat, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          threat.severity === 'high' ? 'text-red-500' :
                          threat.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                        <div>
                          <h4 className="font-medium">{threat.threat}</h4>
                          <p className="text-sm text-muted-foreground">Device: {threat.device}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          threat.severity === 'high' ? 'destructive' :
                          threat.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {threat.severity}
                        </Badge>
                        <Badge variant={threat.action === 'removed' ? 'default' : 'secondary'}>
                          {threat.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{threat.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Protection Status Tab */}
        <TabsContent value="protection" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Protection Components
              </CardTitle>
              <CardDescription>Status of all security modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {protectionStatus.map((component) => (
                  <div key={component.component} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(component.status)}
                        <div>
                          <h4 className="font-medium">{component.component}</h4>
                          <p className="text-sm text-muted-foreground">
                            {component.coverage}% device coverage
                          </p>
                        </div>
                      </div>
                      <Badge variant={component.status === 'active' ? 'default' : 'secondary'}>
                        {component.status}
                      </Badge>
                    </div>
                    <Progress value={component.coverage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};