import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Link, Mail, FileText, Search, Check, Play, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SecurityAppsSection = () => {
  const { toast } = useToast();
  const [demoInput, setDemoInput] = useState("");
  const [demoType, setDemoType] = useState<"link" | "email" | "file" | "darkweb">("link");
  const [demoResult, setDemoResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const securityApps = [
    {
      id: 'safelink',
      name: 'Ultrium SafeLink™',
      icon: Link,
      description: 'AI-powered link security scanning and threat detection',
      features: ['Real-time URL scanning', 'Phishing detection AI', 'Malware analysis'],
      demoPlaceholder: 'Enter a URL to scan (e.g., https://example.com)',
      riskTypes: ['Phishing', 'Malware', 'Ransomware']
    },
    {
      id: 'safeemail',
      name: 'Ultrium SafeEmail™',
      icon: Mail,
      description: 'Email security analysis and reputation checking',
      features: ['Email header analysis', 'Sender reputation check', 'BEC detection'],
      demoPlaceholder: 'Enter an email address to analyze (e.g., user@domain.com)',
      riskTypes: ['Spam', 'Phishing', 'BEC']
    },
    {
      id: 'safedoc',
      name: 'Ultrium SafeDoc™',
      icon: FileText,
      description: 'Intelligent file analysis and malware detection',
      features: ['Multi-format scanning', 'Behavioral analysis', 'Zero-day protection'],
      demoPlaceholder: 'Upload a file for security analysis',
      riskTypes: ['Malware', 'Trojans', 'Viruses']
    },
    {
      id: 'darkweb',
      name: 'Ultrium DarkWeb Scanner™',
      icon: Search,
      description: 'Dark web monitoring and breach detection',
      features: ['Dark web monitoring', 'Breach detection', 'Credential monitoring'],
      demoPlaceholder: 'Enter email or domain to check for breaches',
      riskTypes: ['Data Breaches', 'Credential Theft', 'Identity Theft']
    }
  ];

  const runDemo = async (appId: string) => {
    setIsLoading(true);
    setDemoResult(null);

    // Simulate demo results
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = {
      safelink: {
        safe: false,
        risk_level: 'medium',
        threats: ['Suspicious redirect detected', 'Domain reputation warning'],
        scan_time: '0.8s'
      },
      safeemail: {
        safe: true,
        risk_level: 'low',
        threats: [],
        reputation_score: 85,
        scan_time: '1.2s'
      },
      safedoc: {
        safe: false,
        risk_level: 'high',
        threats: ['Potential malware signature found'],
        file_hash: 'abc123...',
        scan_time: '3.4s'
      },
      darkweb: {
        safe: false,
        risk_level: 'high',
        breaches_found: ['LinkedIn (2021)', 'Adobe (2013)'],
        compromised_records: 245,
        scan_time: '2.1s'
      }
    };

    setDemoResult(mockResults[appId as keyof typeof mockResults]);
    setIsLoading(false);

    toast({
      title: "Demo Complete",
      description: `Security scan completed in ${mockResults[appId as keyof typeof mockResults].scan_time}`,
    });
  };

  const selectedApp = securityApps.find(app => app.id === demoType);

  return (
    <section id="security" className="py-20 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Shield className="h-4 w-4 mr-2" />
            AI-Powered Security Suite
          </Badge>
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Ultrium Security Apps
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Enterprise-grade AI security tools that integrate seamlessly with your Custom GPTs. 
            Protect against cyber threats with real-time scanning and analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline">$20/month per app</Badge>
            <Badge variant="outline">$35/month white label</Badge>
            <Badge className="bg-yellow-500 text-black">Free with Enterprise</Badge>
          </div>
        </div>

        {/* Security Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {securityApps.map((app) => {
            const Icon = app.icon;
            return (
              <Card key={app.id} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-red-200">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <Icon className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription className="text-sm">{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {app.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2">
                      <div className="text-xs text-muted-foreground mb-2">Detects:</div>
                      <div className="flex flex-wrap gap-1">
                        {app.riskTypes.map((risk, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Interactive Demo Section */}
        <Card className="border-2 border-dashed border-red-200 bg-white/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Play className="h-5 w-5 text-red-600" />
              Try Interactive Demo
            </CardTitle>
            <CardDescription>
              Experience our AI security scanning in action with live examples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Demo Type Selection */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {securityApps.map((app) => {
                  const Icon = app.icon;
                  return (
                    <Button
                      key={app.id}
                      variant={demoType === app.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDemoType(app.id as typeof demoType)}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{app.name.split(' ')[1]}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Demo Input */}
              {selectedApp && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-input">
                      {selectedApp.name} Demo
                    </Label>
                    {selectedApp.id === 'safedoc' ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          File upload demo - Click to simulate file analysis
                        </p>
                      </div>
                    ) : (
                      <Input
                        id="demo-input"
                        placeholder={selectedApp.demoPlaceholder}
                        value={demoInput}
                        onChange={(e) => setDemoInput(e.target.value)}
                      />
                    )}
                  </div>

                  <Button
                    onClick={() => runDemo(selectedApp.id)}
                    disabled={isLoading || (!demoInput && selectedApp.id !== 'safedoc')}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Run Security Scan
                      </>
                    )}
                  </Button>

                  {/* Demo Results */}
                  {demoResult && (
                    <Card className={`border-2 ${demoResult.safe ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Shield className={`h-5 w-5 ${demoResult.safe ? 'text-green-600' : 'text-red-600'}`} />
                            <span className="font-medium">
                              {demoResult.safe ? 'Safe' : 'Threats Detected'}
                            </span>
                          </div>
                          <Badge variant={demoResult.risk_level === 'low' ? 'secondary' : 'destructive'}>
                            Risk: {demoResult.risk_level}
                          </Badge>
                        </div>
                        
                        {demoResult.threats && demoResult.threats.length > 0 && (
                          <div className="space-y-1">
                            {demoResult.threats.map((threat: string, index: number) => (
                              <div key={index} className="text-sm text-red-700 flex items-center gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                {threat}
                              </div>
                            ))}
                          </div>
                        )}

                        {demoResult.breaches_found && (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Breaches Found:</div>
                            {demoResult.breaches_found.map((breach: string, index: number) => (
                              <div key={index} className="text-sm text-red-700">• {breach}</div>
                            ))}
                            <div className="text-sm text-muted-foreground mt-2">
                              {demoResult.compromised_records} compromised records found
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-3">
                          Scan completed in {demoResult.scan_time}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Secure Your Custom GPTs?</h3>
            <p className="text-muted-foreground mb-6">
              Add enterprise-grade security scanning to your AI agents. Protect your users from cyber threats with real-time analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    View All Security Apps
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Security Apps Access</DialogTitle>
                    <DialogDescription>
                      Sign up to access the full Security Apps marketplace with subscription options
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Security Apps are available in your dashboard after signing up. Choose from:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Individual apps at $20/month each
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        White label versions at $35/month each
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        All apps included free with Enterprise plan
                      </li>
                    </ul>
                    <Button className="w-full" onClick={() => window.location.href = '/auth'}>
                      Sign Up Now
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="lg">
                Schedule Demo Call
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecurityAppsSection;