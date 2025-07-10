import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  BarChart3,
  TrendingUp,
  Users,
  Loader2,
  Copy,
  FileText,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EmailScanResult {
  email: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  reputation_score: number;
  scan_details: {
    spf_valid: boolean;
    dkim_valid: boolean;
    dmarc_valid: boolean;
    sender_reputation: number;
    content_analysis: {
      spam_score: number;
      phishing_indicators: string[];
      suspicious_attachments: number;
    };
    scan_date: string;
  };
  recommendations: string[];
}

interface SafeMailAppProps {
  isWhiteLabeled?: boolean;
  brandColor?: string;
  brandName?: string;
}

export const SafeMailApp = ({ isWhiteLabeled = false, brandColor = '#3b82f6', brandName = 'Ultrium AI' }: SafeMailAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [emailText, setEmailText] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<EmailScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<EmailScanResult[]>([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsBlocked: 0,
    safeEmails: 0,
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
        .eq('metadata->>scan_type', 'email')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        // Convert analytics data to scan results format
        const results = data.map(item => {
          const metadata = item.metadata as any;
          return {
            email: metadata?.sender_email || 'Email scan',
            safe: metadata?.risk_level === 'safe',
            risk_level: metadata?.risk_level || 'unknown',
            threats_detected: metadata?.threats_count ? [`${metadata.threats_count} threats detected`] : [],
            reputation_score: 50,
            scan_details: {
              spf_valid: true,
              dkim_valid: true,
              dmarc_valid: true,
              sender_reputation: 50,
              content_analysis: {
                spam_score: 0,
                phishing_indicators: [],
                suspicious_attachments: 0
              },
              scan_date: item.created_at
            },
            recommendations: []
          };
        }) as EmailScanResult[];
        
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
        .eq('metadata->>scan_type', 'email');
      
      if (data) {
        const totalScans = data.length;
        const threatsBlocked = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level && ['high', 'critical'].includes(metadata.risk_level);
        }).length;
        const safeEmails = data.filter(item => {
          const metadata = item.metadata as any;
          return metadata?.risk_level === 'safe';
        }).length;
        const avgRisk = totalScans > 0 ? Math.round(((totalScans - safeEmails) / totalScans) * 100) : 0;
        
        setStats({
          totalScans,
          threatsBlocked,
          safeEmails,
          riskScore: avgRisk
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const scanEmail = async () => {
    if (!emailText.trim() && !senderEmail.trim()) {
      toast({
        title: "Error",
        description: "Please provide email content or sender email",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('safemail-scanner', {
        body: {
          action: 'scan_email',
          email: {
            subject: 'Email Analysis', // We can extract this from content later if needed
            sender: senderEmail || 'unknown@unknown.com',
            content: emailText,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      
      setScanResult(data as EmailScanResult);
      await loadScanHistory();
      await loadStats();
      
      toast({
        title: "Scan Complete",
        description: `Email analyzed - Risk level: ${data.risk_level}`,
        variant: data.safe ? "default" : "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan email",
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

  const loadSampleEmail = () => {
    setEmailText(`From: security@paypal.com
Subject: Urgent: Verify Your Account Now
Dear Customer,
We've detected suspicious activity on your PayPal account. Please click the link below to verify your account immediately or it will be suspended within 24 hours.
Verify Now: https://paypal-security-verify.net/login
Thank you,
PayPal Security Team`);
    setSenderEmail('security@paypal.com');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" style={{ color: brandColor }} />
            {isWhiteLabeled ? brandName : 'Ultrium'} SafeMail
          </h1>
          <p className="text-muted-foreground">
            AI-powered email security analysis and threat detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary"
            onClick={() => window.open('/safemail-embed-demo', '_blank')}
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
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              Email security checks
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
              Malicious emails detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Safe Emails</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.safeEmails}</div>
            <p className="text-xs text-muted-foreground">
              Verified legitimate emails
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
          <TabsTrigger value="scanner">Email Scanner</TabsTrigger>
          <TabsTrigger value="history">Scan History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Security Scanner
                </CardTitle>
                <CardDescription>
                  Analyze emails for phishing, malware, and security threats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={loadSampleEmail}
                >
                  Load Sample Phishing Email
                </Button>

                <div>
                  <Label htmlFor="sender-email">Sender Email (Optional)</Label>
                  <Input
                    id="sender-email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="sender@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    placeholder="Paste email content here..."
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                
                <Button 
                  onClick={scanEmail}
                  disabled={(!emailText.trim() && !senderEmail.trim()) || isScanning}
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
                      <Shield className="mr-2 h-4 w-4" />
                      Scan Email for Threats
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scan Results */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Scan an email to see detailed security analysis
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Risk Assessment</span>
                        <Badge variant={getRiskBadgeVariant(scanResult.risk_level)}>
                          {scanResult.risk_level.toUpperCase()}
                        </Badge>
                      </div>
                      <Progress value={100 - scanResult.reputation_score} className="h-3" />
                      <p className={`text-sm mt-1 ${getRiskColor(scanResult.risk_level)}`}>
                        Reputation Score: {scanResult.reputation_score}/100
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Threats Detected</h4>
                      {scanResult.threats_detected.length > 0 ? (
                        <div className="space-y-1">
                          {scanResult.threats_detected.map((threat, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>{threat}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>No threats detected</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Authentication Status</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          {scanResult.scan_details.spf_valid ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span>SPF</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {scanResult.scan_details.dkim_valid ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span>DKIM</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {scanResult.scan_details.dmarc_valid ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span>DMARC</span>
                        </div>
                      </div>
                    </div>

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
                Recent Email Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scan history yet. Start by scanning your first email!
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${scan.safe ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-medium">{scan.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(scan.scan_details.scan_date).toLocaleDateString()}
                          </div>
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
                    <span>Safe Emails</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${stats.totalScans > 0 ? (stats.safeEmails / stats.totalScans) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{stats.safeEmails}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Threats Blocked</span>
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
                  <Users className="h-5 w-5" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Enable email authentication (SPF, DKIM, DMARC) for your domain to improve email security.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Train your team to recognize phishing attempts and suspicious email patterns.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Consider implementing email security gateway for automated threat filtering.
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