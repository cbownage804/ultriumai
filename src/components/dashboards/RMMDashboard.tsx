import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Activity, Wifi, HardDrive, Cpu, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export const RMMDashboard = () => {
  // Mock data - replace with real data from your RMM service
  const stats = {
    totalDevices: 247,
    onlineDevices: 231,
    offlineDevices: 16,
    alertsCount: 8,
  };

  const recentAlerts = [
    { id: 1, device: "SERVER-01", type: "High CPU Usage", severity: "critical", time: "5 min ago" },
    { id: 2, device: "WS-MARKETING-12", type: "Low Disk Space", severity: "warning", time: "12 min ago" },
    { id: 3, device: "ROUTER-MAIN", type: "Connection Timeout", severity: "high", time: "1 hour ago" },
  ];

  const deviceStatus = [
    { category: "Servers", total: 12, online: 11, offline: 1 },
    { category: "Workstations", total: 185, online: 178, offline: 7 },
    { category: "Network Devices", total: 50, online: 42, offline: 8 },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Server className="h-8 w-8 text-primary" />
            Remote Monitoring & Management
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage all devices in your network
          </p>
        </div>
        <Button>
          <Server className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Managed endpoints
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onlineDevices}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.onlineDevices / stats.totalDevices) * 100)}% uptime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.offlineDevices}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.alertsCount}</div>
            <p className="text-xs text-muted-foreground">
              Require action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Device Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Device Categories</CardTitle>
          <CardDescription>Overview of managed device types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deviceStatus.map((category) => (
              <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Server className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{category.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      {category.total} total devices
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600">{category.online}</div>
                    <div className="text-xs text-muted-foreground">Online</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-600">{category.offline}</div>
                    <div className="text-xs text-muted-foreground">Offline</div>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(category.online / category.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>Latest system alerts requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle 
                    className={`h-4 w-4 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                    }`} 
                  />
                  <div>
                    <p className="font-medium">{alert.device}</p>
                    <p className="text-sm text-muted-foreground">{alert.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    alert.severity === 'critical' ? 'destructive' :
                    alert.severity === 'high' ? 'default' : 'secondary'
                  }>
                    {alert.severity}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {alert.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};