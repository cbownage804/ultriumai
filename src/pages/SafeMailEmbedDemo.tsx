import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Mail, 
  DollarSign, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Globe,
  Palette,
  Settings,
  BarChart3,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface EmailAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  threats: {
    phishing: boolean;
    malware: boolean;  
    spam: boolean;
    spoofing: boolean;
  };
  details: {
    sender: string;
    subject: string;
    links: number;
    attachments: number;
    sentiment: string;
  };
  recommendations: string[];
}

const SafeMailEmbedDemo = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  const [emailText, setEmailText] = useState('');
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeEmail = async () => {
    if (!emailText.trim()) return;
    
    setIsAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const text = emailText.toLowerCase();
    const isPhishing = text.includes('urgent') || text.includes('verify') || text.includes('suspended');
    const hasLinks = text.includes('http') || text.includes('www.');
    const isSpam = text.includes('winner') || text.includes('lottery') || text.includes('congratulations');
    
    let riskScore = 10;
    if (isPhishing) riskScore += 40;
    if (hasLinks) riskScore += 20;
    if (isSpam) riskScore += 30;
    
    const riskLevel = riskScore > 70 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 30 ? 'medium' : 'low';
    
    setAnalysis({
      overallRisk: riskLevel,
      riskScore: Math.min(riskScore, 100),
      threats: {
        phishing: isPhishing,
        malware: text.includes('attachment') && isPhishing,
        spam: isSpam,
        spoofing: text.includes('paypal') || text.includes('bank')
      },
      details: {
        sender: emailText.includes('From:') ? emailText.split('From:')[1].split('\n')[0].trim() : 'Unknown',
        subject: emailText.includes('Subject:') ? emailText.split('Subject:')[1].split('\n')[0].trim() : 'No Subject',
        links: (emailText.match(/https?:\/\/[^\s]+/g) || []).length,
        attachments: 0,
        sentiment: isPhishing ? 'Urgent/Threatening' : 'Professional'
      },
      recommendations: riskLevel === 'critical' ? [
        'Do not click any links in this email',
        'Report as phishing to your IT department',
        'Delete the email immediately'
      ] : [
        'Email appears relatively safe',
        'Still verify sender if unexpected',
        'Use caution with any links or attachments'
      ]
    });
    
    setIsAnalyzing(false);
  };

  const loadSampleEmail = () => {
    setEmailText(`From: security@paypal.com
Subject: Urgent: Verify Your Account Now
Dear Customer,
We've detected suspicious activity on your PayPal account. Please click the link below to verify your account immediately or it will be suspended within 24 hours.
Verify Now: https://paypal-security-verify.net/login
Thank you,
PayPal Security Team`);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  const embedCode = `<!-- SafeMail Embeddable Widget -->
<div id="safemail-widget"></div>
<script src="https://cdn.ultriumai.com/safemail-embed.js"></script>
<script>
  SafeMail.init({
    containerId: 'safemail-widget',
    apiKey: 'your-api-key',
    branding: {
      companyName: 'Your Company',
      primaryColor: '#0066cc',
      logo: 'https://yoursite.com/logo.png'
    }
  });
</script>`;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gradient">
              SafeMail Embeddable Demo
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            White-label email security scanning for MSPs. Deploy SafeMail on your client websites 
            with your branding and generate recurring revenue.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <DollarSign className="h-4 w-4 mr-2" />
              $6/user profit
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              White-label ready
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              One-line integration
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue Model</TabsTrigger>
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="branding">White-Label</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>

          {/* Revenue Model */}
          <TabsContent value="revenue" className="space-y-6">
            <Card className="border-2 border-success/20 bg-success/5">
              <CardHeader>
                <CardTitle className="text-success-foreground">MSP Revenue Opportunity</CardTitle>
                <CardDescription>Generate recurring revenue with SafeMail subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-6 bg-card border rounded-lg">
                    <div className="text-3xl font-bold text-success mb-2">$10</div>
                    <div className="text-sm text-muted-foreground">You charge client per user</div>
                  </div>
                  <div className="text-center p-6 bg-card border rounded-lg">
                    <div className="text-3xl font-bold text-primary mb-2">$4</div>
                    <div className="text-sm text-muted-foreground">You pay Ultrium per user</div>
                  </div>
                  <div className="text-center p-6 bg-card border rounded-lg">
                    <div className="text-3xl font-bold text-info mb-2">$6</div>
                    <div className="text-sm text-muted-foreground">Your profit per user</div>
                  </div>
                </div>
                
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-2">Example: 20 clients with 10 users each</div>
                    <div className="text-2xl font-bold text-success">$1,200/month recurring revenue</div>
                    <div className="text-sm text-muted-foreground mt-1">= $14,400/year additional profit</div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Demo */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Security Scanner
                  </CardTitle>
                  <CardDescription>Test SafeMail with a sample phishing email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadSampleEmail}
                  >
                    Load Sample Email
                  </Button>
                  
                  <Textarea
                    placeholder="Paste email content here..."
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  
                  <Button 
                    onClick={analyzeEmail}
                    disabled={!emailText.trim() || isAnalyzing}
                    className="w-full"
                    variant="hero"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Email...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Scan Email
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {!analysis ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Scan an email to see detailed security analysis
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Risk Score</span>
                          <Badge variant={analysis.overallRisk === 'critical' ? 'destructive' : 'default'}>
                            {analysis.overallRisk.toUpperCase()}
                          </Badge>
                        </div>
                        <Progress value={analysis.riskScore} className="h-3" />
                        <p className={`text-sm mt-1 ${getRiskColor(analysis.overallRisk)}`}>
                          {analysis.riskScore}/100 Risk Level
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Threats Detected</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(analysis.threats).map(([threat, detected]) => (
                            <div key={threat} className="flex items-center gap-2">
                              {detected ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <span className="text-sm capitalize">{threat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4 space-y-1">
                            {analysis.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm">{rec}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* White-Label Branding */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Complete White-Label Control
                </CardTitle>
                <CardDescription>Customize every aspect to match your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Branding Options:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Your company logo and colors
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Custom domain (mail-scanner.yourcompany.com)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Personalized messaging and alerts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Remove all Ultrium branding
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        Custom email notifications
                      </li>
                    </ul>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Preview: Your Branded Scanner</h4>
                    <div className="bg-card border rounded p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded"></div>
                        <span className="font-medium">Your Company</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Powered by your security expertise
                      </div>
                      <Button size="sm" variant="hero" className="w-full">
                        Scan Email for Threats
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration */}
          <TabsContent value="integration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Simple Integration
                  </CardTitle>
                  <CardDescription>Deploy to any website in minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Step 1: Get Your API Key</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Sign up for your MSP account and get your unique API key.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Step 2: Add to Website</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Copy and paste this code anywhere on your client's website:
                    </p>
                    <div className="bg-muted/30 p-3 rounded font-mono text-xs overflow-x-auto">
                      <pre>{embedCode}</pre>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Step 3: Configure & Launch</h4>
                    <p className="text-sm text-muted-foreground">
                      Customize branding, set up billing, and you're live!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Management Dashboard
                  </CardTitle>
                  <CardDescription>Monitor all your SafeMail deployments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded">
                        <div className="text-2xl font-bold text-primary">47</div>
                        <div className="text-xs text-muted-foreground">Active Clients</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded">
                        <div className="text-2xl font-bold text-success">$2,820</div>
                        <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Threats Blocked Today</span>
                        <Badge variant="destructive">23</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Emails Scanned</span>
                        <Badge variant="default">1,247</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Client Satisfaction</span>
                        <Badge variant="default">98.5%</Badge>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <Card className="mt-12 border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to Add SafeMail to Your Portfolio?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join MSPs already generating $1000+ monthly with white-label email security solutions
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" variant="hero">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
              <Button size="lg" variant="outline">
                <Globe className="h-5 w-5 mr-2" />
                View All MSP Solutions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default SafeMailEmbedDemo;