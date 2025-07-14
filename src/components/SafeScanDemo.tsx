import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Link, FileText, Mail, Key, Upload } from 'lucide-react';
import { useSafeScan } from '@/hooks/useSafeScan';

const SafeScanDemo = () => {
  const { 
    loading, 
    results, 
    scanURL, 
    scanDocument, 
    scanEmail, 
    scanPassword,
    checkEmailBreaches,
    clearResults 
  } = useSafeScan();
  
  const [urlInput, setUrlInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [breachEmailInput, setBreachEmailInput] = useState('');
  const [emailData, setEmailData] = useState({
    subject: '',
    sender: '',
    content: ''
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'safe': return 'text-green-600';
      case 'low': return 'text-yellow-600';
      case 'medium': return 'text-orange-600';
      case 'high': return 'text-red-600';
      case 'critical': return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const getRiskIcon = (safe: boolean) => {
    return safe ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-600" />
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      scanDocument(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">SafeScan™ Security Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive security scanning for URLs, documents, emails, and passwords
        </p>
      </div>

      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            SafeLink
          </TabsTrigger>
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            SafeDoc
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            SafeMail
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            SafePass
          </TabsTrigger>
          <TabsTrigger value="breach" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Breach Check
          </TabsTrigger>
        </TabsList>

        {/* URL Scanner */}
        <TabsContent value="url">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                SafeLink™ - URL Security Scanner
              </CardTitle>
              <CardDescription>
                Scan URLs for malicious content, phishing, and security threats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter URL to scan (e.g., https://example.com)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => scanURL(urlInput)}
                  disabled={loading || !urlInput}
                >
                  {loading ? 'Scanning...' : 'Scan URL'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>• Checks against 70+ threat databases</div>
                <div>• Real-time reputation analysis</div>
                <div>• Phishing and malware detection</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Document Scanner */}
        <TabsContent value="document">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                SafeDoc™ - Document Security Scanner
              </CardTitle>
              <CardDescription>
                Scan documents for malware, suspicious content, and security risks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Upload Document to Scan</p>
                <p className="text-muted-foreground mb-4">
                  Supports: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, and more
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose File
                  </label>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>• Advanced malware detection</div>
                <div>• Macro and script analysis</div>
                <div>• File type verification</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Scanner */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SafeMail™ - Email Security Scanner
              </CardTitle>
              <CardDescription>
                Analyze emails for phishing, spam, and malicious content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Email subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                />
                <Input
                  placeholder="Sender email address"
                  value={emailData.sender}
                  onChange={(e) => setEmailData({...emailData, sender: e.target.value})}
                />
              </div>
              <Textarea
                placeholder="Email content (optional)"
                value={emailData.content}
                onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                rows={4}
              />
              <Button 
                onClick={() => scanEmail(emailData)}
                disabled={loading || !emailData.subject || !emailData.sender}
                className="w-full"
              >
                {loading ? 'Analyzing...' : 'Analyze Email'}
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>• Phishing detection</div>
                <div>• Sender reputation analysis</div>
                <div>• Link and attachment scanning</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Scanner */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                SafePass™ - Password Security Analyzer
              </CardTitle>
              <CardDescription>
                Analyze password strength and check for data breaches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter password to analyze"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => scanPassword(passwordInput)}
                  disabled={loading || !passwordInput}
                >
                  {loading ? 'Analyzing...' : 'Analyze Password'}
                </Button>
              </div>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Passwords are analyzed locally and securely. We never store or transmit your actual passwords.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>• Strength analysis</div>
                <div>• Breach database checking</div>
                <div>• Security recommendations</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breach Check */}
        <TabsContent value="breach">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Email Breach Monitor
              </CardTitle>
              <CardDescription>
                Check if your email has been compromised in data breaches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address to check"
                  value={breachEmailInput}
                  onChange={(e) => setBreachEmailInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => checkEmailBreaches(breachEmailInput)}
                  disabled={loading || !breachEmailInput}
                >
                  {loading ? 'Checking...' : 'Check Breaches'}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>• 15+ billion breach records</div>
                <div>• Real-time monitoring</div>
                <div>• Dark web surveillance</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {results && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getRiskIcon(results.safe)}
                Scan Results - {results.scan_type.toUpperCase()}
              </CardTitle>
              <CardDescription>
                Scanned at {new Date(results.timestamp).toLocaleString()}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-1">Safety Status</div>
                <Badge variant={results.safe ? "default" : "destructive"}>
                  {results.safe ? "SAFE" : "THREAT DETECTED"}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Risk Level</div>
                <Badge variant="outline" className={getRiskColor(results.risk_level)}>
                  {results.risk_level.toUpperCase()}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Reputation Score</div>
                <div className="flex items-center gap-2">
                  <Progress value={results.reputation_score} className="flex-1" />
                  <span className="text-sm font-medium">{results.reputation_score}/100</span>
                </div>
              </div>
            </div>

            {results.threats_detected.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Threats Detected</div>
                <div className="space-y-1">
                  {results.threats_detected.map((threat, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{threat}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {results.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Recommendations</div>
                <div className="space-y-1">
                  {results.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SafeScanDemo;