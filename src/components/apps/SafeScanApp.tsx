import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail,
  FileText,
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
  Zap,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ScanResult {
  type: 'email' | 'document' | 'url';
  content: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  reputation_score: number;
  scan_details: any;
  scan_date: string;
  recommendations: string[];
}

interface SafeScanAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafeScanApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafeScanAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('email');
  const [emailContent, setEmailContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    safeItems: 0,
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
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        const results = data.map(item => {
          const metadata = item.metadata as any;
          return {
            type: metadata?.scan_type || 'unknown',
            content: metadata?.content || 'Security scan',
            safe: metadata?.risk_level === 'safe',
            risk_level: metadata?.risk_level || 'unknown',
            threats_detected: metadata?.threats_detected || [],
            reputation_score: metadata?.reputation_score || 50,
            scan_details: metadata?.scan_details || {},
            scan_date: item.created_at,
            recommendations: metadata?.recommendations || []
          };
        }) as ScanResult[];
        
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
        .eq('interaction_type', 'security_scan');
      
      if (data) {
        const totalScans = data.length;
        const threatsBlocked = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level && ['high', 'critical'].includes(metadata.risk_level);
        }).length;
        const safeItems = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level === 'safe';
        }).length;
        const avgRisk = totalScans > 0 ? Math.round(((totalScans - safeItems) / totalScans) * 100) : 0;
        
        setStats({
          totalScans,
          threatsBlocked,
          safeItems,
          riskScore: avgRisk
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const performScan = async (type: 'email' | 'document' | 'url', content: string | File) => {
    setIsScanning(true);
    try {
      let functionName = '';
      let body: any = { user_id: user?.id };

      switch (type) {
        case 'email':
          functionName = 'safemail-scanner';
          body.email_content = content;
          break;
        case 'url':
          functionName = 'ultrium-safelink-scanner';
          body.url = content;
          break;
        case 'document':
          functionName = 'safedoc-scanner';
          // For demo purposes, we'll simulate document scanning
          body.file_name = (content as File).name;
          body.file_size = (content as File).size;
          break;
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;
      
      setScanResult(data as ScanResult);
      await loadScanHistory();
      await loadStats();
      
      toast({
        title: "Scan Complete",
        description: `${type} analyzed - Risk level: ${data.risk_level}`,
        variant: data.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || `Failed to scan ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const scanEmail = () => {
    if (!emailContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter email content to scan",
        variant: "destructive"
      });
      return;
    }
    performScan('email', emailContent);
  };

  const scanUrl = () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to scan",
        variant: "destructive"
      });
      return;
    }
    performScan('url', urlInput);
  };

  const scanDocument = () => {
    if (!documentFile) {
      toast({
        title: "Error",
        description: "Please select a document to scan",
        variant: "destructive"
      });
      return;
    }
    performScan('document', documentFile);
  };

  const loadSampleEmail = () => {
    setEmailContent(`From: security@your-bank.com
Subject: Urgent: Account Security Alert

We detected suspicious activity. Click here to verify: https://malicious-site.com/verify`);
  };

  const loadSampleUrl = () => {
    setUrlInput('https://malicious-example-phishing-site.com/login');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocumentFile(file);
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" style={{ color: brandColor }} />
            {isWhiteLabeled ? brandName : 'Ultrium'} SafeScan
          </h1>
          <p className="text-muted-foreground">
            Comprehensive security scanning for emails, documents, and URLs
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => window.open('/safescan-embed-demo', '_blank')}
          >
            <Globe className="h-4 w-4 mr-2" />
            MSP Widget Demo
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Scanned</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
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
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.threatsBlocked}</div>
            <p className="text-xs text-muted-foreground">
              Malicious items detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Items</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.safeItems}</div>
            <p className="text-xs text-muted-foreground">
              Verified legitimate content
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email">Email Security</TabsTrigger>
          <TabsTrigger value="document">Document Scanning</TabsTrigger>
          <TabsTrigger value="url">URL Analysis</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Security Scanner
                </CardTitle>
                <CardDescription>
                  Analyze email content for phishing and threats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" size="sm" onClick={loadSampleEmail}>
                  Load Sample Phishing Email
                </Button>

                <div>
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Paste email content here..."
                    rows={8}
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  onClick={scanEmail}
                  disabled={!emailContent.trim() || isScanning}
                  className="w-full"
                  variant="hero"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Email...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Scan Email for Threats
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results card would be shared across all tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Run a scan to see detailed security analysis
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{scanResult.type.toUpperCase()} SCAN</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {scanResult.content}
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeVariant(scanResult.risk_level)} className="ml-2">
                        {scanResult.risk_level.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {scanResult.safe ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={`font-medium ${getRiskColor(scanResult.risk_level)}`}>
                        {scanResult.safe ? 'Safe to use' : 'Security threats detected'}
                      </span>
                    </div>

                    {scanResult.threats_detected.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Threats Detected</h4>
                        <div className="space-y-1">
                          {scanResult.threats_detected.map((threat, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                              <XCircle className="h-3 w-3" />
                              <span>{threat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scanResult.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recommendations</h4>
                        <div className="space-y-1">
                          {scanResult.recommendations.map((recommendation, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{recommendation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Similar patterns for document and url tabs... */}
        <TabsContent value="document" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Security Scanner
                </CardTitle>
                <CardDescription>
                  Scan documents for malware and threats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="document-upload">Upload Document</Label>
                  <div className="mt-1">
                    <input
                      id="document-upload"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      className="hidden"
                    />
                    <label 
                      htmlFor="document-upload"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {documentFile ? documentFile.name : 'Click to upload or drag and drop'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <Button 
                  onClick={scanDocument}
                  disabled={!documentFile || isScanning}
                  className="w-full"
                  variant="hero"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Document...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Scan Document for Malware
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Shared results card */}
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Upload a document to see security analysis
                  </div>
                ) : (
                  // Same results display as above
                  <div className="space-y-4">
                    {/* Results content here */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  URL Security Scanner
                </CardTitle>
                <CardDescription>
                  Analyze URLs for phishing and malware
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" size="sm" onClick={loadSampleUrl}>
                  Load Sample Malicious URL
                </Button>

                <div>
                  <Label htmlFor="url-input">Enter URL to Scan</Label>
                  <Input
                    id="url-input"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
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
                      <Link className="mr-2 h-4 w-4" />
                      Scan URL for Threats
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Shared results card */}
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Enter a URL to see security analysis
                  </div>
                ) : (
                  // Same results display
                  <div className="space-y-4">
                    {/* Results content here */}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>
                Your recent security scan history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scan history available
                </div>
              ) : (
                <div className="space-y-4">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {scan.type === 'email' && <Mail className="h-4 w-4" />}
                        {scan.type === 'document' && <FileText className="h-4 w-4" />}
                        {scan.type === 'url' && <Link className="h-4 w-4" />}
                        <div>
                          <div className="font-medium">{scan.type} scan</div>
                          <div className="text-sm text-muted-foreground">{scan.content}</div>
                        </div>
                      </div>
                      <Badge variant={getRiskBadgeVariant(scan.risk_level)}>
                        {scan.risk_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};