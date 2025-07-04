import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Link, Mail, FileText, Search, Check, Play, ArrowRight, Lock, Users, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SecurityAppsSection = () => {
  const { toast } = useToast();
  const [demoInput, setDemoInput] = useState("");
  const [demoType, setDemoType] = useState<"safeemail" | "safelink" | "safedoc" | "safescan" | "safepass" | "safeweb">("safeemail");
  const [demoResult, setDemoResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const securityApps = [
    {
      id: 'safeemail',
      name: 'Ultrium SafeEmail™',
      icon: Mail,
      description: 'AI-powered email analysis and threat detection',
      features: ['Real-time phishing detection', 'Malware scanning', 'Social engineering detection'],
      demoPlaceholder: 'Enter an email address to analyze (e.g., user@domain.com)',
      riskTypes: ['Phishing', 'Malware', 'BEC'],
      category: 'Email Security'
    },
    {
      id: 'safelink',
      name: 'Ultrium SafeLink™',
      icon: Link,
      description: 'Comprehensive URL analysis and safety verification',
      features: ['URL reputation analysis', 'Malware detection', 'SSL certificate validation'],
      demoPlaceholder: 'Enter a URL to scan (e.g., https://example.com)',
      riskTypes: ['Phishing', 'Malware', 'Suspicious Sites'],
      category: 'Link Security'
    },
    {
      id: 'safedoc',
      name: 'Ultrium SafeDoc™',
      icon: FileText,
      description: 'Secure document storage and knowledge management',
      features: ['Secure document storage', 'Version control', 'Advanced search'],
      demoPlaceholder: 'Upload a file for security analysis',
      riskTypes: ['Malware', 'Data Leaks', 'Unauthorized Access'],
      category: 'Document Management'
    },
    {
      id: 'safescan',
      name: 'Ultrium SafeScan™',
      icon: Shield,
      description: 'Document analysis and content safety verification',
      features: ['Multi-format scanning', 'Macro analysis', 'Embedded threat detection'],
      demoPlaceholder: 'Upload a document for scanning',
      riskTypes: ['Malware', 'Trojans', 'Macros'],
      category: 'Document Security'
    },
    {
      id: 'safepass',
      name: 'Ultrium SafePass™',
      icon: Lock,
      description: 'Enterprise password management and security platform',
      features: ['Secure password generation', 'Breach monitoring', 'Team sharing'],
      demoPlaceholder: 'Test password strength',
      riskTypes: ['Weak Passwords', 'Breached Credentials', 'Policy Violations'],
      category: 'Password Security'
    },
    {
      id: 'safeweb',
      name: 'Ultrium SafeWEB™',
      icon: Search,
      description: 'Dark web monitoring and threat intelligence platform',
      features: ['Credential monitoring', 'Data breach detection', 'Threat actor tracking'],
      demoPlaceholder: 'Enter email or domain to check for breaches',
      riskTypes: ['Data Breaches', 'Credential Theft', 'Identity Theft'],
      category: 'Threat Intelligence'
    }
  ];

  const pricingTiers = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '14 days',
      icon: Star,
      features: [
        'Access to all security apps',
        'Up to 100 scans per app',
        'Basic reporting',
        'Email support'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Premium',
      price: '$29',
      duration: 'per user/month',
      icon: Zap,
      features: [
        'Unlimited scans across all apps',
        'Advanced analytics & reporting',
        'Priority support',
        'API access',
        'Team collaboration tools'
      ],
      popular: true,
      cta: 'Start Premium'
    },
    {
      name: 'Enterprise',
      price: '$79',
      duration: 'per user/month',
      icon: Users,
      features: [
        'Everything in Premium',
        'White-label customization',
        'SSO & SAML integration',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantees'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  const appBundles = [
    {
      name: 'Email Security Bundle',
      apps: ['SafeEmail', 'SafeLink'],
      originalPrice: '$58',
      bundlePrice: '$45',
      savings: '$13'
    },
    {
      name: 'Document Security Bundle',
      apps: ['SafeDoc', 'SafeScan'],
      originalPrice: '$58',
      bundlePrice: '$45',
      savings: '$13'
    },
    {
      name: 'Complete Security Suite',
      apps: ['All 6 Apps'],
      originalPrice: '$174',
      bundlePrice: '$99',
      savings: '$75'
    }
  ];

  const runDemo = async (appId: string) => {
    setIsLoading(true);
    setDemoResult(null);

    // Simulate demo results
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResults = {
      safeemail: {
        safe: true,
        risk_level: 'low',
        threats: [],
        reputation_score: 85,
        scan_time: '1.2s'
      },
      safelink: {
        safe: false,
        risk_level: 'medium',
        threats: ['Suspicious redirect detected', 'Domain reputation warning'],
        scan_time: '0.8s'
      },
      safedoc: {
        safe: true,
        risk_level: 'low',
        threats: [],
        file_hash: 'safe123...',
        scan_time: '2.1s'
      },
      safescan: {
        safe: false,
        risk_level: 'high',
        threats: ['Potential malware signature found', 'Suspicious macro detected'],
        file_hash: 'abc123...',
        scan_time: '3.4s'
      },
      safepass: {
        safe: false,
        risk_level: 'medium',
        threats: ['Password found in breach database', 'Weak password complexity'],
        strength_score: 3,
        scan_time: '0.5s'
      },
      safeweb: {
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
            <Badge className="bg-green-500 text-white">14-Day Free Trial</Badge>
            <Badge variant="outline">Monthly Billing Per User</Badge>
            <Badge variant="outline">Bundle Discounts Available</Badge>
          </div>
        </div>

        {/* Security Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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

        {/* Pricing Tiers Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Choose Your Security Plan</h3>
            <p className="text-muted-foreground mb-8">Start with a free trial, then choose the plan that fits your needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <Card key={index} className={`relative ${tier.popular ? 'border-primary border-2' : ''} hover:shadow-lg transition-all duration-300`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary">
                      {tier.price}
                      <span className="text-sm font-normal text-muted-foreground">/{tier.duration}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                    >
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* App Bundles Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-8 mb-12">
            <div className="text-center mb-8">
              <h4 className="text-2xl font-bold mb-3">Save with App Bundles</h4>
              <p className="text-muted-foreground">Get multiple security apps together and save up to 43%</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {appBundles.map((bundle, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{bundle.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {bundle.apps.join(' + ')}
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground line-through">
                        {bundle.originalPrice}/month
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {bundle.bundlePrice}/month
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        Save {bundle.savings}/month
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Get Bundle
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                    {(selectedApp.id === 'safedoc' || selectedApp.id === 'safescan') ? (
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
                    disabled={isLoading || (!demoInput && selectedApp.id !== 'safedoc' && selectedApp.id !== 'safescan')}
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