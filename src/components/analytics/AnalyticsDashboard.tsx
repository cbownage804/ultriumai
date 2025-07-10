import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Activity,
  TrendingUp,
  Target
} from "lucide-react";

interface AnalyticsDashboardProps {
  timeRange: string;
}

export const AnalyticsDashboard = ({ timeRange }: AnalyticsDashboardProps) => {
  // TODO: Replace with real analytics data from Supabase
  const dashboardData = {
    securityOverview: {
      threatsPrevented: 0,
      incidentsResolved: 0,
      vulnerabilitiesPatched: 0,
      securityScore: 0
    },
    systemHealth: [],
    recentAlerts: [],
    complianceStatus: []
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'compliant': case 'completed': return 'bg-green-100 text-green-800';
      case 'warning': case 'minor_gaps': case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'critical': case 'non_compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-green-500" />
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{dashboardData.securityOverview.threatsPrevented.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Threats Prevented</p>
              <p className="text-xs text-green-600 font-medium">+12% vs last week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{dashboardData.securityOverview.incidentsResolved}</p>
              <p className="text-xs text-muted-foreground">Incidents Resolved</p>
              <p className="text-xs text-blue-600 font-medium">+8% vs last week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-500" />
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{dashboardData.securityOverview.vulnerabilitiesPatched}</p>
              <p className="text-xs text-muted-foreground">Vulnerabilities Patched</p>
              <p className="text-xs text-purple-600 font-medium">+15% vs last week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">{dashboardData.securityOverview.securityScore}%</p>
                <p className="text-xs text-muted-foreground">Security Score</p>
              </div>
            </div>
            <Progress value={dashboardData.securityOverview.securityScore} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Overview</CardTitle>
            <CardDescription>Real-time status of security components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.systemHealth.map((system, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{system.name}</p>
                    <p className="text-sm text-muted-foreground">Uptime: {system.uptime}%</p>
                  </div>
                </div>
                <Badge className={getStatusColor(system.status)}>
                  {system.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Security Alerts</CardTitle>
            <CardDescription>Latest security events and responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                {getAlertIcon(alert.type)}
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getStatusColor(alert.status)} variant="outline">
                      {alert.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Framework Status</CardTitle>
          <CardDescription>Current compliance scores across all frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardData.complianceStatus.map((framework, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{framework.framework}</h4>
                  <Badge className={getStatusColor(framework.status)}>
                    {framework.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Score</span>
                    <span className="font-medium">{framework.score}%</span>
                  </div>
                  <Progress value={framework.score} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};