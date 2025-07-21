import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Network, 
  AlertTriangle, 
  Activity, 
  Monitor,
  Server,
  Laptop,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";
import { NetworkDevice } from "@/hooks/useSafeNet";

interface NetworkStatisticsProps {
  devices: NetworkDevice[];
}

export const NetworkStatistics = ({ devices }: NetworkStatisticsProps) => {
  // Calculate statistics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const offlineDevices = totalDevices - onlineDevices;
  const managedDevices = devices.filter(d => d.is_managed).length;
  const criticalDevices = devices.filter(d => d.is_critical).length;
  const vulnerableDevices = devices.filter(d => (d.vulnerability_count || 0) > 0).length;
  const totalVulnerabilities = devices.reduce((sum, d) => sum + (d.vulnerability_count || 0), 0);
  
  // Device type breakdown
  const deviceTypes = devices.reduce((acc, device) => {
    const type = device.device_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // OS breakdown
  const osFamilies = devices.reduce((acc, device) => {
    const os = device.os_family || device.os_version || 'unknown';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Network segments
  const networkSegments = devices.reduce((acc, device) => {
    const segment = device.network_segment || 'unknown';
    acc[segment] = (acc[segment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate security score
  const securityScore = Math.max(0, 100 - (vulnerableDevices * 10) - (criticalDevices * 15) - ((totalDevices - managedDevices) * 5));

  // Get device type icon
  const getDeviceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'server': return Server;
      case 'laptop': return Laptop;
      case 'workstation': case 'computer': return Monitor;
      case 'mobile': case 'phone': return Smartphone;
      default: return Monitor;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Health</CardTitle>
            <Shield className={`h-4 w-4 ${securityScore > 80 ? 'text-green-500' : securityScore > 60 ? 'text-yellow-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}%</div>
            <div className="space-y-2 mt-2">
              <Progress value={securityScore} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {managedDevices}/{totalDevices} devices managed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-500">{onlineDevices}</div>
              <div className="text-2xl font-bold text-red-500">{offlineDevices}</div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Online</span>
              <span>Offline</span>
            </div>
            <Progress value={(onlineDevices / totalDevices) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Issues</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${totalVulnerabilities > 10 ? 'text-red-500' : totalVulnerabilities > 5 ? 'text-yellow-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVulnerabilities}</div>
            <p className="text-xs text-muted-foreground">
              {vulnerableDevices} devices affected
            </p>
            {criticalDevices > 0 && (
              <Badge variant="destructive" className="text-xs mt-2">
                {criticalDevices} critical
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discovery Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Total devices discovered
            </p>
            <div className="flex items-center mt-2 text-xs">
              <Activity className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">Active scanning</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(deviceTypes).map(([type, count]) => {
                const Icon = getDeviceTypeIcon(type);
                const percentage = (count / totalDevices) * 100;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize">{type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Operating Systems */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operating Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(osFamilies).map(([os, count]) => {
                const percentage = (count / totalDevices) * 100;
                return (
                  <div key={os} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{os}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Network Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Network Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(networkSegments).map(([segment, count]) => {
                const percentage = (count / totalDevices) * 100;
                return (
                  <div key={segment} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">{segment}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {count} devices
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};