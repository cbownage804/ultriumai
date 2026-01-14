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
  Upload,
  ArrowLeft,
  Info
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SafeScanBookmarklet } from "@/components/SafeScanBookmarklet";
import { BulkDocumentScanner } from "@/components/BulkDocumentScanner";
import { APIKeyManager } from "@/components/APIKeyManager";
import { ScheduledScans } from "@/components/ScheduledScans";
import { SafeScanBranding } from "@/components/SafeScanBranding";


interface ScanResult {
  type: 'email' | 'document' | 'url';
  content: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'unknown';
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
  const navigate = useNavigate();
  
  // Check if this is MSP context (could be enhanced with proper MSP detection)
  const isMSPContext = location.pathname.includes('/msp/') || window.location.hostname.includes('msp');
  
  // Guest mode - allow basic scanning without authentication
  const isGuestMode = !user;
  const [guestScanCount, setGuestScanCount] = useState(0);
  const GUEST_SCAN_LIMIT = 3;
  
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

  // Load scan history and stats (only for authenticated users)
  useEffect(() => {
    if (user) {
      loadScanHistory();
      loadStats();
    }
  }, [user]);

  const loadScanHistory = async () => {
    try {
      // Load from document_scans table for document scans
      const { data: docScans } = await supabase
        .from('document_scans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Load from gpt_analytics table for URL and other scans
      const { data: analyticsData } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .eq('interaction_type', 'security_scan')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const results: ScanResult[] = [];
      
      // Process document scans
      if (docScans) {
        docScans.forEach(scan => {
          const scanResult = scan.scan_result as any;
          results.push({
            type: 'document',
            content: scan.file_name,
            safe: scan.threat_level === 'safe',
            risk_level: scan.threat_level as any,
            threats_detected: scanResult?.threats || [],
            reputation_score: scanResult?.reputation_score || 50,
            scan_details: {
              file_type: scan.file_name.split('.').pop() || 'unknown',
              file_size: scan.file_size,
              scan_date: scan.created_at
            },
            scan_date: scan.created_at,
            recommendations: scanResult?.recommendations || []
          });
        });
      }
      
      // Process analytics data (URLs, etc)
      if (analyticsData) {
        analyticsData.forEach(item => {
          const metadata = item.metadata as any;
          results.push({
            type: metadata?.scan_type || 'unknown',
            content: metadata?.content || 'Security scan',
            safe: metadata?.risk_level === 'safe',
            risk_level: metadata?.risk_level || 'unknown',
            threats_detected: metadata?.threats_detected || [],
            reputation_score: metadata?.reputation_score || 50,
            scan_details: metadata?.scan_details || {},
            scan_date: item.created_at,
            recommendations: metadata?.recommendations || []
          });
        });
      }
      
      // Sort combined results by date
      results.sort((a, b) => new Date(b.scan_date).getTime() - new Date(a.scan_date).getTime());
      
      setScanHistory(results.slice(0, 10));
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
    // Check guest mode limits
    if (isGuestMode && guestScanCount >= GUEST_SCAN_LIMIT) {
      toast({
        title: "Guest Limit Reached",
        description: "Sign in to unlock unlimited scans and save your history",
        variant: "destructive"
      });
      return;
    }
    
    setIsScanning(true);
    console.log('Starting scan:', { type, content: typeof content === 'string' ? content.substring(0, 50) + '...' : (content as File).name });
    
    try {
      let functionName = '';
      let body: any = { user_id: user?.id || 'guest' };

      switch (type) {
        case 'email':
          functionName = 'safemail-scanner';
          body.action = 'scan_email';
          body.email = {
            subject: 'Email Scan',
            sender: 'unknown@example.com',
            content: content,
            timestamp: new Date().toISOString()
          };
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

      console.log('Calling function:', functionName, 'with body:', body);
      console.log('About to invoke Supabase function...');
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      console.log('Function response received:', { data, error });
      console.log('Raw data object:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      // Use the backend response directly - it already has correct risk assessment
      const scanResult = data?.scanResult || data;
      
      // The backend already calculated everything correctly, just use it
      const result = {
        type: type,
        content: typeof content === 'string' ? content.substring(0, 100) : (content as File).name,
        safe: data?.safe ?? false,
        risk_level: data?.risk_level || 'unknown',
        threats_detected: data?.threats_detected || [],
        reputation_score: data?.reputation_score || 0,
        scan_details: data?.scan_details || {},
        scan_date: new Date().toISOString(),
        recommendations: data?.recommendations || ['Scan completed']
      };

      console.log('Setting scan result:', result);
      setScanResult(result);
      
      // Send email notification for threats or if configured for all scans
      if (!result.safe || result.threats_detected.length > 0) {
        try {
          await supabase.functions.invoke('send-scan-notification', {
            body: {
              userEmail: user?.email || 'user@example.com',
              userName: user?.user_metadata?.full_name || 'User',
              scanType: type,
              threatCount: result.threats_detected.length,
              safe: result.safe,
              riskLevel: result.risk_level,
              fileName: type === 'document' ? (content as File).name : undefined,
              scanDetails: result.scan_details,
              isMSP: isMSPContext,
              clientName: isMSPContext ? 'Demo Client' : undefined
            }
          });
          console.log('Email notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send email notification:', notificationError);
          // Don't fail the scan if email fails
        }
      }
      
      // Only update history/stats for authenticated users
      if (user) {
        await loadScanHistory();
        await loadStats();
      } else {
        // Increment guest scan count
        setGuestScanCount(prev => prev + 1);
        // Add to local scan history for guests
        setScanHistory(prev => [result, ...prev.slice(0, 4)]);
      }
      
      toast({
        title: "Scan Complete",
        description: `${type} analyzed - Risk level: ${result.risk_level}`,
        variant: result.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      
      // Create a fallback error result
      const errorResult = {
        type: type,
        content: typeof content === 'string' ? content.substring(0, 100) : (content as File).name,
        safe: false,
        risk_level: 'unknown' as const,
        threats_detected: ['Scan failed - unable to analyze'],
        reputation_score: 0,
        scan_details: { error: error.message },
        scan_date: new Date().toISOString(),
        recommendations: ['Please try scanning again', 'Contact support if issue persists']
      };
      
      setScanResult(errorResult);
      
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
      {/* Guest Mode Banner */}
      {isGuestMode && (
        <Alert className="bg-primary/10 border-primary">
          <Info className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              <strong>Guest Mode:</strong> {GUEST_SCAN_LIMIT - guestScanCount} free scans remaining. 
              Sign in to unlock unlimited scans, save history, and access all features.
            </span>
            <Button 
              size="sm" 
              onClick={() => navigate('/vanguard/auth')}
              className="ml-4"
            >
              Sign In
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {isMSPContext ? "Back to MSP Dashboard" : "Back to Dashboard"}
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" style={{ color: brandColor }} />
              {isWhiteLabeled ? brandName : 'Ultrium'} SafeScan
              {isMSPContext && <Badge variant="secondary">MSP Edition</Badge>}
              {isGuestMode && <Badge variant="outline">Demo</Badge>}
            </h1>
            <p className="text-muted-foreground">
              {isMSPContext 
                ? "MSP security scanning for client emails, documents, and URLs" 
                : "Comprehensive security scanning for emails, documents, and URLs"
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isGuestMode && (
            <Button 
              variant="secondary"
              onClick={() => window.open('/safescan-embed-demo', '_blank')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Widget Demo
            </Button>
          )}
          {isMSPContext && (
            <Button 
              variant="outline"
              onClick={() => setActiveTab('deployment')}
            >
              <Zap className="h-4 w-4 mr-2" />
              Client Deployment
            </Button>
          )}
          {isGuestMode && (
            <Button onClick={() => navigate('/vanguard/auth')}>
              Sign In for Full Access
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {isGuestMode ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demo Scans</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestScanCount}/{GUEST_SCAN_LIMIT}</div>
              <p className="text-xs text-muted-foreground">
                Free scans used
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-3 bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unlock Full Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Sign in to access unlimited scans, scan history, bulk scanning, API access, scheduled scans, and more.
              </p>
              <Button size="sm" onClick={() => navigate('/vanguard/auth')}>
                Get Started Free
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
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
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className={`grid w-full ${isGuestMode ? 'grid-cols-4' : (isMSPContext ? 'grid-cols-10' : 'grid-cols-9')}`}>
          <TabsTrigger value="email">Email Security</TabsTrigger>
          <TabsTrigger value="document">Document Scanning</TabsTrigger>
          <TabsTrigger value="url">URL Analysis</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
          {!isGuestMode && (
            <>
              <TabsTrigger value="bulk">Bulk Scanner</TabsTrigger>
              <TabsTrigger value="api">API Access</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduling</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="bookmarklet">Bookmarklet</TabsTrigger>
            </>
          )}
          {isMSPContext && !isGuestMode && <TabsTrigger value="deployment">Client Deployment</TabsTrigger>}
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

            {/* Beautiful Results Display */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Scan Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!scanResult ? (
                  <div className="text-center py-16 px-6">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full animate-pulse" />
                      </div>
                      <div className="relative z-10 p-4 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 w-fit mx-auto">
                        <Shield className="h-12 w-12 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Scan</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Run a security scan to see detailed threat analysis and recommendations
                    </p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    {/* Status Hero Section */}
                    <div className="relative overflow-hidden">
                      <div className={`absolute inset-0 ${
                        scanResult.safe 
                          ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30' 
                          : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-yellow-950/30'
                      }`} />
                      
                      <div className="relative p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl shadow-lg ${
                              scanResult.safe 
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                                : 'bg-gradient-to-br from-red-500 to-orange-600'
                            }`}>
                              {scanResult.safe ? (
                                <CheckCircle className="h-8 w-8 text-white" />
                              ) : (
                                <XCircle className="h-8 w-8 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">
                                {scanResult.safe ? 'Content is Safe' : 'Threats Detected'}
                              </h3>
                              <p className="text-muted-foreground">
                                {scanResult.type.charAt(0).toUpperCase() + scanResult.type.slice(1)} security analysis complete
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge 
                              variant={getRiskBadgeVariant(scanResult.risk_level)} 
                              className="text-lg px-4 py-2 font-bold shadow-md"
                            >
                              {scanResult.risk_level?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              Risk Assessment
                            </div>
                          </div>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                              {scanResult.reputation_score || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Reputation Score</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                              {scanResult.threats_detected?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Threats Found</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                              {scanResult.type === 'url' ? 'URL' : scanResult.type === 'email' ? 'Email' : 'Doc'}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Content Type</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Scanned Content */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-lg">
                          {scanResult.type === 'url' && <Link className="h-5 w-5 text-blue-500" />}
                          {scanResult.type === 'email' && <Mail className="h-5 w-5 text-green-500" />}
                          {scanResult.type === 'document' && <FileText className="h-5 w-5 text-purple-500" />}
                          Analyzed Content
                        </h4>
                        <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                          <code className="text-sm text-muted-foreground break-all font-mono">
                            {scanResult.content}
                          </code>
                        </div>
                      </div>

                      {/* Threats Section */}
                      {scanResult.threats_detected && scanResult.threats_detected.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Security Threats ({scanResult.threats_detected.length})
                          </h4>
                          <div className="space-y-2">
                            {scanResult.threats_detected.map((threat, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <div className="p-1 rounded-full bg-red-100 dark:bg-red-900">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm font-medium text-red-800 dark:text-red-200">{threat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            Security Recommendations
                          </h4>
                          <div className="space-y-2">
                            {scanResult.recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                <div className="p-1 rounded-full bg-green-100 dark:bg-green-900 mt-0.5">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">{recommendation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scan Timestamp */}
                      <div className="pt-4 border-t border-muted-foreground/10">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Scan completed at {new Date(scanResult.scan_date).toLocaleString()}</span>
                          <span className="font-medium">Powered by Ultrium SafeScan™</span>
                        </div>
                      </div>
                    </div>
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
                   Scan documents for malware and threats. Supports 25+ file types including PDFs, Office docs, images, and archives.
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
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.html,.htm,.xml,.json,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.tif,.zip,.rar,.7z,.tar,.gz"
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

            {/* Beautiful Results Display */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Scan Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!scanResult ? (
                  <div className="text-center py-16 px-6">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-purple-300/5 rounded-full animate-pulse" />
                      </div>
                      <div className="relative z-10 p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-300/5 w-fit mx-auto">
                        <FileText className="h-12 w-12 text-purple-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload Document</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Upload a document to scan for malware and security threats
                    </p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    {/* Status Hero Section */}
                    <div className="relative overflow-hidden">
                      <div className={`absolute inset-0 ${
                        scanResult.safe 
                          ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30' 
                          : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-yellow-950/30'
                      }`} />
                      
                      <div className="relative p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl shadow-lg ${
                              scanResult.safe 
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                                : 'bg-gradient-to-br from-red-500 to-orange-600'
                            }`}>
                              {scanResult.safe ? (
                                <CheckCircle className="h-8 w-8 text-white" />
                              ) : (
                                <XCircle className="h-8 w-8 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">
                                {scanResult.safe ? 'Document is Safe' : 'Threats Detected'}
                              </h3>
                              <p className="text-muted-foreground">
                                Document security analysis complete
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge 
                              variant={getRiskBadgeVariant(scanResult.risk_level)} 
                              className="text-lg px-4 py-2 font-bold shadow-md"
                            >
                              {scanResult.risk_level?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              Risk Assessment
                            </div>
                          </div>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                              {scanResult.reputation_score || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Reputation Score</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                              {scanResult.threats_detected?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Threats Found</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                              Doc
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Content Type</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Scanned Content */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5 text-purple-500" />
                          Analyzed Document
                        </h4>
                        <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                          <code className="text-sm text-muted-foreground break-all font-mono">
                            {scanResult.content}
                          </code>
                        </div>
                      </div>

                      {/* Threats Section */}
                      {scanResult.threats_detected && scanResult.threats_detected.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Security Threats ({scanResult.threats_detected.length})
                          </h4>
                          <div className="space-y-2">
                            {scanResult.threats_detected.map((threat, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <div className="p-1 rounded-full bg-red-100 dark:bg-red-900">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm font-medium text-red-800 dark:text-red-200">{threat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            Security Recommendations
                          </h4>
                          <div className="space-y-2">
                            {scanResult.recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                <div className="p-1 rounded-full bg-green-100 dark:bg-green-900 mt-0.5">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">{recommendation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scan Timestamp */}
                      <div className="pt-4 border-t border-muted-foreground/10">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Scan completed at {new Date(scanResult.scan_date).toLocaleString()}</span>
                          <span className="font-medium">Powered by Ultrium SafeScan™</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <BulkDocumentScanner 
            isMSPContext={isMSPContext}
            onScanComplete={(results) => {
              // Send email notifications for bulk scans
              results.forEach(async (result, index) => {
                if (!result.error && result.result) {
                  try {
                    await supabase.functions.invoke('send-scan-notification', {
                      body: {
                        userEmail: user?.email || 'user@example.com',
                        userName: user?.user_metadata?.full_name || 'User',
                        scanType: 'bulk',
                        threatCount: result.result.threats_detected?.length || 0,
                        safe: result.result.safe,
                        riskLevel: result.result.risk_level || 'unknown',
                        fileName: result.file.name,
                        scanDetails: result.result.scan_details,
                        isMSP: isMSPContext,
                        clientName: isMSPContext ? 'Demo Client' : undefined
                      }
                    });
                  } catch (error) {
                    console.error('Failed to send notification for bulk scan result:', error);
                  }
                }
              });
              
              // Refresh stats after bulk scan
              loadStats();
              loadScanHistory();
            }}
          />
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

            {/* Beautiful Results Display */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  Scan Results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!scanResult ? (
                  <div className="text-center py-16 px-6">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-300/5 rounded-full animate-pulse" />
                      </div>
                      <div className="relative z-10 p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-300/5 w-fit mx-auto">
                        <Link className="h-12 w-12 text-blue-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Enter URL</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Enter a URL to analyze for phishing and malicious content
                    </p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    {/* Status Hero Section */}
                    <div className="relative overflow-hidden">
                      <div className={`absolute inset-0 ${
                        scanResult.safe 
                          ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30' 
                          : 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-yellow-950/30'
                      }`} />
                      
                      <div className="relative p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl shadow-lg ${
                              scanResult.safe 
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                                : 'bg-gradient-to-br from-red-500 to-orange-600'
                            }`}>
                              {scanResult.safe ? (
                                <CheckCircle className="h-8 w-8 text-white" />
                              ) : (
                                <XCircle className="h-8 w-8 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">
                                {scanResult.safe ? 'URL is Safe' : 'Threats Detected'}
                              </h3>
                              <p className="text-muted-foreground">
                                URL security analysis complete
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge 
                              variant={getRiskBadgeVariant(scanResult.risk_level)} 
                              className="text-lg px-4 py-2 font-bold shadow-md"
                            >
                              {scanResult.risk_level?.toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              Risk Assessment
                            </div>
                          </div>
                        </div>
                        
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                              {scanResult.reputation_score || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Reputation Score</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                              {scanResult.threats_detected?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Threats Found</div>
                          </div>
                          <div className="text-center p-4 rounded-xl bg-white/60 dark:bg-black/20 backdrop-blur-sm border border-white/20">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                              URL
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Content Type</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Scanned Content */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2 text-lg">
                          <Link className="h-5 w-5 text-blue-500" />
                          Analyzed URL
                        </h4>
                        <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                          <code className="text-sm text-muted-foreground break-all font-mono">
                            {scanResult.content}
                          </code>
                        </div>
                      </div>

                      {/* Threats Section */}
                      {scanResult.threats_detected && scanResult.threats_detected.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2 text-lg text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-5 w-5" />
                            Security Threats ({scanResult.threats_detected.length})
                          </h4>
                          <div className="space-y-2">
                            {scanResult.threats_detected.map((threat, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                                <div className="p-1 rounded-full bg-red-100 dark:bg-red-900">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <span className="text-sm font-medium text-red-800 dark:text-red-200">{threat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {scanResult.recommendations && scanResult.recommendations.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                            <CheckCircle className="h-5 w-5" />
                            Security Recommendations
                          </h4>
                          <div className="space-y-2">
                            {scanResult.recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                                <div className="p-1 rounded-full bg-green-100 dark:bg-green-900 mt-0.5">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">{recommendation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Scan Timestamp */}
                      <div className="pt-4 border-t border-muted-foreground/10">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Scan completed at {new Date(scanResult.scan_date).toLocaleString()}</span>
                          <span className="font-medium">Powered by Ultrium SafeScan™</span>
                        </div>
                      </div>
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
              <CardTitle className="flex items-center justify-between">
                <span>Recent Scans</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                  <Info className="h-3 w-3" />
                  <span>Only 20 most recent scans kept</span>
                </div>
              </CardTitle>
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


        <TabsContent value="api" className="space-y-4">
          <APIKeyManager />
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <ScheduledScans />
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <SafeScanBranding />
        </TabsContent>

        {/* MSP Client Deployment Tab */}
        {isMSPContext && (
          <TabsContent value="deployment">
            <SafeScanBookmarklet />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};