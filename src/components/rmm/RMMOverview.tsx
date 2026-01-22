import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Server, Activity, Download, Code, CheckCircle, AlertTriangle } from "lucide-react";

interface RMMOverviewProps {
  stats: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    alertsCount: number;
    serversCount: number;
    workstationsCount: number;
    networkDevicesCount: number;
    criticalAlerts: number;
    pendingPatches: number;
    scriptsRunning: number;
  };
  onTabChange?: (tab: string) => void;
}

export const RMMOverview = ({ stats, onTabChange }: RMMOverviewProps) => {
  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card 
          className="border-0 shadow-lg bg-gradient-to-br from-safeops-soft/30 to-safeops-soft/10 dark:from-safeops-soft dark:to-safeops-soft/50 cursor-pointer hover:shadow-xl transition-shadow duration-200"
          onClick={() => {
            console.log('Total Devices card clicked - switching to monitor tab');
            onTabChange?.('monitor');
            console.log('After onTabChange called');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-5 w-5 text-safeops" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-safeops">{stats.totalDevices}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-safeops">
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

        <Card className="border-0 shadow-lg bg-gradient-to-br from-safeops-soft/30 to-safeops-soft/10 dark:from-safeops-soft dark:to-safeops-soft/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-5 w-5 text-safeops" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-safeops">
              {stats.totalDevices > 0 ? Math.round((stats.onlineDevices / stats.totalDevices) * 100) : 0}%
            </div>
            <p className="text-xs text-safeops-muted mt-2">Excellent uptime</p>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 cursor-pointer hover:shadow-xl transition-shadow duration-200"
          onClick={() => {
            console.log('Pending Patches card clicked - switching to patching tab');
            onTabChange?.('patching');
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Patches</CardTitle>
            <Download className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingPatches}</div>
            <p className="text-xs text-orange-600 mt-2">Across all devices</p>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-lg bg-gradient-to-br from-safeops-soft/30 to-safeops-soft/10 dark:from-safeops-soft dark:to-safeops-soft/50 cursor-pointer hover:shadow-xl transition-shadow duration-200"
          onClick={() => onTabChange?.('automation')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scripts</CardTitle>
            <Code className="h-5 w-5 text-safeops" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-safeops">{stats.scriptsRunning}</div>
            <p className="text-xs text-safeops-muted mt-2">Automation running</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Categories and Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-safeops" />
              Device Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div 
              className="flex items-center justify-between p-3 bg-safeops-soft/30 dark:bg-safeops-soft rounded-lg cursor-pointer hover:bg-safeops-soft/50 dark:hover:bg-safeops-soft/80 transition-colors duration-200"
              onClick={() => onTabChange?.('servers')}
            >
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-safeops" />
                <div>
                  <p className="font-medium">Servers</p>
                  <p className="text-sm text-muted-foreground">{stats.serversCount} devices</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-safeops" />
            </div>
            <div 
              className="flex items-center justify-between p-3 bg-safeops-soft/20 dark:bg-safeops-soft/50 rounded-lg cursor-pointer hover:bg-safeops-soft/40 dark:hover:bg-safeops-soft/70 transition-colors duration-200"
              onClick={() => onTabChange?.('workstations')}
            >
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-safeops-dark" />
                <div>
                  <p className="font-medium">Workstations</p>
                  <p className="text-sm text-muted-foreground">{stats.workstationsCount} devices</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-safeops-dark" />
            </div>
            <div 
              className="flex items-center justify-between p-3 bg-safeops-soft/10 dark:bg-safeops-soft/30 rounded-lg cursor-pointer hover:bg-safeops-soft/30 dark:hover:bg-safeops-soft/50 transition-colors duration-200"
              onClick={() => onTabChange?.('monitor')}
            >
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-safeops-muted" />
                <div>
                  <p className="font-medium">Network Devices</p>
                  <p className="text-sm text-muted-foreground">{stats.networkDevicesCount} devices</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-safeops-muted" />
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
    </>
  );
};