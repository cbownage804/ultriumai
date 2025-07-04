import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Globe,
  User,
  Building,
  CreditCard,
  Loader2,
  Calendar,
  MapPin,
  ExternalLink
} from "lucide-react";

interface DarkWebResult {
  type: 'credential' | 'data_breach' | 'threat_actor' | 'marketplace';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  date: string;
  details: Record<string, any>;
}

interface ScanResults {
  query: string;
  totalFindings: number;
  scanTime: string;
  results: DarkWebResult[];
  recommendations: string[];
}

const mockResults: Record<string, ScanResults> = {
  'brandon.howard@kwccpa.com': {
    query: 'brandon.howard@kwccpa.com',
    totalFindings: 3,
    scanTime: new Date().toLocaleString(),
    results: [
      {
        type: 'data_breach',
        title: 'Corporate Database Leak - Q3 2023',
        description: 'Email found in leaked database containing financial records',
        severity: 'high',
        source: 'Dark Web Forum - FinanceLeaks',
        date: '2023-09-15',
        details: {
          records: 45000,
          dataTypes: ['emails', 'phone numbers', 'financial data'],
          breachSource: 'Third-party vendor',
          mitigation: 'Password reset recommended'
        }
      },
      {
        type: 'credential',
        title: 'Exposed Login Credentials',
        description: 'Username and hashed password found on credential dump',
        severity: 'critical',
        source: 'Underground Marketplace',
        date: '2024-01-20',
        details: {
          username: 'brandon.howard@kwccpa.com',
          passwordHash: 'SHA256:a8f5f167...truncated',
          additionalInfo: 'Part of 2024 credential collection',
          services: ['Corporate VPN', 'Email Portal']
        }
      },
      {
        type: 'threat_actor',
        title: 'Targeted Reconnaissance Activity',
        description: 'Email mentioned in threat actor discussion about CPA firms',
        severity: 'medium',
        source: 'Encrypted Chat Forum',
        date: '2024-02-10',
        details: {
          threatGroup: 'FinancialHunters',
          targetingSector: 'Accounting & Finance',
          attackVector: 'Spear phishing',
          status: 'Planning phase'
        }
      }
    ],
    recommendations: [
      'Immediately change all passwords associated with this email',
      'Enable two-factor authentication on all accounts',
      'Monitor for suspicious login attempts',
      'Notify IT security team about potential compromise',
      'Consider email address change for high-value accounts'
    ]
  },
  'ultrium.ai': {
    query: 'ultrium.ai',
    totalFindings: 2,
    scanTime: new Date().toLocaleString(),
    results: [
      {
        type: 'threat_actor',
        title: 'AI Company Intelligence Gathering',
        description: 'Domain mentioned in cybercriminal discussion about AI companies',
        severity: 'medium',
        source: 'Dark Web Intelligence Forum',
        date: '2024-03-05',
        details: {
          context: 'Reconnaissance activity',
          targetType: 'AI/Technology companies',
          informationSought: 'Customer data, intellectual property',
          riskLevel: 'Monitoring required'
        }
      },
      {
        type: 'marketplace',
        title: 'Domain Spoofing Services',
        description: 'Services offering to create lookalike domains for phishing',
        severity: 'high',
        source: 'Cybercrime Marketplace',
        date: '2024-02-28',
        details: {
          service: 'Domain generation for phishing',
          price: '$50-200 per domain',
          variations: ['ultraium-ai.com', 'ultrium-ai.net', 'ultriumai.org'],
          prevention: 'Domain monitoring recommended'
        }
      }
    ],
    recommendations: [
      'Implement domain monitoring for brand protection',
      'Register common domain variations to prevent spoofing',
      'Monitor for phishing campaigns using similar domains',
      'Educate customers about official domain verification',
      'Consider threat intelligence subscription'
    ]
  }
};

export const DarkWebDemo = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScanResults | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const scanDarkWeb = async () => {
    if (!query.trim()) return;
    
    setIsScanning(true);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Use mock results if available, otherwise generate basic results
    const mockResult = mockResults[query.toLowerCase()] || {
      query,
      totalFindings: Math.floor(Math.random() * 5),
      scanTime: new Date().toLocaleString(),
      results: [],
      recommendations: [
        'Monitor for any suspicious activity',
        'Implement regular dark web monitoring',
        'Keep security measures up to date'
      ]
    };
    
    setResults(mockResult);
    setIsScanning(false);
  };

  const loadSampleQuery = (sampleQuery: string) => {
    setQuery(sampleQuery);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credential': return CreditCard;
      case 'data_breach': return Shield;
      case 'threat_actor': return User;
      case 'marketplace': return Building;
      default: return Globe;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Search className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeWEB Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Monitor the dark web for compromised credentials, data breaches, and emerging threats
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dark Web Monitor
              </CardTitle>
              <CardDescription>
                Enter email, domain, or company name to scan dark web sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample Searches:</label>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleQuery('brandon.howard@kwccpa.com')}
                    className="w-full justify-start text-xs"
                  >
                    📧 Email Address
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => loadSampleQuery('ultrium.ai')}
                    className="w-full justify-start text-xs"
                  >
                    🌐 Company Domain
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="email@company.com or domain.com"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              
              <Button 
                onClick={scanDarkWeb}
                disabled={!query.trim() || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning Dark Web...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Scan Dark Web
                  </>
                )}
              </Button>

              {isScanning && (
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Searching thousands of dark web sources...
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
                <Shield className="h-5 w-5" />
                Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a search term to begin dark web monitoring</p>
                  <p className="text-sm mt-2">We scan forums, marketplaces, and breach databases</p>
                </div>
              ) : (
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="findings">Findings ({results.totalFindings})</TabsTrigger>
                    <TabsTrigger value="recommendations">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-center">
                            {results.totalFindings}
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            Total Findings
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-center text-red-500">
                            {results.results.filter(r => r.severity === 'critical' || r.severity === 'high').length}
                          </div>
                          <div className="text-sm text-muted-foreground text-center">
                            High Priority
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Search Summary</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>Query:</strong> {results.query}</div>
                        <div><strong>Scan Time:</strong> {results.scanTime}</div>
                        <div><strong>Sources:</strong> Dark web forums, marketplaces, breach databases</div>
                      </div>
                    </div>

                    {results.totalFindings > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Found {results.totalFindings} potential security concerns. Review the findings tab for details.
                        </AlertDescription>
                      </Alert>
                    )}
                  </TabsContent>

                  <TabsContent value="findings" className="space-y-4">
                    {results.results.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p>No concerning findings detected</p>
                        <p className="text-sm mt-1">Your search term was not found in known compromised data</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {results.results.map((result, index) => {
                          const IconComponent = getTypeIcon(result.type);
                          return (
                            <Card key={index} className="border-l-4 border-l-red-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    <CardTitle className="text-base">{result.title}</CardTitle>
                                  </div>
                                  <Badge variant={getSeverityBadge(result.severity)}>
                                    {result.severity.toUpperCase()}
                                  </Badge>
                                </div>
                                <CardDescription>{result.description}</CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Globe className="h-3 w-3" />
                                    <span><strong>Source:</strong> {result.source}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    <span><strong>Date:</strong> {result.date}</span>
                                  </div>
                                  
                                  {Object.entries(result.details).map(([key, value]) => (
                                    <div key={key} className="ml-5">
                                      <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {' '}
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recommendations" className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <strong>Immediate Actions Required:</strong>
                          <ul className="list-disc pl-5 space-y-1">
                            {results.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Ongoing Monitoring</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-2">
                          <p>• Set up continuous monitoring for this search term</p>
                          <p>• Receive real-time alerts for new findings</p>
                          <p>• Regular scans of dark web sources</p>
                          <p>• Integration with security incident response</p>
                        </div>
                      </CardContent>
                    </Card>
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