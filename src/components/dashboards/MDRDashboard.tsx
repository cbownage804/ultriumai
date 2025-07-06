import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, Shield, Activity, Clock, CheckCircle, XCircle } from "lucide-react";

export const MDRDashboard = () => {
  // Mock data - replace with real MDR service data
  const stats = {
    threatsDetected: 142,
    threatsBlocked: 138,
    activeIncidents: 4,
    lastScanTime: "2 minutes ago",
  };

  const recentThreats = [
    { id: 1, type: "Malware", source: "email attachment", status: "blocked", severity: "high", time: "3 min ago" },
    { id: 2, type: "Phishing", source: "suspicious link", status: "quarantined", severity: "medium", time: "15 min ago" },
    { id: 3, type: "Ransomware", source: "file download", status: "blocked", severity: "critical", time: "1 hour ago" },
  ];

  const threatCategories = [
    { category: "Malware", count: 67, blocked: 65, color: "text-red-600" },
    { category: "Phishing", count: 43, blocked: 41, color: "text-orange-600" },
    { category: "Suspicious Activity", count: 32, blocked: 32, color: "text-yellow-600" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Eye className="h-8 w-8 text-primary" />
            Managed Detection & Response
          </h1>
          <p className="text-muted-foreground">
            AI-powered threat detection and automated response
          </p>
        </div>
        <Button>
          <Activity className="h-4 w-4 mr-2" />
          Run Full Scan
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.threatsDetected}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.threatsBlocked}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.threatsBlocked / stats.threatsDetected) * 100)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.activeIncidents}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">✓</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastScanTime}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Threat Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Threat Categories</CardTitle>
          <CardDescription>Breakdown of detected threats by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threatCategories.map((category) => (
              <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{category.category}</h4>
                    <p className="text-sm text-muted-foreground">
                      {category.count} total detections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-600">{category.blocked}</div>
                    <div className="text-xs text-muted-foreground">Blocked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-red-600">{category.count - category.blocked}</div>
                    <div className="text-xs text-muted-foreground">Investigating</div>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(category.blocked / category.count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Threats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recent Threat Activity
          </CardTitle>
          <CardDescription>Latest threats detected and actions taken</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentThreats.map((threat) => (
              <div key={threat.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    {threat.status === 'blocked' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{threat.type}</p>
                    <p className="text-sm text-muted-foreground">
                      Source: {threat.source}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    threat.severity === 'critical' ? 'destructive' :
                    threat.severity === 'high' ? 'default' : 'secondary'
                  }>
                    {threat.severity}
                  </Badge>
                  <Badge variant={threat.status === 'blocked' ? 'default' : 'secondary'}>
                    {threat.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {threat.time}
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