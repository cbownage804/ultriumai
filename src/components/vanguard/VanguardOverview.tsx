import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Bug, AlertTriangle, CheckCircle, TrendingUp, Network, Eye } from "lucide-react";

interface SecurityMetrics {
  totalScans: number;
  criticalIssues: number;
  highPriorityIssues: number;
  totalFindings: number;
  agentCount: number;
  onlineAgentCount: number;
}

interface VanguardOverviewProps {
  metrics: SecurityMetrics;
}

export const VanguardOverview = ({ metrics }: VanguardOverviewProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Core Security Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Agents</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.agentCount}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.onlineAgentCount} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Bug className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.highPriorityIssues}</div>
            <p className="text-xs text-muted-foreground">
              High severity findings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Findings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFindings}</div>
            <p className="text-xs text-muted-foreground">
              All severity levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Security Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Threat Detection</CardTitle>
            </div>
            <CardDescription>AI-powered vulnerability scanning & analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Critical Issues</span>
                <Badge variant="destructive">{metrics.criticalIssues}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">High Priority</span>
                <Badge className="bg-orange-500 text-white">{metrics.highPriorityIssues}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Scans</span>
                <span className="text-sm font-medium">{metrics.totalScans}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">SOC Operations</CardTitle>
            </div>
            <CardDescription>24/7 security monitoring & incident response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Alerts</span>
                <Badge className="bg-blue-500 text-white">{metrics.criticalIssues + metrics.highPriorityIssues}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Findings</span>
                <span className="text-sm font-medium">{metrics.totalFindings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Scans Completed</span>
                <span className="text-sm font-medium">{metrics.totalScans}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Network Security</CardTitle>
            </div>
            <CardDescription>Internal network scanning & agent monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Agents</span>
                <Badge className="bg-purple-500 text-white">{metrics.onlineAgentCount} Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Agents</span>
                <span className="text-sm font-medium">{metrics.agentCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Vulnerabilities</span>
                <span className="text-sm font-medium">{metrics.totalFindings}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Compliance</CardTitle>
            </div>
            <CardDescription>Regulatory compliance & audit management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Status</span>
                <Badge variant="outline">Pending Setup</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Frameworks</span>
                <span className="text-sm font-medium text-muted-foreground">Not configured</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Controls</span>
                <span className="text-sm font-medium text-muted-foreground">—</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-500" />
              <CardTitle className="text-lg">Analytics & Reports</CardTitle>
            </div>
            <CardDescription>Security intelligence & executive reporting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Risk Score</span>
                <Badge className={metrics.criticalIssues > 0 ? "bg-red-500 text-white" : metrics.highPriorityIssues > 0 ? "bg-orange-500 text-white" : "bg-green-500 text-white"}>
                  {metrics.criticalIssues > 0 ? "High" : metrics.highPriorityIssues > 0 ? "Medium" : "Low"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Issues</span>
                <span className="text-sm font-medium">{metrics.criticalIssues + metrics.highPriorityIssues}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Scans</span>
                <span className="text-sm font-medium">{metrics.totalScans}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
