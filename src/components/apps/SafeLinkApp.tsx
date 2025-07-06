import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Link, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  BarChart3,
  TrendingUp,
  ExternalLink,
  Loader2,
  Clock,
  Copy,
  Eye,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LinkScanResult {
  url: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  reputation_score: number;
  scan_details: {
    domain_age: number;
    ssl_valid: boolean;
    redirect_count: number;
    blacklist_status: boolean;
    category: string;
    final_url: string;
  };
  scan_date: string;
  recommendations: string[];
}

interface SafeLinkAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafeLinkApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafeLinkAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [urlInput, setUrlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<LinkScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<LinkScanResult[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    safeUrls: 0,
    riskScore: 0
  });

  // Load scan history and stats
  useEffect(() => {
    if (user) {
      loadScanHistory();
      loadStats();
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      const { data } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan')
        .eq('metadata->>scan_type', 'url')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        const results = data.map(item => {
          const metadata = item.metadata as any;
          return {
            url: metadata?.url || 'URL scan',
            safe: metadata?.risk_level === 'safe',
            risk_level: metadata?.risk_level || 'unknown',
            threats_detected: metadata?.threats_detected || [],
            reputation_score: metadata?.reputation_score || 50,
            scan_details: {
              domain_age: metadata?.domain_age || 0,
              ssl_valid: metadata?.ssl_valid || false,
              redirect_count: metadata?.redirect_count || 0,
              blacklist_status: metadata?.blacklist_status || false,
              category: metadata?.category || 'Unknown',
              final_url: metadata?.final_url || metadata?.url || ''
            },
            scan_date: item.created_at,
            recommendations: metadata?.recommendations || []
          };
        }) as LinkScanResult[];
        
        setScanHistory(results);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan')
        .eq('metadata->>scan_type', 'url');
      
      if (data) {
        const totalScans = data.length;
        const threatsBlocked = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level && ['high', 'critical'].includes(metadata.risk_level);
        }).length;
        const safeUrls = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level === 'safe';
        }).length;
        const avgRisk = totalScans > 0 ? Math.round(((totalScans - safeUrls) / totalScans) * 100) : 0;
        
        setStats({
          totalScans,
          threatsBlocked,
          safeUrls,
          riskScore: avgRisk
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const scanUrl = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to scan",
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput.startsWith('http') ? urlInput : `https://${urlInput}`);
    } catch {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ultrium-safelink-scanner', {
        body: {
          url: urlInput.startsWith('http') ? urlInput : `https://${urlInput}`,
          user_id: user?.id
        }
      });

      if (error) throw error;
      
      setScanResult(data as LinkScanResult);
      await loadScanHistory();
      await loadStats();
      
      toast({
        title: "Scan Complete",
        description: `URL analyzed - Risk level: ${data.risk_level}`,
        variant: data.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan URL",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      case 'safe': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'critical':
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low':
      case 'safe': return 'default';
      default: return 'outline';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const loadSampleUrl = () => {
    setUrlInput('https://malicious-example-phishing-site.com/login');
  };

  const visitUrl = (url: string, safe: boolean) => {
    if (!safe) {
      toast({
        title: "Warning",
        description: "This URL has been flagged as potentially dangerous. Proceed with caution.",
        variant: "destructive"
      });
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Link className="h-8 w-8" style={{ color: brandColor }} />
            {isWhiteLabeled ? brandName : 'Ultrium'} SafeLink
          </h1>
          <p className="text-muted-foreground">
            Advanced URL security scanning and threat detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => window.open('/safelink-embed-demo', '_blank')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Embeddable Widget Demo
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">URLs Scanned</CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              Security checks performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.threatsBlocked}</div>
            <p className="text-xs text-muted-foreground">
              Malicious URLs detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe URLs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.safeUrls}</div>
            <p className="text-xs text-muted-foreground">
              Verified legitimate links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.riskScore}%</div>
            <Progress value={stats.riskScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="scanner" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scanner">URL Scanner</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* URL Scanner Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  URL Security Scanner
                </CardTitle>
                <CardDescription>
                  Analyze URLs for phishing, malware, and security threats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadSampleUrl}
                >
                  Load Sample Malicious URL
                </Button>

                <div>
                  <Label htmlFor="url-input">Enter URL to Scan</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="url-input"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com or example.com"
                      onKeyPress={(e) => e.key === 'Enter' && scanUrl()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(urlInput)}
                      disabled={!urlInput.trim()}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={scanUrl}
                  disabled={!urlInput.trim() || isScanning}
                  className="w-full"
                  variant="hero"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning URL...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Scan URL for Threats
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Enter a URL to see detailed security analysis
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{scanResult.url}</div>
                        {scanResult.scan_details.final_url !== scanResult.url && (
                          <div className="text-xs text-muted-foreground truncate">
                            Redirects to: {scanResult.scan_details.final_url}
                          </div>
                        )}
                      </div>
                      <Badge variant={getRiskBadgeVariant(scanResult.risk_level)} className="ml-2">
                        {scanResult.risk_level.toUpperCase()}
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Security Assessment</span>
                        <div className="flex items-center gap-2">
                          {scanResult.safe ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${getRiskColor(scanResult.risk_level)}`}>
                            {scanResult.safe ? 'Safe' : 'Potentially Dangerous'}
                          </span>
                        </div>
                      </div>
                      <Progress value={scanResult.reputation_score} className="h-3" />
                      <p className="text-sm mt-1 text-muted-foreground">
                        Reputation Score: {scanResult.reputation_score}/100
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">URL Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {scanResult.scan_details.ssl_valid ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>SSL Certificate</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!scanResult.scan_details.blacklist_status ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <XCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span>Blacklist Status</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div><strong>Category:</strong> {scanResult.scan_details.category}</div>
                          <div><strong>Redirects:</strong> {scanResult.scan_details.redirect_count}</div>
                        </div>
                      </div>
                    </div>

                    {scanResult.threats_detected.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Threats Detected</h4>
                        <div className="space-y-1">
                          {scanResult.threats_detected.map((threat, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>{threat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.recommendations.length > 0 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4 space-y-1">
                            {scanResult.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(scanResult.url)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => visitUrl(scanResult.url, scanResult.safe)}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Site
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent URL Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scan history yet. Start by scanning your first URL!
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${scan.safe ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{scan.url}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(scan.scan_date).toLocaleDateString()} • {scan.scan_details.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(scan.risk_level)}>
                          {scan.risk_level}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => visitUrl(scan.url, scan.safe)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Threat Detection Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Safe URLs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${stats.totalScans > 0 ? (stats.safeUrls / stats.totalScans) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.safeUrls}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Malicious URLs</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${stats.totalScans > 0 ? (stats.threatsBlocked / stats.totalScans) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.threatsBlocked}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Always verify URLs before clicking, especially in emails from unknown senders.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Implement DNS filtering to block access to known malicious domains automatically.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Use browser security extensions to get real-time URL reputation checks.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};