import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Zap, 
  Eye, 
  Brain, 
  Cloud, 
  CheckCircle, 
  ArrowRight,
  Star,
  Globe,
  Smartphone,
  AlertTriangle,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Clock,
  BarChart3,
  Settings,
  Download
} from "lucide-react";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import heroAntivirus from '@/assets/hero-antivirus.jpg';

const AntivirusPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Detection",
      description: "Advanced machine learning algorithms detect zero-day threats and evolving malware patterns"
    },
    {
      icon: Eye,
      title: "Real-Time Monitoring",
      description: "Continuous system monitoring with instant threat detection and automated response"
    },
    {
      icon: Cloud,
      title: "Cloud-Based Intelligence",
      description: "Global threat intelligence network with real-time updates and collective defense"
    },
    {
      icon: Zap,
      title: "Behavioral Analysis",
      description: "Advanced behavioral monitoring to catch threats that traditional signatures miss"
    },
    {
      icon: Shield,
      title: "Multi-Layer Protection",
      description: "Comprehensive defense including firewall, anti-phishing, and web protection"
    },
    {
      icon: Settings,
      title: "Centralized Management",
      description: "Single console to manage protection across all endpoints with detailed reporting"
    }
  ];

  const useCases = [
    {
      title: "Enterprise Security",
      description: "Complete endpoint protection for large organizations with thousands of devices",
      benefits: ["Centralized policy management", "Advanced threat hunting", "Compliance reporting", "Zero-trust architecture"]
    },
    {
      title: "MSP Multi-Tenant",
      description: "White-label SafeAV solution for managed service providers with multi-client support",
      benefits: ["Per-client dashboards", "Automated billing integration", "Custom branding", "Tiered service levels"]
    },
    {
      title: "Small Business",
      description: "Easy-to-deploy protection for small teams without dedicated IT resources",
      benefits: ["Automatic updates", "Minimal maintenance", "Cloud management", "Affordable pricing"]
    }
  ];

  const integrations = [
    { name: "Microsoft Defender", icon: Shield, category: "Security" },
    { name: "Splunk SIEM", icon: BarChart3, category: "Analytics" },
    { name: "ServiceNow", icon: Settings, category: "ITSM" },
    { name: "Active Directory", icon: Users, category: "Identity" },
    { name: "Slack", icon: Globe, category: "Communication" },
    { name: "Jira", icon: Target, category: "Ticketing" }
  ];

  const pricingTiers = [
    {
      name: "Essential",
      price: "$3",
      description: "Basic protection for small businesses",
      features: [
        "Real-time SafeAV",
        "Web protection",
        "Email security",
        "Basic reporting",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Business",
      price: "$8",
      description: "Advanced protection for growing companies",
      features: [
        "Everything in Essential",
        "Behavioral analysis",
        "Advanced threat detection",
        "Centralized management",
        "Priority support",
        "Compliance reporting"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Complete security suite for large organizations",
      features: [
        "Everything in Business",
        "Custom integrations",
        "Advanced analytics",
        "Dedicated support",
        "Professional services",
        "SLA guarantees"
      ],
      popular: false
    }
  ];

  const protectionStats = [
    { metric: "99.9%", label: "Threat Detection Rate" },
    { metric: "<1%", label: "False Positive Rate" },
    { metric: "24/7", label: "Real-time Protection" },
    { metric: "500M+", label: "Threats Blocked Daily" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroAntivirus})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-background" />
          <div className="max-w-6xl mx-auto px-4 text-center space-y-8 relative z-10">
            <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Endpoint Protection
            </Badge>
            <h1 className="text-5xl font-bold text-white">
              SafeAV
            </h1>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
              Next-generation endpoint protection powered by AI. Defend against advanced threats 
              with behavioral analysis and real-time cloud intelligence
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="text-lg px-8 py-3 bg-red-600 hover:bg-red-700">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-red-500/50 text-white hover:bg-red-500/10">
                Watch Demo
              </Button>
            </div>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                30-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Enterprise-grade protection
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              {protectionStats.map((stat, index) => (
                <div key={index}>
                  <div className="text-4xl font-bold text-primary mb-2">{stat.metric}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
              <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">Advanced Threat Protection</h2>
                  <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                    Ultrium SafeAV leverages artificial intelligence and behavioral analysis to provide 
                    comprehensive protection against known and unknown threats, ensuring your business stays secure.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Card key={index} className="border-2 hover:border-primary/20 transition-colors">
                        <CardHeader>
                          <Icon className="h-12 w-12 text-primary mb-4" />
                          <CardTitle>{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Comprehensive Security Features</h2>
                  <p className="text-xl text-muted-foreground">
                    Multi-layered protection designed for modern threats
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-6 w-6 text-primary" />
                        AI-Powered Detection
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Machine learning threat analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Zero-day exploit prevention</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Polymorphic malware detection</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Advanced persistent threat (APT) protection</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-6 w-6 text-primary" />
                        Real-Time Monitoring
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Continuous file system monitoring</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Network traffic analysis</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Process behavior tracking</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Registry and memory protection</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Cloud className="h-6 w-6 text-primary" />
                        Cloud Intelligence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Global threat intelligence network</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Real-time signature updates</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Collective defense mechanisms</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Threat attribution and analysis</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-6 w-6 text-primary" />
                        Management Console
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Centralized policy deployment</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Real-time endpoint visibility</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Automated quarantine and remediation</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Comprehensive reporting and alerts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="use-cases" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Built for Every Business</h2>
                  <p className="text-xl text-muted-foreground">
                    Scalable protection that grows with your organization
                  </p>
                </div>

                <div className="space-y-8">
                  {useCases.map((useCase, index) => (
                    <Card key={index} className="border-2">
                      <CardHeader>
                        <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                        <CardDescription className="text-lg">{useCase.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {useCase.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Enterprise Integrations</h2>
                  <p className="text-xl text-muted-foreground">
                    Connect with your existing security and IT infrastructure
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {integrations.map((integration, index) => {
                    const Icon = integration.icon;
                    return (
                      <Card key={index} className="hover:border-primary/20 transition-colors">
                        <CardContent className="p-6 text-center">
                          <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                          <h3 className="font-semibold mb-2">{integration.name}</h3>
                          <Badge variant="outline">{integration.category}</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    Need additional integrations? Our REST API and webhooks make it easy to connect 
                    with any system. Enterprise customers get custom integration support.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Flexible Pricing Plans</h2>
                  <p className="text-xl text-muted-foreground">
                    Choose the right level of protection for your organization
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {pricingTiers.map((tier, index) => (
                    <Card key={index} className={`relative ${tier.popular ? 'border-2 border-primary' : ''}`}>
                      {tier.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                        </div>
                      )}
                      <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{tier.name}</CardTitle>
                        <div className="text-4xl font-bold">
                          {tier.price}
                          {tier.price !== "Custom" && <span className="text-lg text-muted-foreground">/endpoint/month</span>}
                        </div>
                        <CardDescription>{tier.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          {tier.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-success" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <Button 
                          className="w-full" 
                          variant={tier.popular ? "default" : "outline"}
                        >
                          {tier.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center mt-12">
                  <h3 className="text-xl font-semibold mb-4">Volume Discounts Available</h3>
                  <p className="text-muted-foreground mb-6">
                    Save up to 30% with annual billing and volume commitments
                  </p>
                  <Button variant="outline" size="lg">
                    Get Custom Quote
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
            <h2 className="text-4xl font-bold">Ready to Secure Your Business?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of organizations protecting their endpoints with Ultrium SafeAV
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="text-lg px-8 py-3" variant="hero">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default AntivirusPage;