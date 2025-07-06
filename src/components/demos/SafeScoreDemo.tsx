import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Users,
  Building,
  Loader2,
  TrendingUp,
  Clock,
  Target
} from "lucide-react";

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  controlsTotal: number;
  controlsImplemented: number;
  lastAudit: string;
  status: 'compliant' | 'non-compliant' | 'in-progress';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceGap {
  id: string;
  framework: string;
  control: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  assignedTo: string;
  status: 'open' | 'in-progress' | 'completed';
}

const mockFrameworks: ComplianceFramework[] = [
  {
    id: '1',
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2 - Security, Availability, Processing Integrity',
    controlsTotal: 64,
    controlsImplemented: 58,
    lastAudit: '2024-01-15',
    status: 'in-progress',
    riskLevel: 'medium'
  },
  {
    id: '2',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act',
    controlsTotal: 18,
    controlsImplemented: 16,
    lastAudit: '2024-02-20',
    status: 'compliant',
    riskLevel: 'low'
  },
  {
    id: '3',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    controlsTotal: 12,
    controlsImplemented: 8,
    lastAudit: '2023-12-10',
    status: 'non-compliant',
    riskLevel: 'high'
  },
  {
    id: '4',
    name: 'GDPR',
    description: 'General Data Protection Regulation',
    controlsTotal: 25,
    controlsImplemented: 22,
    lastAudit: '2024-01-30',
    status: 'in-progress',
    riskLevel: 'medium'
  }
];

const mockGaps: ComplianceGap[] = [
  {
    id: '1',
    framework: 'SOC 2',
    control: 'CC6.1',
    description: 'Logical and physical access controls need multi-factor authentication',
    priority: 'high',
    dueDate: '2024-08-15',
    assignedTo: 'IT Security Team',
    status: 'in-progress'
  },
  {
    id: '2',
    framework: 'PCI DSS',
    control: 'Req 8.2',
    description: 'Password complexity requirements not enforced',
    priority: 'critical',
    dueDate: '2024-07-20',
    assignedTo: 'System Admin',
    status: 'open'
  },
  {
    id: '3',
    framework: 'GDPR',
    control: 'Art 32',
    description: 'Data encryption at rest not implemented for all databases',
    priority: 'high',
    dueDate: '2024-09-01',
    assignedTo: 'DevOps Team',
    status: 'open'
  }
];

export const SafeScoreDemo = () => {
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const runComplianceScan = async () => {
    setIsScanning(true);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsScanning(false);
    setShowResults(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'non-compliant': return 'text-red-600';
      case 'in-progress': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'non-compliant': return 'destructive';
      case 'in-progress': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeScore Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive compliance management and risk assessment platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center text-green-600">
                67%
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Overall Compliance
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center text-orange-600">
                15
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Open Issues
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-center text-blue-600">
                4
              </div>
              <div className="text-sm text-muted-foreground text-center">
                Active Frameworks
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="frameworks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
            <TabsTrigger value="gaps">Compliance Gaps</TabsTrigger>
            <TabsTrigger value="scanner">Quick Scan</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="frameworks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Compliance Frameworks
                </CardTitle>
                <CardDescription>
                  Track implementation status across multiple compliance standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockFrameworks.map((framework) => (
                    <Card key={framework.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{framework.name}</h4>
                            <p className="text-sm text-muted-foreground">{framework.description}</p>
                          </div>
                          <Badge variant={getStatusBadge(framework.status)}>
                            {framework.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Implementation Progress</span>
                              <span>{framework.controlsImplemented}/{framework.controlsTotal} controls</span>
                            </div>
                            <Progress 
                              value={(framework.controlsImplemented / framework.controlsTotal) * 100} 
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              <span>Last Audit: {framework.lastAudit}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${getPriorityColor(framework.riskLevel)}`}>
                              <AlertTriangle className="h-3 w-3" />
                              <span className="capitalize">{framework.riskLevel} Risk</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gaps" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Compliance Gaps & Action Items
                </CardTitle>
                <CardDescription>
                  Critical issues requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockGaps.map((gap) => (
                    <Card key={gap.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{gap.framework}</span>
                              <span className="text-sm text-muted-foreground">({gap.control})</span>
                            </div>
                            <p className="text-sm">{gap.description}</p>
                          </div>
                          <Badge variant={getPriorityBadge(gap.priority)}>
                            {gap.priority.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{gap.assignedTo}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Due: {gap.dueDate}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {gap.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance Scanner
                </CardTitle>
                <CardDescription>
                  Run automated compliance checks against your infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Framework:</label>
                  <Input
                    placeholder="Enter domain or IP range to scan"
                    value={selectedFramework}
                    onChange={(e) => setSelectedFramework(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={runComplianceScan}
                  disabled={isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Infrastructure...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Run Compliance Scan
                    </>
                  )}
                </Button>

                {isScanning && (
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Analyzing security controls and configurations...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      This may take several minutes
                    </div>
                  </div>
                )}

                {showResults && !isScanning && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <strong>Scan Complete</strong>
                        <ul className="list-disc pl-5 space-y-1">
                          <li className="text-sm">Found 3 configuration issues</li>
                          <li className="text-sm">2 critical security gaps identified</li>
                          <li className="text-sm">5 policy violations detected</li>
                          <li className="text-sm">Remediation plan generated</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compliance Reports
                </CardTitle>
                <CardDescription>
                  Generate detailed compliance and audit reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Executive Summary</span>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        High-level compliance overview for leadership
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Technical Audit</span>
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Detailed technical findings and recommendations
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Gap Analysis</span>
                        <Target className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Compliance gaps and remediation roadmap
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Evidence Package</span>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Complete audit evidence documentation
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Generate Package
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};