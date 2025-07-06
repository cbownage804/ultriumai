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
    { 
      name: "DC-PRIMARY", 
      ip: "192.168.1.10", 
      status: "online", 
      cpu: 45, 
      memory: 78, 
      disk: 65, 
      uptime: "30d 14h",
      lastUser: "Administrator",
      lastReboot: "2 days ago",
      installedPrograms: 127
    },
    { 
      name: "EXCHANGE-01", 
      ip: "192.168.1.15", 
      status: "online", 
      cpu: 62, 
      memory: 84, 
      disk: 72, 
      uptime: "28d 6h",
      lastUser: "SYSTEM",
      lastReboot: "4 hours ago",
      installedPrograms: 89
    },
    { 
      name: "FILE-SERVER", 
      ip: "192.168.1.20", 
      status: "warning", 
      cpu: 89, 
      memory: 91, 
      disk: 88, 
      uptime: "15d 3h",
      lastUser: "fileadmin",
      lastReboot: "15 minutes ago",
      installedPrograms: 156
    },
    { 
      name: "DB-SERVER", 
      ip: "192.168.1.25", 
      status: "online", 
      cpu: 34, 
      memory: 67, 
      disk: 55, 
      uptime: "45d 12h",
      lastUser: "dbadmin",
      lastReboot: "just now",
      installedPrograms: 73
    }
  ];

  const workstationData = [
    { 
      name: "SALES-PC-01", 
      ip: "192.168.2.15", 
      status: "online", 
      cpu: 35, 
      memory: 62, 
      disk: 45, 
      department: "Sales",
      lastUser: "john.smith",
      lastReboot: "3 hours ago",
      installedPrograms: 89
    },
    { 
      name: "MARKETING-WS-03", 
      ip: "192.168.2.28", 
      status: "online", 
      cpu: 42, 
      memory: 58, 
      disk: 67, 
      department: "Marketing",
      lastUser: "jane.doe",
      lastReboot: "1 day ago",
      installedPrograms: 134
    },
    { 
      name: "IT-ADMIN-PC", 
      ip: "192.168.2.10", 
      status: "online", 
      cpu: 28, 
      memory: 45, 
      disk: 34, 
      department: "IT",
      lastUser: "admin.user",
      lastReboot: "just now",
      installedPrograms: 267
    },
    { 
      name: "EXEC-LAPTOP-01", 
      ip: "192.168.2.5", 
      status: "warning", 
      cpu: 78, 
      memory: 89, 
      disk: 23, 
      department: "Executive",
      lastUser: "ceo.smith",
      lastReboot: "2 weeks ago",
      installedPrograms: 45
    }
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
          <AddDeviceDialog />
        </div>
      </div>

      <RMMOverview stats={stats} />

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