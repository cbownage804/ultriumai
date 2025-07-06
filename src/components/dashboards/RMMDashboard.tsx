import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Activity, 
  Wifi, 
  HardDrive, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Monitor,
  Shield,
  Settings,
  Code,
  Play,
  Download,
  RefreshCw,
  Users,
  Zap,
  FileText,
  Calendar,
  BarChart3
} from "lucide-react";

export const RMMDashboard = () => {
  // Mock data - replace with real data from your RMM service
  const stats = {
    totalDevices: 247,
    onlineDevices: 231,
    offlineDevices: 16,
    alertsCount: 8,
    serversCount: 12,
    workstationsCount: 185,
    networkDevicesCount: 50,
    criticalAlerts: 2,
    pendingPatches: 34,
    scriptsRunning: 6
  };

  const serverData = [
    { name: "DC-PRIMARY", ip: "192.168.1.10", status: "online", cpu: 45, memory: 78, disk: 65, uptime: "30d 14h" },
    { name: "EXCHANGE-01", ip: "192.168.1.15", status: "online", cpu: 62, memory: 84, disk: 72, uptime: "28d 6h" },
    { name: "FILE-SERVER", ip: "192.168.1.20", status: "warning", cpu: 89, memory: 91, disk: 88, uptime: "15d 3h" },
    { name: "DB-SERVER", ip: "192.168.1.25", status: "online", cpu: 34, memory: 67, disk: 55, uptime: "45d 12h" }
  ];

  const workstationData = [
    { group: "Sales Department", total: 25, online: 24, needsPatches: 5, avgCpu: 35 },
    { group: "Marketing", total: 18, online: 17, needsPatches: 3, avgCpu: 42 },
    { group: "IT Department", total: 12, online: 12, needsPatches: 1, avgCpu: 28 },
    { group: "Accounting", total: 15, online: 14, needsPatches: 4, avgCpu: 31 },
    { group: "Executive", total: 8, online: 8, needsPatches: 0, avgCpu: 25 }
  ];

  const patchingData = [
    { category: "Security Updates", critical: 8, important: 12, optional: 14, deployed: 67 },
    { category: "Windows Updates", critical: 3, important: 8, optional: 23, deployed: 89 },
    { category: "Application Updates", critical: 2, important: 6, optional: 16, deployed: 45 },
    { category: "Driver Updates", critical: 1, important: 4, optional: 12, deployed: 23 }
  ];

  const policies = [
    { name: "Password Policy", status: "active", compliance: 94, lastUpdate: "2 days ago" },
    { name: "Antivirus Policy", status: "active", compliance: 98, lastUpdate: "1 week ago" },
    { name: "Firewall Rules", status: "active", compliance: 89, lastUpdate: "3 days ago" },
    { name: "USB Restrictions", status: "active", compliance: 87, lastUpdate: "5 days ago" },
    { name: "Software Installation", status: "pending", compliance: 76, lastUpdate: "2 weeks ago" }
  ];

  const automationScripts = [
    { name: "Daily Backup Check", status: "running", lastRun: "2 min ago", success: 98, nextRun: "Tomorrow 2:00 AM" },
    { name: "Disk Cleanup", status: "scheduled", lastRun: "1 hour ago", success: 95, nextRun: "Sunday 3:00 AM" },
    { name: "Security Scan", status: "running", lastRun: "30 min ago", success: 92, nextRun: "In 4 hours" },
    { name: "Patch Deployment", status: "idle", lastRun: "3 days ago", success: 88, nextRun: "Next Tuesday" },
    { name: "System Health Check", status: "running", lastRun: "5 min ago", success: 96, nextRun: "Every hour" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      case 'running': return 'text-blue-600';
      case 'scheduled': return 'text-purple-600';
      case 'active': return 'text-green-600';
      case 'pending': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running': return <Play className="h-4 w-4 text-blue-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-purple-500" />;
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            <Server className="h-10 w-10 text-primary" />
            Remote Monitoring & Management
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Complete infrastructure monitoring and automated management
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/90">
            <Server className="h-4 w-4 mr-2" />
            Add Device
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalDevices}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                {stats.onlineDevices} online
              </div>
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertTriangle className="h-3 w-3" />
                {stats.offlineDevices} offline
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {Math.round((stats.onlineDevices / stats.totalDevices) * 100)}%
            </div>
            <p className="text-xs text-green-600 mt-2">Excellent uptime</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Patches</CardTitle>
            <Download className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingPatches}</div>
            <p className="text-xs text-orange-600 mt-2">Across all devices</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scripts</CardTitle>
            <Code className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.scriptsRunning}</div>
            <p className="text-xs text-blue-600 mt-2">Automation running</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-muted/50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="servers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Server className="h-4 w-4 mr-2" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="workstations" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Monitor className="h-4 w-4 mr-2" />
            Workstations
          </TabsTrigger>
          <TabsTrigger value="patching" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Download className="h-4 w-4 mr-2" />
            Patching
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="automation" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Automation
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Device Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Server className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-medium">Servers</p>
                      <p className="text-sm text-muted-foreground">{stats.serversCount} devices</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Workstations</p>
                      <p className="text-sm text-muted-foreground">{stats.workstationsCount} devices</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-medium">Network Devices</p>
                      <p className="text-sm text-muted-foreground">{stats.networkDevicesCount} devices</p>
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-medium">FILE-SERVER: High CPU Usage (89%)</p>
                      <p className="text-sm text-muted-foreground">Requires immediate attention</p>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="font-medium">ROUTER-MAIN: Connection Timeout</p>
                      <p className="text-sm text-muted-foreground">Network connectivity issue</p>
                    </div>
                    <Badge variant="default">High</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Server Infrastructure
              </CardTitle>
              <CardDescription>Detailed server monitoring and management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serverData.map((server) => (
                  <div key={server.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(server.status)}
                        <div>
                          <h4 className="font-medium">{server.name}</h4>
                          <p className="text-sm text-muted-foreground">IP: {server.ip}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={server.status === 'online' ? 'default' : 'destructive'}>
                          {server.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Uptime: {server.uptime}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>CPU</span>
                          <span className={server.cpu > 80 ? 'text-red-600' : server.cpu > 60 ? 'text-yellow-600' : 'text-green-600'}>
                            {server.cpu}%
                          </span>
                        </div>
                        <Progress value={server.cpu} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Memory</span>
                          <span className={server.memory > 80 ? 'text-red-600' : server.memory > 60 ? 'text-yellow-600' : 'text-green-600'}>
                            {server.memory}%
                          </span>
                        </div>
                        <Progress value={server.memory} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Disk</span>
                          <span className={server.disk > 80 ? 'text-red-600' : server.disk > 60 ? 'text-yellow-600' : 'text-green-600'}>
                            {server.disk}%
                          </span>
                        </div>
                        <Progress value={server.disk} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workstations Tab */}
        <TabsContent value="workstations" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Workstation Groups
              </CardTitle>
              <CardDescription>Organized by department and location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workstationData.map((group) => (
                  <div key={group.group} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-8 w-8 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{group.group}</h4>
                          <p className="text-sm text-muted-foreground">{group.total} workstations</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">{group.online}</div>
                          <div className="text-xs text-muted-foreground">Online</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-orange-600">{group.needsPatches}</div>
                          <div className="text-xs text-muted-foreground">Need Patches</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-600">{group.avgCpu}%</div>
                          <div className="text-xs text-muted-foreground">Avg CPU</div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(group.online / group.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patching Tab */}
        <TabsContent value="patching" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Patch Management
                </CardTitle>
                <CardDescription>Update status across all systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {patchingData.map((patch) => (
                  <div key={patch.category} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{patch.category}</h4>
                      <Badge variant="outline">{patch.deployed} deployed</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <div className="font-medium text-red-600">{patch.critical}</div>
                        <div className="text-xs text-muted-foreground">Critical</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                        <div className="font-medium text-orange-600">{patch.important}</div>
                        <div className="text-xs text-muted-foreground">Important</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-medium text-blue-600">{patch.optional}</div>
                        <div className="text-xs text-muted-foreground">Optional</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Patch Scheduling
                </CardTitle>
                <CardDescription>Automated deployment windows</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <h4 className="font-medium text-green-700 dark:text-green-400">Production Schedule</h4>
                  <p className="text-sm text-muted-foreground mt-1">Critical patches: Every Tuesday 2:00 AM</p>
                  <p className="text-sm text-muted-foreground">Regular patches: First Sunday of month</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-medium text-blue-700 dark:text-blue-400">Test Environment</h4>
                  <p className="text-sm text-muted-foreground mt-1">All patches: Every Friday 6:00 PM</p>
                  <p className="text-sm text-muted-foreground">Validation: Weekend testing cycle</p>
                </div>
                <Button className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Patch Windows
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Policies
              </CardTitle>
              <CardDescription>Compliance and enforcement status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(policy.status)}
                        <div>
                          <h4 className="font-medium">{policy.name}</h4>
                          <p className="text-sm text-muted-foreground">Updated {policy.lastUpdate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">{policy.compliance}%</div>
                          <div className="text-xs text-muted-foreground">Compliance</div>
                        </div>
                        <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                          {policy.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={policy.compliance} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Scripts & Automation
              </CardTitle>
              <CardDescription>Automated tasks and their execution status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationScripts.map((script) => (
                  <div key={script.name} className="p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(script.status)}
                        <div>
                          <h4 className="font-medium">{script.name}</h4>
                          <p className="text-sm text-muted-foreground">Last run: {script.lastRun}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{script.success}%</div>
                          <div className="text-xs text-muted-foreground">Success Rate</div>
                        </div>
                        <Badge variant={script.status === 'running' ? 'default' : 'secondary'}>
                          {script.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Next execution: {script.nextRun}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7">
                          <Play className="h-3 w-3 mr-1" />
                          Run Now
                        </Button>
                        <Button size="sm" variant="outline" className="h-7">
                          <Settings className="h-3 w-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
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