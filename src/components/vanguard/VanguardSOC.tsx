import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Eye, 
  AlertTriangle, 
  Shield, 
  Activity, 
  Clock, 
  Target, 
  Users, 
  Server,
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react";

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  source: string;
  timestamp: string;
  assignedTo?: string;
  responseTime?: number;
}

interface IncidentMetrics {
  totalAlerts: number;
  activeIncidents: number;
  resolvedToday: number;
  avgResponseTime: number;
  threatsBlocked: number;
  falsePositives: number;
}

export const VanguardSOC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");

  // Mock data
  const metrics: IncidentMetrics = {
    totalAlerts: 847,
    activeIncidents: 7,
    resolvedToday: 23,
    avgResponseTime: 1.8, // minutes
    threatsBlocked: 156,
    falsePositives: 12
  };

  const recentAlerts: SecurityAlert[] = [
    {
      id: "1",
      title: "Suspicious Login Activity",
      description: "Multiple failed login attempts from unusual geographic location",
      severity: "high",
      status: "investigating",
      source: "Azure AD",
      timestamp: "2 minutes ago",
      assignedTo: "Sarah Chen",
      responseTime: 45
    },
    {
      id: "2",
      title: "Malware Detection",
      description: "Potential malware detected on endpoint LAPTOP-ABC123",
      severity: "critical",
      status: "new",
      source: "EDR",
      timestamp: "5 minutes ago"
    },
    {
      id: "3",
      title: "Data Exfiltration Attempt",
      description: "Large data transfer to external IP detected",
      severity: "critical",
      status: "investigating",
      source: "Network Monitor",
      timestamp: "12 minutes ago",
      assignedTo: "Mike Rodriguez",
      responseTime: 120
    },
    {
      id: "4",
      title: "Privilege Escalation",
      description: "User attempting to access admin resources",
      severity: "medium",
      status: "resolved",
      source: "SIEM",
      timestamp: "1 hour ago",
      assignedTo: "Lisa Park"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-red-500 text-white';
      case 'investigating': return 'bg-blue-500 text-white';
      case 'resolved': return 'bg-green-500 text-white';
      case 'false_positive': return 'bg-gray-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'false_positive': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Eye className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Security Operations Center (SOC)</h2>
          <p className="text-muted-foreground">24/7 threat monitoring, detection, and incident response</p>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.avgResponseTime}m</div>
            <p className="text-xs text-muted-foreground">Average response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.threatsBlocked}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.resolvedToday}</div>
            <p className="text-xs text-muted-foreground">Incidents closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">False Positives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.falsePositives}</div>
            <p className="text-xs text-muted-foreground">Tuning needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Threats Alert */}
      {metrics.activeIncidents > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{metrics.activeIncidents} active security incidents</strong> require immediate attention. 
            Critical threats detected in the last hour.
          </AlertDescription>
        </Alert>
      )}

      {/* Security Alerts Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Live Security Alerts</CardTitle>
              <CardDescription>Real-time threat detection and incident monitoring</CardDescription>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24h</option>
                <option value="7d">Last Week</option>
              </select>
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(alert.status)}
                      <h3 className="font-semibold">{alert.title}</h3>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge className={getStatusColor(alert.status)}>
                        {alert.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Source: {alert.source}</span>
                      <span>Time: {alert.timestamp}</span>
                      {alert.assignedTo && <span>Assigned: {alert.assignedTo}</span>}
                      {alert.responseTime && <span>Response: {alert.responseTime}s</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Investigate</Button>
                    <Button variant="outline" size="sm">Escalate</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SOC Team Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              SOC Team Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-2 border rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Sarah Chen</span>
                <Badge variant="outline">L3 Analyst</Badge>
              </div>
              <span className="text-sm text-muted-foreground">3 active cases</span>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">Mike Rodriguez</span>
                <Badge variant="outline">L2 Analyst</Badge>
              </div>
              <span className="text-sm text-muted-foreground">2 active cases</span>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Lisa Park</span>
                <Badge variant="outline">L1 Analyst</Badge>
              </div>
              <span className="text-sm text-muted-foreground">Break (15 min)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span>SIEM Platform</span>
              <Badge className="bg-green-500 text-white">Operational</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>EDR Agents</span>
              <Badge className="bg-green-500 text-white">97% Connected</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Network Sensors</span>
              <Badge className="bg-green-500 text-white">All Online</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Threat Intel Feeds</span>
              <Badge className="bg-yellow-500 text-white">1 Delayed</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Backup Systems</span>
              <Badge className="bg-green-500 text-white">Ready</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};