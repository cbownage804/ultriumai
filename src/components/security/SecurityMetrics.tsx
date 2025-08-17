import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Activity, Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export const SecurityMetrics = () => {
  // Mock security metrics data
  const metrics = {
    securityScore: 87,
    threatDetectionRate: 98.5,
    responseTime: 2.3, // hours
    incidentsResolved: 94.2,
    vulnerabilitiesPatched: 89,
    complianceScore: 91
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Metrics Dashboard</CardTitle>
        <CardDescription>Real-time security performance indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Security Score */}
        <div className="text-center p-4 border rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Overall Security Score</h3>
          </div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.securityScore)}`}>
            {metrics.securityScore}/100
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor(metrics.securityScore)}`}
              style={{ width: `${metrics.securityScore}%` }}
            ></div>
          </div>
          <Badge variant={metrics.securityScore >= 90 ? "default" : metrics.securityScore >= 75 ? "secondary" : "destructive"} className="mt-2">
            {metrics.securityScore >= 90 ? "Excellent" : metrics.securityScore >= 75 ? "Good" : "Needs Improvement"}
          </Badge>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Threat Detection Rate</span>
              </div>
              <span className="text-sm font-bold text-green-500">{metrics.threatDetectionRate}%</span>
            </div>
            <Progress value={metrics.threatDetectionRate} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Avg Response Time</span>
              </div>
              <span className="text-sm font-bold">{metrics.responseTime}h</span>
            </div>
            <Progress value={100 - (metrics.responseTime * 10)} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Incidents Resolved</span>
              </div>
              <span className="text-sm font-bold text-green-500">{metrics.incidentsResolved}%</span>
            </div>
            <Progress value={metrics.incidentsResolved} className="h-2" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Vulnerabilities Patched</span>
              </div>
              <span className="text-sm font-bold">{metrics.vulnerabilitiesPatched}%</span>
            </div>
            <Progress value={metrics.vulnerabilitiesPatched} className="h-2" />
          </div>
        </div>

        {/* Security Health Indicators */}
        <div className="space-y-3">
          <h4 className="font-medium">Security Health Indicators</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-2 border rounded">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">Firewall Status</div>
                <div className="text-xs text-green-600">Active & Updated</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 border rounded">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-sm font-medium">SSL Certificates</div>
                <div className="text-xs text-green-600">Valid (87 days left)</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 border rounded">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <div className="text-sm font-medium">Backup Status</div>
                <div className="text-xs text-yellow-600">Last: 2 days ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="p-3 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Compliance Score</h4>
            <span className={`font-bold ${getScoreColor(metrics.complianceScore)}`}>
              {metrics.complianceScore}%
            </span>
          </div>
          <Progress value={metrics.complianceScore} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>GDPR: Compliant</span>
            <span>ISO 27001: 89%</span>
            <span>SOC 2: Pending</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-2">
          <h4 className="font-medium">Recent Security Activity</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Vulnerability scan completed - 2 critical issues resolved</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Activity className="h-3 w-3" />
              <span>Security policies updated - Access control enhanced</span>
            </div>
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              <span>3 medium-priority findings require attention</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};