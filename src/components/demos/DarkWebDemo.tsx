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
  Mail
} from "lucide-react";
import safewebLogo from '@/assets/safeweb-logo.png';

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
  'john.doe@acmetech.com': {
    query: 'john.doe@acmetech.com',
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
          username: 'john.doe@acmetech.com',
          passwordHash: 'SHA256:a8f5f167...truncated',
          additionalInfo: 'Part of 2024 credential collection',
          services: ['Corporate VPN', 'Email Portal']
        }
      },
      {
        type: 'threat_actor',
        title: 'Targeted Reconnaissance Activity',
        description: 'Email mentioned in threat actor discussion about tech companies',
        severity: 'medium',
        source: 'Encrypted Chat Forum',
        date: '2024-02-10',
        details: {
          threatGroup: 'TechHunters',
          targetingSector: 'Technology & Software',
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
  'acmetech.com': {
    query: 'acmetech.com',
    totalFindings: 2,
    scanTime: new Date().toLocaleString(),
    results: [
      {
        type: 'threat_actor',
        title: 'Tech Company Intelligence Gathering',
        description: 'Domain mentioned in cybercriminal discussion about tech companies',
        severity: 'medium',
        source: 'Dark Web Intelligence Forum',
        date: '2024-03-05',
        details: {
          context: 'Reconnaissance activity',
          targetType: 'Technology companies',
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
          variations: ['acme-tech.com', 'acmetech.net', 'acmetech.org'],
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
    <div className="p-4 space-y-4">
      {/* Header with Watch branding - centered logo only */}
      <div className="flex justify-center mb-4">
        <img src={safewebLogo} alt="Watch" className="h-28 w-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search Section */}
        <Card className="lg:col-span-1 bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5 text-violet-500" />
              Dark Web Monitor
            </CardTitle>
            <CardDescription className="text-xs">
              Enter email, domain, or company name to scan dark web sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Sample Searches:</label>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadSampleQuery('john.doe@acmetech.com')}
                  className="w-full justify-start text-xs"
                >
                  <Mail className="h-3 w-3 mr-2" />
                  Email Address
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadSampleQuery('acmetech.com')}
                  className="w-full justify-start text-xs"
                >
                  <Globe className="h-3 w-3 mr-2" />
                  Company Domain
                </Button>
              </div>
            </div>
            
            <Input
              placeholder="email@company.com or domain.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-background/50 text-sm"
            />
            
            <Button 
              onClick={scanDarkWeb}
              disabled={!query.trim() || isScanning}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Scan Dark Web
                </>
              )}
            </Button>

            {isScanning && (
              <div className="text-center space-y-1">
                <div className="text-xs text-muted-foreground">
                  Searching dark web sources...
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="lg:col-span-2 bg-card/50 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-violet-500" />
              Scan Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results ? (
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Enter a search term to begin dark web monitoring</p>
              </div>
            ) : (
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="findings" className="text-xs">Findings ({results.totalFindings})</TabsTrigger>
                  <TabsTrigger value="recommendations" className="text-xs">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-background/50">
                      <CardContent className="pt-4 pb-3">
                        <div className="text-xl font-bold text-center">{results.totalFindings}</div>
                        <div className="text-xs text-muted-foreground text-center">Total Findings</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-background/50">
                      <CardContent className="pt-4 pb-3">
                        <div className="text-xl font-bold text-center text-red-500">
                          {results.results.filter(r => r.severity === 'critical' || r.severity === 'high').length}
                        </div>
                        <div className="text-xs text-muted-foreground text-center">High Priority</div>
                      </CardContent>
                    </Card>
                  </div>

                  {results.totalFindings > 0 && (
                    <Alert className="border-amber-500/30 bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-xs">
                        Found {results.totalFindings} potential security concerns.
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="findings" className="space-y-3 mt-3">
                  {results.results.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="text-sm">No concerning findings detected</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[200px] overflow-y-auto">
                      {results.results.map((result, index) => {
                        const IconComponent = getTypeIcon(result.type);
                        return (
                          <Card key={index} className="border-l-4 border-l-red-500 bg-background/50">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4 text-violet-500" />
                                  <span className="font-medium text-sm">{result.title}</span>
                                </div>
                                <Badge variant={getSeverityBadge(result.severity)} className="text-xs">
                                  {result.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{result.description}</p>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="recommendations" className="mt-3">
                  <Alert className="border-violet-500/30 bg-violet-500/10">
                    <AlertTriangle className="h-4 w-4 text-violet-500" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <strong className="text-xs">Immediate Actions:</strong>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {results.recommendations.slice(0, 3).map((rec, index) => (
                            <li key={index} className="text-xs">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CTA with violet branding */}
      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src={safewebLogo} alt="Watch" className="h-16 w-auto" />
          </div>
          <h4 className="text-lg font-bold mb-1">Continuous Dark Web Monitoring</h4>
          <p className="text-muted-foreground text-sm mb-3">
            Get instant alerts when your data appears on the dark web
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            Enable Monitoring
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};