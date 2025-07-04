import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  Building,
  Clock,
  Loader2,
  Search,
  TrendingUp,
  Award
} from "lucide-react";

interface ComplianceResult {
  framework: string;
  overallScore: number;
  status: 'compliant' | 'non-compliant' | 'needs-attention';
  lastAudit: string;
  nextAudit: string;
  categories: {
    name: string;
    score: number;
    status: 'pass' | 'fail' | 'warning';
    findings: string[];
    recommendations: string[];
  }[];
  recommendations: string[];
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  categories: string[];
}

const frameworks: ComplianceFramework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'Service Organization Control 2 audit for security, availability, processing integrity, confidentiality, and privacy',
    categories: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy']
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'International standard for information security management systems',
    categories: ['Information Security Policy', 'Risk Management', 'Asset Management', 'Access Control', 'Incident Management']
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability Act compliance for healthcare data',
    categories: ['Administrative Safeguards', 'Physical Safeguards', 'Technical Safeguards', 'Breach Notification']
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation for European data protection',
    categories: ['Lawful Processing', 'Data Subject Rights', 'Data Protection by Design', 'Breach Notification', 'DPO Requirements']
  }
];

const mockResults: Record<string, ComplianceResult> = {
  'Acme Corporation': {
    framework: 'SOC 2 Type II',
    overallScore: 87,
    status: 'compliant',
    lastAudit: '2024-01-15',
    nextAudit: '2025-01-15',
    categories: [
      {
        name: 'Security',
        score: 95,
        status: 'pass',
        findings: ['Strong access controls implemented', 'Multi-factor authentication enforced'],
        recommendations: ['Implement additional network segmentation']
      },
      {
        name: 'Availability',
        score: 88,
        status: 'pass',
        findings: ['99.9% uptime achieved', 'Backup systems tested monthly'],
        recommendations: ['Consider additional redundancy for critical systems']
      },
      {
        name: 'Processing Integrity',
        score: 82,
        status: 'warning',
        findings: ['Data validation controls in place', 'Some manual processes identified'],
        recommendations: ['Automate manual data processing steps', 'Implement additional data validation']
      },
      {
        name: 'Confidentiality',
        score: 90,
        status: 'pass',
        findings: ['Encryption at rest and in transit', 'Proper data classification'],
        recommendations: ['Review encryption key management procedures']
      },
      {
        name: 'Privacy',
        score: 85,
        status: 'pass',
        findings: ['Privacy controls documented', 'Data retention policies enforced'],
        recommendations: ['Update privacy notices for new regulations']
      }
    ],
    recommendations: [
      'Implement automated compliance monitoring dashboard',
      'Conduct quarterly compliance reviews',
      'Update incident response procedures',
      'Enhance employee training program'
    ]
  }
};

export const SafeCompDemo = () => {
  const [organization, setOrganization] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('soc2');
  const [results, setResults] = useState<ComplianceResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const runComplianceAudit = async () => {
    if (!organization.trim()) return;
    
    setIsScanning(true);
    
    // Simulate audit delay
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Use mock results if available, otherwise generate basic results
    const mockResult = mockResults[organization] || {
      framework: frameworks.find(f => f.id === selectedFramework)?.name || 'SOC 2',
      overallScore: Math.floor(Math.random() * 30) + 70,
      status: Math.random() > 0.3 ? 'compliant' : 'needs-attention',
      lastAudit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextAudit: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      categories: frameworks.find(f => f.id === selectedFramework)?.categories.map(cat => ({
        name: cat,
        score: Math.floor(Math.random() * 40) + 60,
        status: Math.random() > 0.2 ? 'pass' : 'warning' as 'pass' | 'warning',
        findings: [`${cat} controls reviewed`, 'Documentation verified'],
        recommendations: [`Enhance ${cat.toLowerCase()} procedures`]
      })) || [],
      recommendations: [
        'Review and update compliance policies',
        'Conduct regular internal audits',
        'Implement continuous monitoring'
      ]
    };
    
    setResults(mockResult as ComplianceResult);
    setIsScanning(false);
  };

  const loadSampleOrganization = (name: string) => {
    setOrganization(name);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'pass': return 'text-green-600';
      case 'non-compliant': return 'text-red-600';
      case 'fail': return 'text-red-600';
      case 'needs-attention': return 'text-yellow-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'pass': return 'default';
      case 'non-compliant': return 'destructive';
      case 'fail': return 'destructive';
      case 'needs-attention': return 'secondary';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeComp Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive compliance management and audit automation platform
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audit Configuration */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Compliance Audit
              </CardTitle>
              <CardDescription>
                Enter organization details and select compliance framework
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Organizations:</label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleOrganization('Acme Corporation')}
                    className="w-full justify-start text-xs"
                  >
                    🏢 Acme Corporation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleOrganization('Tech Innovations LLC')}
                    className="w-full justify-start text-xs"
                  >
                    💻 Tech Innovations LLC
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="Organization name"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Compliance Framework:</label>
                <div className="grid grid-cols-1 gap-2">
                  {frameworks.map((framework) => (
                    <Button
                      key={framework.id}
                      variant={selectedFramework === framework.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFramework(framework.id)}
                      className="text-left h-auto p-3 whitespace-normal"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm break-words">{framework.name}</div>
                        <div className="text-xs opacity-70 break-words leading-tight">{framework.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={runComplianceAudit}
                disabled={!organization.trim() || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Audit...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Run Compliance Audit
                  </>
                )}
              </Button>

              {isScanning && (
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Analyzing compliance controls...
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This may take several minutes
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Compliance Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an organization and framework to begin compliance audit</p>
                  <p className="text-sm mt-2">We analyze policies, procedures, and technical controls</p>
                </div>
              ) : (
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="findings">Findings</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className={`text-3xl font-bold text-center ${getScoreColor(results.overallScore)}`}>
                            {results.overallScore}%
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            Overall Score
                          </div>
                          <Progress value={results.overallScore} className="mt-2" />
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <Badge variant={getStatusBadge(results.status)} className="text-xs">
                              {results.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground text-center mt-2">
                            Compliance Status
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Audit Summary</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Framework:</strong> {results.framework}</div>
                        <div><strong>Organization:</strong> {organization}</div>
                        <div><strong>Last Audit:</strong> {results.lastAudit}</div>
                        <div><strong>Next Audit:</strong> {results.nextAudit}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.categories.slice(0, 4).map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {category.status === 'pass' ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : category.status === 'fail' ? (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium truncate">{category.name}</span>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ml-2 ${getScoreColor(category.score)}`}>
                            {category.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="categories" className="space-y-4">
                    <div className="space-y-4">
                      {results.categories.map((category, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                {category.status === 'pass' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : category.status === 'fail' ? (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                )}
                                {category.name}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${getScoreColor(category.score)}`}>
                                  {category.score}%
                                </span>
                                <Badge variant={getStatusBadge(category.status)}>
                                  {category.status.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <Progress value={category.score} className="mt-2" />
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div>
                                <strong className="text-sm">Key Findings:</strong>
                                <ul className="text-sm text-muted-foreground ml-4 mt-1">
                                  {category.findings.map((finding, fidx) => (
                                    <li key={fidx} className="list-disc">{finding}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <strong className="text-sm">Recommendations:</strong>
                                <ul className="text-sm text-muted-foreground ml-4 mt-1">
                                  {category.recommendations.map((rec, ridx) => (
                                    <li key={ridx} className="list-disc">{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="findings" className="space-y-4">
                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <strong>Compliance Analysis Summary:</strong>
                          <div className="text-sm">
                            <p>Based on our automated analysis of your organization&apos;s policies, procedures, and technical controls, we&apos;ve identified key areas for improvement.</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Detailed Findings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {results.categories.map((category, index) => (
                            <div key={index} className="border-l-4 border-l-primary pl-4">
                              <h5 className="font-medium">{category.name}</h5>
                              <div className="space-y-1 mt-2">
                                {category.findings.map((finding, fidx) => (
                                  <div key={fidx} className="text-sm flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{finding}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <strong>Recommended Actions:</strong>
                          <ul className="list-disc pl-5 space-y-1">
                            {results.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Immediate Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <p>• Review and update security policies</p>
                            <p>• Implement missing technical controls</p>
                            <p>• Document existing procedures</p>
                            <p>• Train staff on compliance requirements</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Ongoing Monitoring
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <p>• Schedule quarterly compliance reviews</p>
                            <p>• Set up automated monitoring dashboards</p>
                            <p>• Establish incident response procedures</p>
                            <p>• Plan annual external audits</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};