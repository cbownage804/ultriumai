import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Clock, 
  Users,
  Server,
  Database,
  Wifi,
  Cpu,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Zap
} from "lucide-react";
import { usePerformanceAnalytics } from "@/hooks/usePerformanceAnalytics";

interface PerformanceAnalyticsProps {
  timeRange: string;
}

export const PerformanceAnalytics = ({ timeRange }: PerformanceAnalyticsProps) => {
  const { data: performanceData, loading } = usePerformanceAnalytics(timeRange);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return 'text-green-600';
    if (load < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 99.5) return 'text-green-600';
    if (availability >= 99) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">System Uptime</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{performanceData.systemHealth.uptime}%</p>
            <p className="text-xs text-muted-foreground">+0.02% from last period</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Avg Response Time</span>
            </div>
            <p className="text-2xl font-bold">{performanceData.systemHealth.responseTime}ms</p>
            <p className="text-xs text-green-600">-23ms from last period</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Throughput</span>
            </div>
            <p className="text-2xl font-bold">{performanceData.systemHealth.throughput.toLocaleString()}</p>
            <p className="text-xs text-green-600">+12% from last period</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Error Rate</span>
            </div>
            <p className="text-2xl font-bold">{performanceData.systemHealth.errorRate}%</p>
            <p className="text-xs text-green-600">-0.05% from last period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
            <CardDescription>Current system resource usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className={`font-bold ${getLoadColor(performanceData.resourceUtilization.cpu)}`}>
                  {performanceData.resourceUtilization.cpu}%
                </span>
              </div>
              <Progress value={performanceData.resourceUtilization.cpu} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className={`font-bold ${getLoadColor(performanceData.resourceUtilization.memory)}`}>
                  {performanceData.resourceUtilization.memory}%
                </span>
              </div>
              <Progress value={performanceData.resourceUtilization.memory} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <span className={`font-bold ${getLoadColor(performanceData.resourceUtilization.disk)}`}>
                  {performanceData.resourceUtilization.disk}%
                </span>
              </div>
              <Progress value={performanceData.resourceUtilization.disk} className="h-2" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Network Usage</span>
                </div>
                <span className={`font-bold ${getLoadColor(performanceData.resourceUtilization.network)}`}>
                  {performanceData.resourceUtilization.network}%
                </span>
              </div>
              <Progress value={performanceData.resourceUtilization.network} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Metrics</CardTitle>
            <CardDescription>User engagement and session analytics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <p className="text-xl font-bold">{performanceData.userActivity.activeUsers.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Peak Users</span>
                </div>
                <p className="text-xl font-bold">{performanceData.userActivity.peakUsers.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Avg Session</span>
                </div>
                <p className="text-xl font-bold">{performanceData.userActivity.avgSessionDuration}m</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Bounce Rate</span>
                </div>
                <p className="text-xl font-bold">{performanceData.userActivity.bounceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle>System Components Status</CardTitle>
          <CardDescription>Health and performance of system components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.systemComponents.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Server className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-semibold">{component.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Load: {component.load}% • Response: {component.responseTime}ms
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getLoadColor(component.load)}`}>
                      {component.load}%
                    </div>
                    <div className="text-xs text-muted-foreground">Load</div>
                  </div>
                  <Badge className={getStatusColor(component.status)}>
                    {component.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Application Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Application Service Metrics</CardTitle>
          <CardDescription>Availability and performance of application services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceData.applicationMetrics.map((app, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{app.name}</h4>
                  <span className={`text-lg font-bold ${getAvailabilityColor(app.availability)}`}>
                    {app.availability}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Availability</span>
                    <span className="font-medium">{app.availability}%</span>
                  </div>
                  <Progress value={app.availability} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Errors: {app.errors}</span>
                    <span>Requests: {app.requests.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};