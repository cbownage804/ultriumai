import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SafeScanDemo } from "@/components/demos/SafeScanDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VanguardUpsell } from "@/components/products/VanguardUpsell";
import { 
  Shield, Check, Star, Zap, Users, ArrowRight, Play, 
  Mail, FileText, Link as LinkIcon, AlertTriangle, Brain, 
  Eye, Globe, Lock, Fingerprint, Scan
} from "lucide-react";
import { Link } from "react-router-dom";

const SafeScanPage = () => {
  
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
      color: 'blue',
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
      color: 'green',
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
      color: 'purple',
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

  const stats = [
    { label: 'Threats Blocked', value: '50M+', description: 'Monthly' },
    { label: 'Detection Rate', value: '99.7%', description: 'Accuracy' },
    { label: 'Response Time', value: '<2s', description: 'Average scan' },
    { label: 'Organizations', value: '10K+', description: 'Protected' },
  ];

  const pricingTiers = [
    {
      name: 'SafeScan Starter',
      price: '$99',
      duration: '/month flat',
      icon: Star,
      features: [
        'Unlimited email scans',
        'Document & URL scanning',
        'AI threat detection',
        'Real-time alerts',
        'Basic reporting',
        'Email support',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'SafeScan Pro',
      price: '$199',
      duration: '/month flat',
      icon: Zap,
      features: [
        'Everything in Starter',
        'API access',
        'Advanced threat intelligence',
        'Custom detection rules',
        'Webhook integrations',
        'Priority support',
      ],
      popular: true,
      cta: 'Start Pro Trial',
    },
    {
      name: 'SafeScan Enterprise',
      price: 'Custom',
      duration: 'Contact sales',
      icon: Users,
      features: [
        'Everything in Pro',
        'White-label options',
        'On-premise deployment',
        'SSO & SAML',
        'Dedicated account manager',
        'SLA guarantees',
      ],
      popular: false,
      cta: 'Contact Sales',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-red-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-red-500/10 text-red-500 border-red-500/20">
                <Shield className="h-3 w-3 mr-1" />
                AI-Powered Threat Detection
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Ultrium SafeScan™
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
                Enterprise-grade email, document, and URL security scanning. 
                AI-powered threat detection that catches what others miss.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/vanguard/auth">
                  <Button size="lg" className="bg-red-500 hover:bg-red-600">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play className="mr-2 h-5 w-5" />
                  Try Live Demo
                </Button>
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

        {/* Scanning Capabilities - Matches Vanguard */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Complete Threat Scanning</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Same enterprise-grade scanning engine that powers Ultrium Vanguard's security suite
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {scanningCapabilities.map((cap, i) => (
                <Card key={i} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-lg bg-${cap.color}-500/10 flex items-center justify-center mb-4`}>
                      <cap.icon className={`h-7 w-7 text-${cap.color}-500`} />
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

        {/* Live Demo Section */}
        <section id="demo" className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try SafeScan Live</h2>
              <p className="text-muted-foreground">
                Test our scanning engine with sample emails, documents, and URLs
              </p>
            </div>
            <SafeScanDemo />
          </div>
        </section>

        {/* Vanguard Upsell */}
        <VanguardUpsell 
          currentProduct="SafeScan™" 
          currentProductPrice="$99/mo"
          competitorComparison="Save 40%+ vs. Proofpoint or Mimecast when bundled in Vanguard"
        />

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Standalone SafeScan Pricing</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Or get SafeScan included in Vanguard Suite for even more value
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => {
                const Icon = tier.icon;
                return (
                  <Card 
                    key={index} 
                    className={`relative ${tier.popular ? 'border-red-500 border-2 shadow-lg' : ''} hover:shadow-lg transition-all duration-300`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-red-500">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-red-500" />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        {tier.price}
                        <span className="text-sm font-normal text-muted-foreground">{tier.duration}</span>
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
                      <Link to={tier.cta === 'Contact Sales' ? '/contact' : '/vanguard/auth'}>
                        <Button 
                          className={`w-full ${tier.popular ? 'bg-red-500 hover:bg-red-600' : ''}`}
                          variant={tier.popular ? "default" : "outline"}
                        >
                          {tier.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
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
                  <Link to="/vanguard/auth">
                    <Button size="lg" className="bg-red-500 hover:bg-red-600">
                      Start Free Trial
                    </Button>
                  </Link>
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