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
}

export const RMMOverview = ({ stats }: RMMOverviewProps) => {
  return (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Device Categories and Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                <Server className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-medium">Workstations</p>
                  <p className="text-sm text-muted-foreground">{stats.workstationsCount} devices</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-purple-600" />
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
    </>
  );
};