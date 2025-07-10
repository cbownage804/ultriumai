import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Upload,
  Loader2,
  Eye,
  Download,
  Bot,
  Activity
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  type: 'email' | 'document' | 'url';
  content: string;
  safe: boolean;
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threats_detected: string[];
  recommendations: string[];
  details: any;
}

export const SafeScanDemo = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('email');
  const [emailContent, setEmailContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const loadSampleEmail = () => {
    setEmailContent(`From: security@your-bank.com
To: customer@example.com
Subject: Urgent: Account Security Alert - Immediate Action Required

Dear Valued Customer,

We have detected suspicious activity on your account. For your security, we have temporarily restricted access to your online banking.

To restore full access, please verify your identity immediately by clicking the link below:
https://secure-bank-verification.malicious-site.com/verify?token=xyz123

WARNING: Failure to verify within 24 hours will result in permanent account closure.

Best regards,
Security Team
Your Bank`);
  };

  const loadSampleUrl = () => {
    setUrlInput('https://phishing-example-bank-login.malicious-site.com');
  };

  const simulateEmailScan = () => {
    if (!emailContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter email content to scan",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      const result: ScanResult = {
        type: 'email',
        content: emailContent.substring(0, 100) + '...',
        safe: false,
        risk_level: 'critical',
        threats_detected: [
          'Phishing attempt detected',
          'Suspicious URL found',
          'Social engineering indicators',
          'Domain spoofing attempt'
        ],
        recommendations: [
          'Do not click any links in this email',
          'Verify sender through official channels',
          'Report this email to your IT security team',
          'Delete this email immediately'
        ],
        details: {
          sender_reputation: 15,
          suspicious_links: 1,
          social_engineering_score: 95,
          domain_authenticity: 'Spoofed'
        }
      };
      
      setScanResult(result);
      setIsScanning(false);
      
      toast({
        title: "Email Scan Complete",
        description: "Critical threats detected in email content",
        variant: "destructive"
      });
    }, 2000);
  };

  const simulateUrlScan = () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to scan",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    setTimeout(() => {
      const result: ScanResult = {
        type: 'url',
        content: urlInput,
        safe: false,
        risk_level: 'high',
        threats_detected: [
          'Phishing site detected',
          'Malicious domain',
          'SSL certificate invalid',
          'Known blacklisted site'
        ],
        recommendations: [
          'Do not visit this website',
          'Block this domain in your network',
          'Report to security team',
          'Use official banking website instead'
        ],
        details: {
          reputation_score: 20,
          ssl_valid: false,
          blacklist_status: true,
          category: 'Phishing/Banking'
        }
      };
      
      setScanResult(result);
      setIsScanning(false);
      
      toast({
        title: "URL Scan Complete",
        description: "High-risk threats detected",
        variant: "destructive"
      });
    }, 1500);
  };

  const simulateDocumentScan = () => {
    if (!documentFile) {
      toast({
        title: "Error",
        description: "Please select a document to scan",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    
    setTimeout(() => {
      const result: ScanResult = {
        type: 'document',
        content: documentFile.name,
        safe: true,
        risk_level: 'safe',
        threats_detected: [],
        recommendations: [
          'Document appears safe to open',
          'No malware detected',
          'Clean file signature'
        ],
        details: {
          file_type: documentFile.type,
          file_size: documentFile.size,
          malware_detected: false,
          suspicious_macros: false
        }
      };
      
      setScanResult(result);
      setIsScanning(false);
      
      toast({
        title: "Document Scan Complete",
        description: "Document is safe to use",
        variant: "default"
      });
    }, 2500);
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Introduction Section */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6" />
            SafeScan AI: Revolutionary Multi-Vector Security Platform
          </CardTitle>
          <CardDescription className="text-base">
            Experience the next generation of security scanning with AI-powered threat detection that analyzes emails, 
            documents, and URLs simultaneously using advanced behavioral analysis and real-time threat intelligence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Email Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Advanced phishing detection with sender reputation analysis, social engineering pattern recognition, and malicious link identification
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Document Forensics</h3>
              <p className="text-sm text-muted-foreground">
                Deep file analysis with macro detection, embedded threat scanning, and behavioral content analysis across all document types
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Link className="h-6 w-6 text-info" />
              </div>
              <h3 className="font-semibold mb-2">URL Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Real-time reputation analysis with domain aging detection, SSL validation, and threat actor infrastructure mapping
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Capabilities Highlight */}
      <Card className="border-2 border-success/20 bg-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-success" />
            Revolutionary AI Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Behavioral Analysis Engine
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Real-time pattern recognition across all content types
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Cross-reference analysis between emails, files, and URLs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Adaptive learning from threat intelligence feeds
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Threat Intelligence Integration
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Live threat actor infrastructure monitoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Global reputation scoring with contextual analysis
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-success" />
                  Predictive threat modeling and early warning systems
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Security
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Scanning
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            URL Analysis
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'email' && <Mail className="h-5 w-5" />}
                {activeTab === 'document' && <FileText className="h-5 w-5" />}
                {activeTab === 'url' && <Link className="h-5 w-5" />}
                {activeTab === 'email' && 'Email Security Scanner'}
                {activeTab === 'document' && 'Document Security Scanner'}
                {activeTab === 'url' && 'URL Security Scanner'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'email' && 'Analyze email content for phishing and social engineering'}
                {activeTab === 'document' && 'Scan documents for malware and suspicious content'}
                {activeTab === 'url' && 'Check URLs for phishing and malicious content'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TabsContent value="email" className="mt-0">
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadSampleEmail}
                  >
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
                    onClick={simulateEmailScan}
                    disabled={!emailContent.trim() || isScanning}
                    className="w-full"
                    variant="hero"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Email...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Scan Email for Threats
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="document" className="mt-0">
                <div className="space-y-4">
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
                    onClick={simulateDocumentScan}
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
                        <Shield className="mr-2 h-4 w-4" />
                        Scan Document for Malware
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-0">
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadSampleUrl}
                  >
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
                    onClick={simulateUrlScan}
                    disabled={!urlInput.trim() || isScanning}
                    className="w-full"
                    variant="hero"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing URL...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Scan URL for Threats
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>
                Security analysis and threat detection results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!scanResult ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Run a scan to see detailed security analysis</p>
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
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Threats Detected
                      </h4>
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

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      This is a demonstration with simulated results. In the live version, 
                      SafeScan uses real AI-powered threat detection across all content types.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
};