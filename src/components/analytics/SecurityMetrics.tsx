import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  AlertTriangle, 
  Eye,
  Bug,
  Lock,
  Network,
  Server,
  Globe
} from "lucide-react";

interface SecurityMetricsProps {
  timeRange: string;
}

export const SecurityMetrics = ({ timeRange }: SecurityMetricsProps) => {
  // Mock security data - replace with actual metrics
  const securityData = {
    threatDetection: {
      malwareDetected: 127,
      phishingBlocked: 89,
      intrusionAttempts: 34,
      suspiciousActivities: 156
    },
    vulnerabilityManagement: {
      critical: 2,
      high: 8,
      medium: 23,
      low: 45,
      totalScanned: 1247
    },
    networkSecurity: {
      firewallBlocks: 2847,
      dnsFiltering: 1923,
      vpnConnections: 234,
      bandwidthUsage: 78
    },
    endpointProtection: [
      { name: 'Windows Endpoints', protected: 456, total: 467, percentage: 97.6 },
      { name: 'macOS Endpoints', protected: 123, total: 125, percentage: 98.4 },
      { name: 'Linux Servers', protected: 89, total: 89, percentage: 100 },
      { name: 'Mobile Devices', protected: 234, total: 245, percentage: 95.5 }
    ],
    incidentResponse: [
      { type: 'Malware', count: 12, avgResolutionTime: '4.2h', status: 'resolved' },
      { type: 'Phishing', count: 8, avgResolutionTime: '2.1h', status: 'resolved' },
      { type: 'Data Breach', count: 1, avgResolutionTime: '12.5h', status: 'investigating' },
      { type: 'Unauthorized Access', count: 5, avgResolutionTime: '6.8h', status: 'resolved' }
    ]
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProtectionColor = (percentage: number) => {
    if (percentage >= 98) return 'text-green-600';
    if (percentage >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Threat Detection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Bug className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">Malware Detected</span>
            </div>
            <p className="text-2xl font-bold">{securityData.threatDetection.malwareDetected}</p>
            <p className="text-xs text-muted-foreground">+23% from last period</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">Phishing Blocked</span>
            </div>
            <p className="text-2xl font-bold">{securityData.threatDetection.phishingBlocked}</p>
            <p className="text-xs text-muted-foreground">-12% from last period</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Network className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">Intrusion Attempts</span>
            </div>
            <p className="text-2xl font-bold">{securityData.threatDetection.intrusionAttempts}</p>
            <p className="text-xs text-muted-foreground">+8% from last period</p>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Suspicious Activities</span>
            </div>
            <p className="text-2xl font-bold">{securityData.threatDetection.suspiciousActivities}</p>
            <p className="text-xs text-muted-foreground">+5% from last period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerability Management */}
        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Assessment</CardTitle>
            <CardDescription>Current vulnerability status across all systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">
                  {securityData.vulnerabilityManagement.totalScanned}
                </div>
                <div className="text-sm text-muted-foreground">Assets Scanned</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((1 - (securityData.vulnerabilityManagement.critical + securityData.vulnerabilityManagement.high) / securityData.vulnerabilityManagement.totalScanned) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Secure</div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(securityData.vulnerabilityManagement).filter(([key]) => key !== 'totalScanned').map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${
                      severity === 'critical' ? 'text-red-500' :
                      severity === 'high' ? 'text-orange-500' :
                      severity === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span className="font-medium capitalize">{severity}</span>
                  </div>
                  <Badge className={getSeverityColor(severity)}>
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Network Security */}
        <Card>
          <CardHeader>
            <CardTitle>Network Security</CardTitle>
            <CardDescription>Network protection and monitoring stats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Firewall Blocks</span>
                </div>
                <p className="text-xl font-bold">{securityData.networkSecurity.firewallBlocks.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">DNS Filtering</span>
                </div>
                <p className="text-xl font-bold">{securityData.networkSecurity.dnsFiltering.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">VPN Connections</span>
                </div>
                <p className="text-xl font-bold">{securityData.networkSecurity.vpnConnections}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Bandwidth Usage</span>
                </div>
                <p className="text-xl font-bold">{securityData.networkSecurity.bandwidthUsage}%</p>
                <Progress value={securityData.networkSecurity.bandwidthUsage} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Protection */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Protection Coverage</CardTitle>
          <CardDescription>Protection status across all endpoint types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {securityData.endpointProtection.map((endpoint, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">{endpoint.name}</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Protected</span>
                    <span className={`font-medium ${getProtectionColor(endpoint.percentage)}`}>
                      {endpoint.protected}/{endpoint.total}
                    </span>
                  </div>
                  <Progress value={endpoint.percentage} className="h-2" />
                  <p className={`text-sm font-medium ${getProtectionColor(endpoint.percentage)}`}>
                    {endpoint.percentage.toFixed(1)}% Protected
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Incident Response */}
      <Card>
        <CardHeader>
          <CardTitle>Incident Response Metrics</CardTitle>
          <CardDescription>Recent security incidents and response times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityData.incidentResponse.map((incident, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div>
                    <h4 className="font-semibold">{incident.type}</h4>
                    <p className="text-sm text-muted-foreground">
                      {incident.count} incidents • Avg resolution: {incident.avgResolutionTime}
                    </p>
                  </div>
                </div>
                <Badge className={incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {incident.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};