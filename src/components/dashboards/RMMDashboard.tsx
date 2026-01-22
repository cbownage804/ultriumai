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
import { useRMMDevices } from "@/hooks/useRMMDevices";

export const RMMDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { 
    devices, 
    isLoading, 
    getCriticalDevices, 
    getDevicesByType,
    getDeviceStats
  } = useRMMDevices();

  const deviceStats = getDeviceStats();
  
  // Transform stats to match RMMOverview expectations
  const stats = {
    totalDevices: deviceStats.total,
    onlineDevices: deviceStats.online,
    offlineDevices: deviceStats.offline,
    alertsCount: deviceStats.critical,
    serversCount: deviceStats.servers,
    workstationsCount: deviceStats.workstations,
    networkDevicesCount: 0, // placeholder
    criticalAlerts: deviceStats.critical,
    pendingPatches: 0, // placeholder
    scriptsRunning: 0, // placeholder
  };
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
    installedPrograms: 0 // Will be populated from software inventory
  }));

  // Empty patching data - will be populated from real patch management when available
  const patchingData: Array<{ category: string; critical: number; important: number; optional: number; deployed: number }> = [];

  // Empty policy data - will be populated from real policy management when available
  const policies: Array<{ name: string; status: string; compliance: number; lastUpdate: string }> = [];

  // Empty automation scripts - will be populated from real automation system when available
  const automationScripts: Array<{ name: string; status: string; lastRun: string; success: number; nextRun: string }> = [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-safeops-soft/20">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-safeops" />
            <p className="text-muted-foreground">Loading SafeOps data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-background via-background to-safeops-soft/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 bg-gradient-to-r from-safeops to-safeops-glow bg-clip-text text-transparent">
            <Server className="h-10 w-10 text-safeops" />
            SafeOps RMM
          </h1>
          <div className="text-lg text-muted-foreground mt-2">
            Complete infrastructure monitoring and automated management - Live Data
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {stats.totalDevices > 0 ? (
              <span className="text-safeops">Connected to live database • {stats.totalDevices} devices monitored</span>
            ) : (
              <span className="text-muted-foreground">No devices found - Add devices to get started</span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-safeops/20 hover:bg-safeops/5 hover:text-safeops">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
          <Button 
            variant="outline" 
            className="border-safeops/20 hover:bg-safeops/5 hover:text-safeops"
            onClick={() => {
              console.log('Starting RMM Agent download...');
              
            // Download the GUI installer file
            const link = document.createElement('a');
            link.href = '/UltriumRMMAgent-GUI-Installer.ps1';
            link.download = 'UltriumRMMAgent-GUI-Installer.ps1';
            link.click();
              console.log('✅ Full installer download completed');
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Agent
          </Button>
          <AddDeviceDialog />
        </div>
      </div>


      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 bg-muted/50 text-xs overflow-x-auto">
          <TabsTrigger value="overview" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <BarChart3 className="h-3 w-3 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="monitor" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <BarChart3 className="h-3 w-3 mr-1" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <Shield className="h-3 w-3 mr-1" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="remote" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <Monitor className="h-3 w-3 mr-1" />
            Remote
          </TabsTrigger>
          <TabsTrigger value="servers" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <Server className="h-3 w-3 mr-1" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="workstations" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <Monitor className="h-3 w-3 mr-1" />
            Stations
          </TabsTrigger>
          <TabsTrigger value="patching" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <Download className="h-3 w-3 mr-1" />
            Patches
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
            <Shield className="h-3 w-3 mr-1" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="automation" className="data-[state=active]:bg-safeops data-[state=active]:text-safeops-foreground">
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