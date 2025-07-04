import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Link, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Globe,
  Clock,
  Loader2
} from "lucide-react";

interface LinkAnalysis {
  url: string;
  overallRisk: 'safe' | 'low' | 'medium' | 'high' | 'dangerous';
  riskScore: number;
  checks: {
    malware: boolean;
    phishing: boolean;
    reputation: boolean;
    ssl: boolean;
    blacklisted: boolean;
  };
  details: {
    domain: string;
    domainAge: string;
    country: string;
    redirects: number;
    protocol: string;
    certificateValid: boolean;
  };
  scanTime: string;
  recommendations: string[];
}

const sampleUrls = [
  'https://google.com',
  'https://github.com',
  'http://suspicious-site-phishing.net',
  'https://paypal-verify-account.fake-domain.com',
  'https://malware-download-site.ru'
];

export const SafeLinkDemo = () => {
  const [url, setUrl] = useState('');
  const [analysis, setAnalysis] = useState<LinkAnalysis | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scanUrl = async () => {
    if (!url.trim()) return;
    
    setIsScanning(true);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock analysis based on URL patterns
    const urlLower = url.toLowerCase();
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    
    let riskScore = 0;
    const checks = {
      malware: false,
      phishing: false,
      reputation: true,
      ssl: url.startsWith('https://'),
      blacklisted: false
    };
    
    // Risk assessment logic
    if (urlLower.includes('phishing') || urlLower.includes('verify') || urlLower.includes('fake')) {
      checks.phishing = true;
      riskScore += 60;
    }
    
    if (urlLower.includes('malware') || urlLower.includes('.ru') || urlLower.includes('download')) {
      checks.malware = true;
      riskScore += 70;
    }
    
    if (urlLower.includes('suspicious') || urlLower.includes('fake-domain')) {
      checks.blacklisted = true;
      riskScore += 50;
    }
    
    if (!url.startsWith('https://')) {
      riskScore += 20;
    }
    
    // Well-known safe domains
    if (domain.includes('google.com') || domain.includes('github.com') || domain.includes('microsoft.com')) {
      riskScore = Math.max(0, riskScore - 50);
      checks.reputation = true;
    }
    
    const getRiskLevel = (score: number): LinkAnalysis['overallRisk'] => {
      if (score >= 80) return 'dangerous';
      if (score >= 60) return 'high';
      if (score >= 40) return 'medium';
      if (score >= 20) return 'low';
      return 'safe';
    };
    
    const riskLevel = getRiskLevel(riskScore);
    
    setAnalysis({
      url,
      overallRisk: riskLevel,
      riskScore: Math.min(riskScore, 100),
      checks,
      details: {
        domain,
        domainAge: Math.random() > 0.5 ? '5 years' : '3 months',
        country: domain.includes('.ru') ? 'Russia' : domain.includes('.cn') ? 'China' : 'United States',
        redirects: Math.floor(Math.random() * 3),
        protocol: url.startsWith('https://') ? 'HTTPS' : 'HTTP',
        certificateValid: url.startsWith('https://') && !urlLower.includes('fake')
      },
      scanTime: new Date().toLocaleTimeString(),
      recommendations: riskLevel === 'dangerous' ? [
        'DO NOT visit this URL - high risk of malware or phishing',
        'Block this domain in your firewall',
        'Report to security team if received via email'
      ] : riskLevel === 'high' ? [
        'Exercise extreme caution before visiting',
        'Use a sandboxed environment if access is necessary',
        'Verify the URL source and legitimacy'
      ] : riskLevel === 'medium' ? [
        'Proceed with caution',
        'Ensure antivirus is up to date',
        'Do not enter sensitive information'
      ] : [
        'URL appears safe to visit',
        'Still exercise normal web browsing caution',
        'Verify if the content is what you expected'
      ]
    });
    
    setIsScanning(false);
  };

  const loadSampleUrl = (sampleUrl: string) => {
    setUrl(sampleUrl);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'dangerous': return 'text-red-600';
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      case 'safe': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'dangerous': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      case 'safe': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Link className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Ultrium SafeLink Demo</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive URL analysis and safety verification for malicious links
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* URL Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                URL Scanner
              </CardTitle>
              <CardDescription>
                Enter a URL to analyze for security threats and reputation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sample URLs:</label>
                <div className="flex flex-wrap gap-2">
                  {sampleUrls.map((sampleUrl, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      size="sm"
                      onClick={() => loadSampleUrl(sampleUrl)}
                      className="text-xs"
                    >
                      {new URL(sampleUrl.startsWith('http') ? sampleUrl : `https://${sampleUrl}`).hostname}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  placeholder="https://example.com or example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="font-mono"
                />
              </div>
              
              <Button 
                onClick={scanUrl}
                disabled={!url.trim() || isScanning}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning URL...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Scan URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8 text-muted-foreground">
                  Enter a URL to see comprehensive security analysis
                </div>
              ) : (
                <div className="space-y-6">
                  {/* URL and Risk Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Risk</span>
                      <Badge variant={getRiskBadgeVariant(analysis.overallRisk)}>
                        {analysis.overallRisk.toUpperCase()}
                      </Badge>
                    </div>
                    <Progress value={analysis.riskScore} className="h-3" />
                    <p className={`text-sm mt-1 ${getRiskColor(analysis.overallRisk)}`}>
                      {analysis.riskScore}/100 Risk Score
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {analysis.url}
                    </p>
                  </div>

                  {/* Security Checks */}
                  <div>
                    <h4 className="font-medium mb-3">Security Checks</h4>
                    <div className="space-y-2">
                      {Object.entries(analysis.checks).map(([check, passed]) => (
                        <div key={check} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{check.replace(/([A-Z])/g, ' $1')}</span>
                          <div className="flex items-center gap-1">
                            {passed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {passed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Domain Details */}
                  <div>
                    <h4 className="font-medium mb-3">Domain Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Domain:</span>
                        <span className="font-mono">{analysis.details.domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Age:</span>
                        <span>{analysis.details.domainAge}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Country:</span>
                        <span>{analysis.details.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Protocol:</span>
                        <span>{analysis.details.protocol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Redirects:</span>
                        <span>{analysis.details.redirects}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scan Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Scanned at {analysis.scanTime}
                  </div>

                  {/* Recommendations */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {analysis.recommendations.map((rec, index) => (
                          <div key={index} className="text-sm">• {rec}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};