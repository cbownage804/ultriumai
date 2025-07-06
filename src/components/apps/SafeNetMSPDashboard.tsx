import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Users, 
  Network, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Globe,
  Settings,
  Eye,
  MapPin,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Monitor,
  Gauge,
  Clock,
  Target,
  CheckCircle,
  XCircle,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface MSPClient {
  id: string;
  name: string;
  logo?: string;
  plan: 'basic' | 'professional' | 'enterprise';
  monthlyRevenue: number;
  totalDevices: number;
  vulnerableDevices: number;
  connectorStatus: 'online' | 'offline' | 'error';
  lastScan: Date;
  riskScore: number;
  networkUptime: number;
  sites: number;
  users: number;
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  complianceScore: number;
  threatIntel: {
    threatsBlocked: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

export const SafeNetMSPDashboard = () => {
  const { toast } = useToast();
  
  const [clients, setClients] = useState<MSPClient[]>([
    {
      id: 'client-001',
      name: 'ABC Manufacturing',
      plan: 'enterprise',
      monthlyRevenue: 150,
      totalDevices: 127,
      vulnerableDevices: 8,
      connectorStatus: 'online',
      lastScan: new Date(),
      riskScore: 7.2,
      networkUptime: 99.8,
      sites: 3,
      users: 245,
      alerts: { critical: 2, warning: 5, info: 12 },
      complianceScore: 89,
      threatIntel: { threatsBlocked: 47, riskLevel: 'medium' }
    },
    {
      id: 'client-002',
      name: 'XYZ Legal Services',
      plan: 'professional',
      monthlyRevenue: 75,
      totalDevices: 42,
      vulnerableDevices: 3,
      connectorStatus: 'online',
      lastScan: new Date(Date.now() - 3600000),
      riskScore: 8.1,
      networkUptime: 99.2,
      sites: 1,
      users: 67,
      alerts: { critical: 0, warning: 2, info: 8 },
      complianceScore: 94,
      threatIntel: { threatsBlocked: 12, riskLevel: 'low' }
    },
    {
      id: 'client-003',
      name: 'Tech Startup Inc',
      plan: 'basic',
      monthlyRevenue: 25,
      totalDevices: 18,
      vulnerableDevices: 1,
      connectorStatus: 'offline',
      lastScan: new Date(Date.now() - 86400000),
      riskScore: 6.8,
      networkUptime: 98.5,
      sites: 1,
      users: 23,
      alerts: { critical: 1, warning: 1, info: 3 },
      complianceScore: 76,
      threatIntel: { threatsBlocked: 3, riskLevel: 'low' }
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Calculate totals
  const totalRevenue = clients.reduce((sum, client) => sum + client.monthlyRevenue, 0);
  const totalDevices = clients.reduce((sum, client) => sum + client.totalDevices, 0);
  const totalVulnerableDevices = clients.reduce((sum, client) => sum + client.vulnerableDevices, 0);
  const avgRiskScore = clients.reduce((sum, client) => sum + client.riskScore, 0) / clients.length;
  const onlineClients = clients.filter(c => c.connectorStatus === 'online').length;

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'text-purple-600';
      case 'professional': return 'text-blue-600';
      case 'basic': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    if (score >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  const viewClientDetails = (clientId: string) => {
    setSelectedClient(clientId);
    setViewMode('detailed');
    toast({
      title: "Client Details",
      description: "Viewing detailed client security dashboard",
    });
  };

  const runBulkScan = () => {
    toast({
      title: "Bulk Scan Started",
      description: "Running security scans across all client networks...",
    });
  };

  const generateMSPReport = () => {
    toast({
      title: "Report Generated",
      description: "Monthly MSP security report is ready for download",
    });
  };

  if (viewMode === 'detailed' && selectedClient) {
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return null;

    return (
      <div className="space-y-6 p-6">
        {/* Client Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setViewMode('overview')}>
              ← Back to Overview
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-muted-foreground">Detailed Security Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={getPlanColor(client.plan)}>
              {client.plan.toUpperCase()}
            </Badge>
            <Badge variant={client.connectorStatus === 'online' ? 'default' : 'destructive'}>
              {client.connectorStatus}
            </Badge>
          </div>
        </div>

        {/* Detailed Client Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">${client.monthlyRevenue}</div>
              <p className="text-xs text-muted-foreground">per month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Risk</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getRiskColor(client.riskScore)}`}>
                {client.riskScore}/10
              </div>
              <Progress value={client.riskScore * 10} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{client.complianceScore}%</div>
              <Progress value={client.complianceScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{client.threatIntel.threatsBlocked}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Client Network Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold">{client.totalDevices}</div>
                  <div className="text-sm text-muted-foreground">Total Devices</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold">{client.sites}</div>
                  <div className="text-sm text-muted-foreground">Sites</div>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold">{client.networkUptime}%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Secure Devices</span>
                  <span className="text-green-500">{client.totalDevices - client.vulnerableDevices}</span>
                </div>
                <Progress value={((client.totalDevices - client.vulnerableDevices) / client.totalDevices) * 100} />
                <div className="flex justify-between text-sm">
                  <span>Vulnerable Devices</span>
                  <span className="text-red-500">{client.vulnerableDevices}</span>
                </div>
                <Progress value={(client.vulnerableDevices / client.totalDevices) * 100} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Critical</span>
                </div>
                <Badge variant="destructive">{client.alerts.critical}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Warning</span>
                </div>
                <Badge variant="secondary">{client.alerts.warning}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Info</span>
                </div>
                <Badge variant="outline">{client.alerts.info}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back Button and MSP Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/products/safenet">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to SafeNet
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              MSP Security Dashboard
            </h1>
            <p className="text-muted-foreground">
              Multi-client network security management and monitoring
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={runBulkScan} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Bulk Scan All
          </Button>
          <Button onClick={generateMSPReport} variant="hero">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* MSP Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalRevenue}</div>
            <p className="text-xs text-muted-foreground">
              From {clients.length} clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Across all networks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{totalVulnerableDevices}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(avgRiskScore)}`}>
              {avgRiskScore.toFixed(1)}/10
            </div>
            <Progress value={avgRiskScore * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Clients</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{onlineClients}/{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Portfolio ({clients.length})
          </CardTitle>
          <CardDescription>
            Security overview for all managed clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <Card key={client.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                    {/* Client Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${client.connectorStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className={getPlanColor(client.plan)}>
                              {client.plan}
                            </Badge>
                            <span>${client.monthlyRevenue}/mo</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Network Stats */}
                    <div className="text-center">
                      <div className="text-lg font-bold">{client.totalDevices}</div>
                      <div className="text-xs text-muted-foreground">Devices</div>
                    </div>

                    <div className="text-center">
                      <div className={`text-lg font-bold ${client.vulnerableDevices > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {client.vulnerableDevices}
                      </div>
                      <div className="text-xs text-muted-foreground">Vulnerable</div>
                    </div>

                    {/* Risk Score */}
                    <div className="text-center">
                      <div className={`text-lg font-bold ${getRiskColor(client.riskScore)}`}>
                        {client.riskScore}/10
                      </div>
                      <div className="text-xs text-muted-foreground">Risk Score</div>
                    </div>

                    {/* Last Scan */}
                    <div className="text-center">
                      <div className="text-sm">
                        {client.lastScan.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Last Scan</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => viewClientDetails(client.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Alert Summary */}
                  {(client.alerts.critical > 0 || client.alerts.warning > 0) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex gap-3 text-sm">
                        {client.alerts.critical > 0 && (
                          <span className="text-red-500">
                            {client.alerts.critical} Critical
                          </span>
                        )}
                        {client.alerts.warning > 0 && (
                          <span className="text-orange-500">
                            {client.alerts.warning} Warnings
                          </span>
                        )}
                        <span className="text-blue-500">
                          {client.alerts.info} Info
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${client.connectorStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm">{client.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${client.monthlyRevenue}</div>
                  <div className="text-xs text-muted-foreground">{client.plan}</div>
                </div>
              </div>
            ))}
            <div className="border-t pt-3">
              <div className="flex justify-between font-bold">
                <span>Total Monthly Revenue</span>
                <span className="text-green-500">${totalRevenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Secure Networks</span>
                <span className="text-green-500">{clients.filter(c => c.vulnerableDevices === 0).length}/{clients.length}</span>
              </div>
              <Progress value={(clients.filter(c => c.vulnerableDevices === 0).length / clients.length) * 100} />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>High Risk Clients</span>
                <span className="text-red-500">{clients.filter(c => c.riskScore < 5).length}</span>
              </div>
              <Progress value={(clients.filter(c => c.riskScore < 5).length / clients.length) * 100} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Compliance Average</span>
                <span className="text-blue-500">{Math.round(clients.reduce((sum, c) => sum + c.complianceScore, 0) / clients.length)}%</span>
              </div>
              <Progress value={clients.reduce((sum, c) => sum + c.complianceScore, 0) / clients.length} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};