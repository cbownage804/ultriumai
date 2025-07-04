import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Link, 
  Mail, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface ScanResult {
  type: 'url' | 'email' | 'text';
  status: 'safe' | 'warning' | 'danger';
  score: number;
  threats: string[];
  recommendations: string[];
}

const InteractiveSecurityWidget = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const { toast } = useToast();

  const simulateScan = async (type: 'url' | 'email' | 'text', input: string): Promise<ScanResult> => {
    // Simulate AI analysis with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
    
    // Simulate realistic threat detection based on input
    const hasPhishingKeywords = /(?:login|verify|account|suspended|urgent|click here|limited time)/i.test(input);
    const hasSuspiciousDomain = /(?:bit\.ly|tinyurl|suspicious-domain)/i.test(input);
    const hasEmailThreats = /@(?:suspicious|fake|phishing)/i.test(input);
    
    let status: 'safe' | 'warning' | 'danger' = 'safe';
    let score = 85 + Math.random() * 10; // Base safe score
    let threats: string[] = [];
    let recommendations: string[] = [];

    if (hasPhishingKeywords || hasSuspiciousDomain || hasEmailThreats) {
      status = Math.random() > 0.5 ? 'danger' : 'warning';
      score = 20 + Math.random() * 40;
      
      if (hasPhishingKeywords) threats.push("Phishing keywords detected");
      if (hasSuspiciousDomain) threats.push("Suspicious domain identified");
      if (hasEmailThreats) threats.push("Potential email threat patterns");
      
      recommendations = [
        "Do not click on suspicious links",
        "Verify sender identity through alternative means",
        "Report to security team if received in corporate environment"
      ];
    } else {
      recommendations = [
        "Content appears safe based on initial analysis",
        "Continue with standard security practices",
        "Monitor for any unusual behavior"
      ];
    }

    return { type, status, score, threats, recommendations };
  };

  const handleScan = async (type: 'url' | 'email' | 'text') => {
    let input = '';
    switch (type) {
      case 'url':
        input = urlInput.trim();
        if (!input) {
          toast({
            title: "Input Required",
            description: "Please enter a URL to scan",
            variant: "destructive"
          });
          return;
        }
        break;
      case 'email':
        input = emailInput.trim();
        if (!input) {
          toast({
            title: "Input Required", 
            description: "Please enter email content to analyze",
            variant: "destructive"
          });
          return;
        }
        break;
      case 'text':
        input = textInput.trim();
        if (!input) {
          toast({
            title: "Input Required",
            description: "Please enter text content to analyze", 
            variant: "destructive"
          });
          return;
        }
        break;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      const result = await simulateScan(type, input);
      setScanResult(result);
      
      toast({
        title: "Scan Complete",
        description: `Security analysis finished with ${result.status} status`,
      });
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Unable to complete security scan. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'danger':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-muted-foreground bg-muted border-muted';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Try Our AI Security Scanner
            </CardTitle>
          </div>
          <CardDescription className="text-lg">
            Experience our advanced threat detection technology. Scan URLs, emails, or text content instantly.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL Scanner
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Analyzer
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter URL to scan</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    disabled={isScanning}
                  />
                  <Button 
                    onClick={() => handleScan('url')} 
                    disabled={isScanning}
                    className="whitespace-nowrap"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Scan URL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Paste email content</label>
                <Textarea
                  placeholder="Paste email headers, subject, and body content here..."
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isScanning}
                  rows={4}
                />
                <Button 
                  onClick={() => handleScan('email')} 
                  disabled={isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Email
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Analyze Email
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter text content</label>
                <Textarea
                  placeholder="Enter any text content for security analysis..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isScanning}
                  rows={4}
                />
                <Button 
                  onClick={() => handleScan('text')} 
                  disabled={isScanning}
                  className="w-full"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning Text
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Scan Content
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Results Section */}
          {scanResult && (
            <Card className={`mt-6 border-2 ${getStatusColor(scanResult.status)} animate-fade-in`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {getStatusIcon(scanResult.status)}
                  <div>
                    <CardTitle className="text-lg">
                      Security Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      Risk Score: {scanResult.score.toFixed(1)}/100
                    </CardDescription>
                  </div>
                  <Badge variant={scanResult.status === 'safe' ? 'default' : 'destructive'} className="ml-auto">
                    {scanResult.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {scanResult.threats.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Threats Detected:</h4>
                    <ul className="space-y-1">
                      {scanResult.threats.map((threat, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <XCircle className="h-3 w-3 text-red-500" />
                          {threat}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {scanResult.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Want more detailed analysis and full platform access?
                  </p>
                  <Button className="w-full" variant="default">
                    Sign Up for Full Security Suite
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature highlights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-primary/5">
              <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium">AI-Powered</h4>
              <p className="text-sm text-muted-foreground">Advanced machine learning algorithms</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium">Real-Time</h4>
              <p className="text-sm text-muted-foreground">Instant threat detection</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/5">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium">Comprehensive</h4>
              <p className="text-sm text-muted-foreground">8 specialized security tools</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveSecurityWidget;