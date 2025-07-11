import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Target,
  Eye,
  Search,
  FileSearch,
  Globe,
  Lock,
  Users,
  Building2,
  TrendingUp,
  BarChart3,
  Settings,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'compliant' | 'partial' | 'non_compliant';
  lastAudit: string;
  nextAudit: string;
  controlsTotal: number;
  controlsMet: number;
}

interface VulnerabilityItem {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cve: string;
  affectedAssets: number;
  description: string;
  remediation: string;
  status: 'open' | 'in_progress' | 'resolved';
  discoveredAt: string;
}

interface SIEMConnector {
  id: string;
  name: string;
  type: 'splunk' | 'qradar' | 'sentinel' | 'chronicle' | 'elk';
  status: 'connected' | 'disconnected' | 'error';
  eventsPerDay: number;
  lastSync: string;
}

const severityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const complianceColors = {
  compliant: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  non_compliant: 'bg-red-100 text-red-800'
};

export const MSPSecurityHub = () => {
  const { toast } = useToast();
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityItem[]>([]);
  const [siemConnectors, setSiemConnectors] = useState<SIEMConnector[]>([]);
  const [darkWebFindings, setDarkWebFindings] = useState(0);

  useEffect(() => {
    // Mock data
    setFrameworks([
      {
        id: '1',
        name: 'SOC 2 Type II',
        description: 'Security, Availability, Processing Integrity, Confidentiality, Privacy',
        progress: 85,
        status: 'partial',
        lastAudit: '2024-01-15',
        nextAudit: '2024-07-15',
        controlsTotal: 64,
        controlsMet: 54
      },
      {
        id: '2',
        name: 'ISO 27001',
        description: 'Information Security Management System',
        progress: 92,
        status: 'compliant',
        lastAudit: '2023-12-10',
        nextAudit: '2024-12-10',
        controlsTotal: 114,
        controlsMet: 105
      },
      {
        id: '3',
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act',
        progress: 78,
        status: 'partial',
        lastAudit: '2024-02-01',
        nextAudit: '2024-08-01',
        controlsTotal: 45,
        controlsMet: 35
      }
    ]);

    setVulnerabilities([
      {
        id: '1',
        title: 'Critical Windows RCE Vulnerability',
        severity: 'critical',
        cve: 'CVE-2024-12345',
        affectedAssets: 23,
        description: 'Remote code execution vulnerability in Windows Print Spooler',
        remediation: 'Apply KB5034441 security update immediately',
        status: 'open',
        discoveredAt: '2024-01-10T10:30:00Z'
      },
      {
        id: '2',
        title: 'Apache HTTP Server Path Traversal',
        severity: 'high',
        cve: 'CVE-2024-67890',
        affectedAssets: 8,
        description: 'Directory traversal vulnerability in Apache HTTP Server',
        remediation: 'Update to Apache HTTP Server 2.4.58 or later',
        status: 'in_progress',
        discoveredAt: '2024-01-08T14:20:00Z'
      }
    ]);

    setSiemConnectors([
      {
        id: '1',
        name: 'Splunk Enterprise',
        type: 'splunk',
        status: 'connected',
        eventsPerDay: 45000,
        lastSync: '2024-01-11T15:30:00Z'
      },
      {
        id: '2',
        name: 'Microsoft Sentinel',
        type: 'sentinel',
        status: 'connected',
        eventsPerDay: 32000,
        lastSync: '2024-01-11T15:25:00Z'
      }
    ]);

    setDarkWebFindings(3);
  }, []);

  const handleStartScan = () => {
    toast({
      title: "Vulnerability Scan Started",
      description: "Network-wide vulnerability scan initiated. Results will be available in 15-20 minutes.",
    });
  };

  const handleExportCompliance = (frameworkId: string) => {
    toast({
      title: "Compliance Report Generated",
      description: "The compliance report has been generated and will be downloaded shortly.",
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security Hub
          </h1>
          <p className="text-muted-foreground">
            Advanced security monitoring, compliance management, and threat intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure SIEM
          </Button>
          <Button variant="hero">
            <BarChart3 className="h-4 w-4 mr-2" />
            Security Dashboard
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {vulnerabilities.filter(v => v.severity === 'critical').length}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">85%</div>
            <p className="text-xs text-muted-foreground">Average across frameworks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SIEM Events</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">77K</div>
            <p className="text-xs text-muted-foreground">Events processed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dark Web Findings</CardTitle>
            <Globe className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{darkWebFindings}</div>
            <p className="text-xs text-muted-foreground">Active monitors</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vulnerability" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vulnerability">Vulnerability Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Tracking</TabsTrigger>
          <TabsTrigger value="siem">SIEM Integration</TabsTrigger>
          <TabsTrigger value="darkweb">Dark Web Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerability" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Vulnerability Management</h3>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleStartScan}>
                <Search className="h-4 w-4 mr-2" />
                Start Network Scan
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {vulnerabilities.map((vuln) => (
              <Card key={vuln.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{vuln.title}</CardTitle>
                        <Badge className={severityColors[vuln.severity]}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">{vuln.cve}</Badge>
                      </div>
                      <CardDescription>{vuln.description}</CardDescription>
                    </div>
                    <Badge variant={
                      vuln.status === 'resolved' ? 'default' : 
                      vuln.status === 'in_progress' ? 'secondary' : 
                      'destructive'
                    }>
                      {vuln.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Affected Assets:</span> {vuln.affectedAssets}
                      </div>
                      <div>
                        <span className="font-medium">Discovered:</span> {new Date(vuln.discoveredAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Remediation:</p>
                      <p className="text-sm text-muted-foreground">{vuln.remediation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Target className="h-3 w-3 mr-1" />
                        Create Patch Task
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Frameworks</h3>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{framework.name}</CardTitle>
                      <CardDescription>{framework.description}</CardDescription>
                    </div>
                    <Badge className={complianceColors[framework.status]}>
                      {framework.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Compliance Progress</span>
                        <span>{framework.progress}%</span>
                      </div>
                      <Progress value={framework.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Controls Met:</span> {framework.controlsMet}/{framework.controlsTotal}
                      </div>
                      <div>
                        <span className="font-medium">Last Audit:</span> {new Date(framework.lastAudit).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Next Audit:</span> {new Date(framework.nextAudit).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleExportCompliance(framework.id)}>
                        <Download className="h-3 w-3 mr-1" />
                        Export Report
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileSearch className="h-3 w-3 mr-1" />
                        View Controls
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="siem" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">SIEM Connectors</h3>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Add Connector
            </Button>
          </div>

          <div className="space-y-4">
            {siemConnectors.map((connector) => (
              <Card key={connector.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{connector.name}</CardTitle>
                        <CardDescription className="capitalize">{connector.type} integration</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={connector.status === 'connected' ? 'default' : 'destructive'}>
                        {connector.status}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Events/Day:</span> {connector.eventsPerDay.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Sync:</span> {new Date(connector.lastSync).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> Healthy
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              SIEM integration allows real-time correlation of security events across your client infrastructure. 
              Configure log forwarding and correlation rules to enhance threat detection capabilities.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="darkweb" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Dark Web Monitoring</h3>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Add Monitor
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add New Monitor</CardTitle>
                <CardDescription>Monitor for compromised credentials and mentions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" placeholder="example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Pattern</Label>
                  <Input id="email" placeholder="*@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input id="keywords" placeholder="company name, products..." />
                </div>
                <Button className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Start Monitoring
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Findings</CardTitle>
                <CardDescription>Latest dark web discoveries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="destructive">High Risk</Badge>
                      <span className="text-xs text-muted-foreground">2 hours ago</span>
                    </div>
                    <p className="text-sm font-medium">Credentials found for acme.com</p>
                    <p className="text-xs text-muted-foreground">
                      Email: admin@acme.com found in data breach dump
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">Medium Risk</Badge>
                      <span className="text-xs text-muted-foreground">1 day ago</span>
                    </div>
                    <p className="text-sm font-medium">Company mention in forum</p>
                    <p className="text-xs text-muted-foreground">
                      TechStart LLC mentioned in cybercrime forum discussion
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};