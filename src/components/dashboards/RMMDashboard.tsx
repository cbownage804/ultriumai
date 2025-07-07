import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  RefreshCw,
  BarChart3,
  Monitor,
  Shield,
  Download,
  Zap
} from "lucide-react";

// Import refactored components
import { RMMOverview } from "@/components/rmm/RMMOverview";
import { ServerManager } from "@/components/rmm/ServerManager";
import { WorkstationManager } from "@/components/rmm/WorkstationManager";
import { PatchManager } from "@/components/rmm/PatchManager";
import { PolicyManager } from "@/components/rmm/PolicyManager";
import { AutomationManager } from "@/components/rmm/AutomationManager";
import { AddDeviceDialog } from "@/components/rmm/AddDeviceDialog";
import { RealTimeMonitor } from "@/components/rmm/RealTimeMonitor";
import { AlertCenter } from "@/components/rmm/AlertCenter";
import { RemoteAccess } from "@/components/rmm/RemoteAccess";
import { useRMMData } from "@/hooks/useRMMData";

export const RMMDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { 
    devices, 
    customers, 
    tickets, 
    stats, 
    isLoading, 
    getCriticalDevices, 
    getDevicesByType 
  } = useRMMData();

  console.log('Current active tab:', activeTab);

  // Get devices by type for component props
  const serverData = getDevicesByType('server').map(device => ({
    name: device.hostname,
    ip: device.ip_address,
    status: device.status || 'unknown',
    cpu: device.cpu_usage || 0,
    memory: device.memory_usage || 0,
    disk: device.disk_usage || 0,
    uptime: device.last_seen ? `${Math.floor((Date.now() - new Date(device.last_seen).getTime()) / (1000 * 60 * 60 * 24))}d` : '0d',
    lastUser: device.last_logged_user || 'Unknown',
    lastReboot: device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'Unknown',
    installedPrograms: Math.floor(Math.random() * 200) + 50 // Placeholder
  }));

  const workstationData = getDevicesByType('workstation').map(device => ({
    name: device.hostname,
    ip: device.ip_address,
    status: device.status || 'unknown',
    cpu: device.cpu_usage || 0,
    memory: device.memory_usage || 0,
    disk: device.disk_usage || 0,
    department: 'General', // Could be derived from customer or device metadata
    lastUser: device.last_logged_user || 'Unknown',
    lastReboot: device.last_seen ? new Date(device.last_seen).toLocaleDateString() : 'Unknown',
    installedPrograms: Math.floor(Math.random() * 150) + 30 // Placeholder
  }));

  // Mock patching data (would come from patch management system)
  const patchingData = [
    { category: "Security Updates", critical: 8, important: 12, optional: 14, deployed: 67 },
    { category: "Windows Updates", critical: 3, important: 8, optional: 23, deployed: 89 },
    { category: "Application Updates", critical: 2, important: 6, optional: 16, deployed: 45 },
    { category: "Driver Updates", critical: 1, important: 4, optional: 12, deployed: 23 }
  ];

  // Mock policy data (would come from policy management system)
  const policies = [
    { name: "Password Policy", status: "active", compliance: 94, lastUpdate: "2 days ago" },
    { name: "Antivirus Policy", status: "active", compliance: 98, lastUpdate: "1 week ago" },
    { name: "Firewall Rules", status: "active", compliance: 89, lastUpdate: "3 days ago" },
    { name: "USB Restrictions", status: "active", compliance: 87, lastUpdate: "5 days ago" },
    { name: "Software Installation", status: "pending", compliance: 76, lastUpdate: "2 weeks ago" }
  ];

  // Mock automation scripts (would come from automation system)
  const automationScripts = [
    { name: "Daily Backup Check", status: "running", lastRun: "2 min ago", success: 98, nextRun: "Tomorrow 2:00 AM" },
    { name: "Disk Cleanup", status: "scheduled", lastRun: "1 hour ago", success: 95, nextRun: "Sunday 3:00 AM" },
    { name: "Security Scan", status: "running", lastRun: "30 min ago", success: 92, nextRun: "In 4 hours" },
    { name: "Patch Deployment", status: "idle", lastRun: "3 days ago", success: 88, nextRun: "Next Tuesday" },
    { name: "System Health Check", status: "running", lastRun: "5 min ago", success: 96, nextRun: "Every hour" }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading RMM data...</p>
          </div>
        </div>
      </div>
    );
  }

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
            Complete infrastructure monitoring and automated management - Live Data
          </p>
          <div className="text-sm text-muted-foreground mt-1">
            {stats.totalDevices > 0 ? (
              <span className="text-success">Connected to live database • {stats.totalDevices} devices monitored</span>
            ) : (
              <span className="text-muted-foreground">No devices found - Add devices to get started</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <AddDeviceDialog />
        </div>
      </div>

      <RMMOverview stats={stats} onTabChange={(newTab) => {
        console.log('onTabChange called with:', newTab);
        console.log('Current activeTab before change:', activeTab);
        setActiveTab(newTab);
        console.log('setActiveTab called with:', newTab);
      }} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 bg-muted/50 text-xs overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitor" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <BarChart3 className="h-3 w-3 mr-1" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="h-3 w-3 mr-1" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="remote" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Monitor className="h-3 w-3 mr-1" />
            Remote
          </TabsTrigger>
          <TabsTrigger value="servers" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Server className="h-3 w-3 mr-1" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="workstations" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Monitor className="h-3 w-3 mr-1" />
            Stations
          </TabsTrigger>
          <TabsTrigger value="patching" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Download className="h-3 w-3 mr-1" />
            Patches
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Shield className="h-3 w-3 mr-1" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="automation" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            <Zap className="h-3 w-3 mr-1" />
            Scripts
          </TabsTrigger>
        </TabsList>

        {/* Real-Time Monitoring Tab */}
        <TabsContent value="monitor" className="space-y-6">
          <RealTimeMonitor />
        </TabsContent>

        {/* Alert Center Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <AlertCenter />
        </TabsContent>

        {/* Remote Access Tab */}
        <TabsContent value="remote" className="space-y-6">
          <RemoteAccess />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <RMMOverview stats={stats} />
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-6">
          <ServerManager servers={serverData} />
        </TabsContent>

        {/* Workstations Tab */}
        <TabsContent value="workstations" className="space-y-6">
          <WorkstationManager workstations={workstationData} />
        </TabsContent>

        {/* Patching Tab */}
        <TabsContent value="patching" className="space-y-6">
          <PatchManager patchingData={patchingData} />
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <PolicyManager policies={policies} />
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <AutomationManager scripts={automationScripts} />
        </TabsContent>
      </Tabs>
    </div>
  );
};