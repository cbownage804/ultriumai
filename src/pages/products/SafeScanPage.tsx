import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SafeScanApp } from "@/components/apps/SafeScanApp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Check, Star, Zap, Users, ArrowRight, Play, 
  Mail, FileText, Link as LinkIcon, AlertTriangle, Brain, 
  Eye, Globe, Lock, Fingerprint, Scan, FileSearch, MessageSquare,
  Server, Code, Webhook, Calendar, BarChart3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import heroScan from "@/assets/hero-scan.jpg";
import screenshotSafescan from "@/assets/screenshot-safescan.jpg";
import { safeSuiteProducts } from "@/components/safesuite/SafeSuiteProductIcons";

const SafeScanPage = () => {
  const [showFullApp, setShowFullApp] = useState(false);
  
  const scanningCapabilities = [
    {
      icon: Mail,
      title: 'Email Security Scanner',
      description: 'Complete email threat analysis with header inspection, sender verification, and content analysis',
      features: [
        'Phishing detection with AI scoring',
        'Sender reputation analysis',
        'Header manipulation detection',
        'Embedded link extraction',
        'Attachment threat scanning',
      ],
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: FileText,
      title: 'Document Scanner',
      description: 'Deep analysis of documents for malware, macros, and hidden threats',
      features: [
        'Macro detection & analysis',
        'Embedded object scanning',
        'PDF exploit detection',
        'Office document inspection',
        'Archive file extraction',
      ],
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: LinkIcon,
      title: 'URL & Link Analyzer',
      description: 'Comprehensive URL reputation and destination analysis',
      features: [
        'Domain age verification',
        'SSL certificate validation',
        'Redirect chain tracking',
        'Reputation database lookup',
        'Real-time threat feeds',
      ],
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const aiFeatures = [
    {
      icon: Brain,
      title: 'AI Threat Detection',
      description: 'Machine learning models trained on millions of threats to detect zero-day attacks',
    },
    {
      icon: Eye,
      title: 'Behavioral Analysis',
      description: 'Analyze patterns and behaviors to identify sophisticated social engineering',
    },
    {
      icon: Fingerprint,
      title: 'Content Fingerprinting',
      description: 'Hash-based detection to catch known malware variants and threat actors',
    },
    {
      icon: Globe,
      title: 'Global Threat Intelligence',
      description: 'Real-time feeds from security researchers and honeypot networks worldwide',
    },
  ];

  const enterpriseFeatures = [
    {
      icon: Server,
      title: 'Bulk Scanning',
      description: 'Process thousands of files and emails simultaneously with queue management',
    },
    {
      icon: Code,
      title: 'REST API',
      description: 'Full API access to integrate scanning into your existing workflows',
    },
    {
      icon: Webhook,
      title: 'Webhooks & Alerts',
      description: 'Real-time notifications via webhooks, email, Slack, and Teams',
    },
    {
      icon: Calendar,
      title: 'Scheduled Scans',
      description: 'Automate recurring security scans on your documents and URLs',
    },
    {
      icon: BarChart3,
      title: 'Reporting Dashboard',
      description: 'Comprehensive analytics with exportable reports and trend analysis',
    },
    {
      icon: Lock,
      title: 'White-Label Ready',
      description: 'Deploy with your branding for MSP and enterprise customers',
    },
  ];

  const stats = [
    { label: 'Threats Blocked', value: '50M+', description: 'Monthly' },
    { label: 'Detection Rate', value: '99.7%', description: 'Accuracy' },
    { label: 'Response Time', value: '<2s', description: 'Average scan' },
    { label: 'Organizations', value: '10K+', description: 'Protected' },
  ];

  // SafeScan is available only through SafeSuite tiers or Vanguard for business

  const comparisonTable = [
    { feature: 'Email Threat Scanning', safescan: true, proofpoint: true, mimecast: true },
    { feature: 'Document Analysis', safescan: true, proofpoint: true, mimecast: true },
    { feature: 'URL Reputation', safescan: true, proofpoint: true, mimecast: true },
    { feature: 'AI-Powered Detection', safescan: true, proofpoint: true, mimecast: false },
    { feature: 'Real-time API Access', safescan: true, proofpoint: false, mimecast: false },
    { feature: 'Bundled Suite', safescan: true, proofpoint: false, mimecast: false },
    { feature: 'No Per-User Pricing', safescan: true, proofpoint: false, mimecast: false },
    { feature: 'Access Via', safescan: 'SafeSuite/Vanguard', proofpoint: 'Standalone only', mimecast: 'Standalone only' },
  ];

  if (showFullApp) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Button 
              variant="outline" 
              onClick={() => setShowFullApp(false)}
              className="mb-6"
            >
              ← Back to Overview
            </Button>
            <SafeScanApp brandName="Ultrium SafeScan" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroScan} 
              alt="Security scanning technology"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-red-500/10 text-red-500 border-red-500/20">
                <Shield className="h-3 w-3 mr-1" />
                AI-Powered Threat Detection
              </Badge>
              <div className="flex justify-center mb-8">
                <div className="px-8 py-4 bg-black rounded-2xl shadow-2xl shadow-red-500/20 animate-fade-in">
                  <img 
                    src={safeSuiteProducts.safescan.logo} 
                    alt="SafeScan" 
                    className="h-24 w-auto object-contain"
                  />
                </div>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
                Enterprise-grade email, document, and URL security scanning. 
                Same AI engine that powers Ultrium Vanguard's threat detection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-red-500 hover:bg-red-600" onClick={() => setShowFullApp(true)}>
                  <Scan className="mr-2 h-5 w-5" />
                  Launch Full Scanner
                </Button>
                <Link to="/vanguard/auth">
                  <Button variant="outline" size="lg">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                  <div className="font-medium">{stat.label}</div>
                  <div className="text-sm text-muted-foreground">{stat.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Screenshot Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">See SafeScan in Action</h2>
              <p className="text-muted-foreground">Comprehensive threat analysis dashboard</p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-red-500/10 border border-red-500/20">
              <img 
                src={screenshotSafescan} 
                alt="SafeScan Dashboard" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Scanning Capabilities - Matches Vanguard */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete Threat Scanning Suite</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The same enterprise-grade scanning engine that powers Ultrium Vanguard's security operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {scanningCapabilities.map((cap, i) => (
                <Card key={i} className="hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 hover:-translate-y-1 border-red-500/10 hover:border-red-500/30 group">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-xl ${cap.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <cap.icon className={`h-7 w-7 ${cap.color}`} />
                    </div>
                    <CardTitle>{cap.title}</CardTitle>
                    <CardDescription>{cap.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {cap.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Features */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4">
                <Brain className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Intelligent Threat Detection</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our AI engine analyzes threats in real-time, learning from millions of samples to stay ahead of attackers
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiFeatures.map((feature, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Features */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="secondary">
                <Server className="h-3 w-3 mr-1" />
                Enterprise Ready
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Built for Scale</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Enterprise features that integrate seamlessly with your existing infrastructure
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enterpriseFeatures.map((feature, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
              <p className="text-muted-foreground">
                See how SafeScan stacks up against enterprise email security solutions
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Feature</th>
                        <th className="text-center p-4 font-semibold text-red-500">SafeScan</th>
                        <th className="text-center p-4 font-semibold text-muted-foreground">Proofpoint</th>
                        <th className="text-center p-4 font-semibold text-muted-foreground">Mimecast</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonTable.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-4">{row.feature}</td>
                          <td className="text-center p-4">
                            {typeof row.safescan === 'boolean' ? (
                              row.safescan ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="font-semibold text-red-500">{row.safescan}</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {typeof row.proofpoint === 'boolean' ? (
                              row.proofpoint ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="text-muted-foreground">{row.proofpoint}</span>
                            )}
                          </td>
                          <td className="text-center p-4">
                            {typeof row.mimecast === 'boolean' ? (
                              row.mimecast ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className="text-muted-foreground">{row.mimecast}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Available Through Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Get SafeScan</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                SafeScan is included in SafeSuite for personal/SMB use, or Vanguard for MSP/Enterprise
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* SafeSuite Option */}
              <Card className="relative border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500">Personal & SMB</Badge>
                  <div className="mx-auto mb-4 w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Shield className="h-8 w-8 text-emerald-500" />
                  </div>
                  <CardTitle className="text-2xl">SafeSuite</CardTitle>
                  <p className="text-base text-muted-foreground">
                    Complete security suite for individuals and small businesses
                  </p>
                  <div className="text-3xl font-bold text-primary mt-4">
                    Free - $15<span className="text-sm font-normal text-muted-foreground">/user/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafeScan included in Pro & Business tiers</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafePass password manager</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafeWeb dark web monitoring</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>SafeTrack asset management (Business)</span>
                    </li>
                  </ul>
                  <Link to="/safesuite">
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-600">
                      View SafeSuite Plans
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Vanguard Option */}
              <Card className="relative border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300">
                <CardHeader className="text-center">
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500">MSP & Enterprise</Badge>
                  <div className="mx-auto mb-4 w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-cyan-500" />
                  </div>
                  <CardTitle className="text-2xl">Vanguard Suite</CardTitle>
                  <p className="text-base text-muted-foreground">
                    Full IT operations platform for managed service providers
                  </p>
                  <div className="text-3xl font-bold text-primary mt-4">
                    Custom<span className="text-sm font-normal text-muted-foreground"> pricing</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>SafeScan with unlimited API access</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>RMM & endpoint management</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>AI-powered helpdesk</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span>Multi-tenant client management</span>
                    </li>
                  </ul>
                  <Link to="/vanguard">
                    <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                      Explore Vanguard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Card className="p-8 bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20">
              <CardContent className="pt-0">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Don't Wait for a Breach</h3>
                <p className="text-muted-foreground mb-6">
                  Email remains the #1 attack vector. Protect your organization with AI-powered scanning today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-red-500 hover:bg-red-600" onClick={() => setShowFullApp(true)}>
                    <Scan className="mr-2 h-5 w-5" />
                    Try Live Scanner
                  </Button>
                  <Link to="/contact">
                    <Button variant="outline" size="lg">
                      Talk to Security Expert
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SafeScanPage;