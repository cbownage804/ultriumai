import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Bug, AlertTriangle, CheckCircle, TrendingUp, Users, Lock, Network, Eye } from "lucide-react";

interface SecurityMetrics {
  totalScans: number;
  criticalIssues: number;
  highPriorityIssues: number;
  totalFindings: number;
  assetsProtected: number;
  threatsBlocked: number;
  complianceScore: number;
  networkCoverage: number;
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
            <CardTitle className="text-sm font-medium">Assets Protected</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.assetsProtected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Endpoints, servers, networks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.threatsBlocked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.complianceScore}%</div>
            <p className="text-xs text-muted-foreground">
              SOC2, HIPAA, PCI compliance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Coverage</CardTitle>
            <Network className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.networkCoverage}%</div>
            <p className="text-xs text-muted-foreground">
              Internal network visibility
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

        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Identity & Access</CardTitle>
            </div>
            <CardDescription>Password management & authentication security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Passwords Secured</span>
                <span className="text-sm font-medium">1,247</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">2FA Enabled</span>
                <Badge className="bg-green-500 text-white">94%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Weak Passwords</span>
                <Badge variant="outline">12</Badge>
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
                <Badge className="bg-blue-500 text-white">7</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Response Time</span>
                <span className="text-sm font-medium">&lt; 2min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Incidents Resolved</span>
                <span className="text-sm font-medium">342</span>
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
            <CardDescription>Internal network scanning & penetration testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Network Agents</span>
                <Badge className="bg-purple-500 text-white">5 Online</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Last Pen Test</span>
                <span className="text-sm font-medium">2 days ago</span>
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
                <span className="text-sm">SOC2 Status</span>
                <Badge className="bg-green-500 text-white">Compliant</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Next Audit</span>
                <span className="text-sm font-medium">45 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Controls</span>
                <span className="text-sm font-medium">187/195</span>
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
                <Badge className="bg-teal-500 text-white">Low</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Trend</span>
                <span className="text-sm font-medium text-green-600">↓ Improving</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Reports Generated</span>
                <span className="text-sm font-medium">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};