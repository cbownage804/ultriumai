import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  DollarSign, 
  Globe, 
  Building2, 
  Zap, 
  ArrowRight, 
  CheckCircle,
  Star,
  TrendingUp,
  Target,
  Crown,
  FileText,
  Mail,
  Network,
  Eye,
  Search,
  Wrench,
  MessageSquare,
  Key,
  Database
} from 'lucide-react';
import { SafeNetDemo } from "@/components/demos/SafeNetDemo";
import { DarkWebDemo } from "@/components/demos/DarkWebDemo";
import { SafeScoreDemo } from "@/components/demos/SafeScoreDemo";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const MSPDemos = () => {
  const [selectedDemo, setSelectedDemo] = useState('security-scanning');

  const platformFeatures = [
    {
      id: 'security-scanning',
      name: 'Security Scanning Suite',
      description: 'Complete document, email, and web scanning in one unified platform',
      demoUrl: '/demos/safedoc',
      features: [
        'SafeDoc - Document malware scanning',
        'SafeMail - Email threat detection', 
        'SafeLink - URL security analysis',
        'Real-time threat intelligence',
        'Unified security dashboard'
      ],
      icon: Shield,
      color: 'green'
    },
    {
      id: 'threat-monitoring',
      name: 'Threat Intelligence & Monitoring',
      description: 'Dark web monitoring and network security assessment',
      demoUrl: '/demos/darkweb',
      features: [
        'Dark web credential monitoring',
        'Network vulnerability scanning',
        'Real-time threat intelligence',
        'Automated security scoring',
        'Comprehensive risk assessment'
      ],
      icon: Eye,
      color: 'red'
    },
    {
      id: 'ai-assistant',
      name: 'AI-Powered Security Assistant',
      description: 'UltriumGPT integrated with all security tools for intelligent analysis',
      demoUrl: '/demos/ultriumgpt',
      features: [
        'Natural language security queries',
        'Intelligent threat analysis',
        'Automated report generation',
        'Cross-platform data correlation',
        'Client-specific AI customization'
      ],
      icon: MessageSquare,
      color: 'purple'
    },
    {
      id: 'rmm-platform',
      name: 'Remote Monitoring & Management',
      description: 'Complete RMM solution with integrated security monitoring',
      demoUrl: '/demos/rmm',
      features: [
        'Remote device management',
        'Integrated antivirus control',
        'Real-time monitoring dashboard',
        'Automated patch management',
        'Security incident response'
      ],
      icon: Wrench,
      color: 'blue'
    },
    {
      id: 'password-management',
      name: 'Password & Identity Management',
      description: 'SafePass integrated with security monitoring for complete protection',
      demoUrl: '/demos/safepass',
      features: [
        'Enterprise password management',
        'Multi-factor authentication',
        'Security breach monitoring',
        'Team collaboration tools',
        'Compliance reporting'
      ],
      icon: Key,
      color: 'green'
    }
  ];

  // Platform overview
  const platformOverview = {
    name: 'UltriumAI Complete Platform',
    description: 'Unified cybersecurity platform - all tools in one integrated solution',
    monthlyRevenue: '$150/client',
    setupTime: '30 minutes',
    marketSize: '32M+ businesses need cybersecurity',
    revenueModel: {
      charge: 200,
      pay: 50, 
      profit: 150
    }
  };

  const currentFeature = platformFeatures.find(f => f.id === selectedDemo) || platformFeatures[0];
  const Icon = currentFeature.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-gradient">
              MSP Demo Center
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Offer the complete UltriumAI cybersecurity platform to your clients. One unified solution, 
            one login, one purchase - delivering comprehensive security with maximum recurring revenue potential.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-2" />
              $1000+/month potential
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Target className="h-4 w-4 mr-2" />
              32M+ target businesses
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Star className="h-4 w-4 mr-2" />
              Recurring revenue model
            </Badge>
          </div>
        </div>

        {/* MSP Value Proposition */}
        <Card className="mb-12 border-2 border-success/20 bg-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success-foreground">
              <Crown className="h-6 w-6" />
              Why MSPs Choose Ultrium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">Unified Platform</div>
                <p className="text-muted-foreground">All security tools in one integrated solution - one login, maximum value</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Quick Setup</div>
                <p className="text-muted-foreground">Deploy to clients in minutes, not weeks</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-info mb-2">High Margins</div>
                <p className="text-muted-foreground">60-70% profit margins on all solutions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Solution Selector */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Platform Features:</h3>
            {platformFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <Card 
                  key={feature.id}
                  className={`cursor-pointer transition-all ${
                    selectedDemo === feature.id 
                      ? 'border-2 border-primary bg-primary/5' 
                      : 'hover:border-border'
                  }`}
                  onClick={() => setSelectedDemo(feature.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <FeatureIcon className="h-6 w-6 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-xs text-muted-foreground/80 line-clamp-2">{feature.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Demo Area */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-primary" />
                  {currentFeature.name}
                </CardTitle>
                <CardDescription className="text-lg">
                  {currentFeature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="revenue">Revenue Model</TabsTrigger>
                    <TabsTrigger value="features">Features</TabsTrigger>
                    <TabsTrigger value="demo">Live Demo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-success" />
                          <div className="font-semibold">Platform Revenue</div>
                          <div className="text-2xl font-bold text-success">{platformOverview.monthlyRevenue}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Full Setup</div>
                          <div className="text-2xl font-bold text-primary">{platformOverview.setupTime}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Target className="h-8 w-8 mx-auto mb-2 text-info" />
                          <div className="font-semibold">Market Size</div>
                          <div className="text-sm font-bold text-info">{platformOverview.marketSize}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="revenue" className="space-y-4">
                    <Card className="border-2 border-success/20 bg-success/5">
                      <CardHeader>
                        <CardTitle className="text-success-foreground">Revenue Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-success">
                              ${platformOverview.revenueModel.charge}
                            </div>
                            <div className="text-sm text-muted-foreground">You charge client</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-primary">
                              ${platformOverview.revenueModel.pay}
                            </div>
                            <div className="text-sm text-muted-foreground">You pay Ultrium</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-info">
                              ${platformOverview.revenueModel.profit}
                            </div>
                            <div className="text-sm text-muted-foreground">Your profit</div>
                          </div>
                        </div>
                        <div className="mt-6 p-4 bg-card border rounded-lg">
                          <div className="text-center">
                            <div className="font-semibold mb-2">Example: 20 clients</div>
                            <div className="text-2xl font-bold text-success">
                              ${platformOverview.revenueModel.profit * 20}/month recurring
                            </div>
                            <div className="text-sm text-muted-foreground">
                              = ${platformOverview.revenueModel.profit * 240}/year additional revenue
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {currentFeature.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      asChild 
                      className="w-full" 
                      size="lg"
                    >
                      <a href={currentFeature.demoUrl} target="_blank" rel="noopener noreferrer">
                        Try This Feature Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </TabsContent>

                  <TabsContent value="demo" className="space-y-4">
                    {selectedDemo === 'threat-monitoring' && <DarkWebDemo />}
                    {selectedDemo === 'threat-monitoring' && <SafeScoreDemo />}
                    {selectedDemo !== 'threat-monitoring' && (
                      <div className="text-center py-12 space-y-4">
                        <div className="text-lg mb-4">Experience the unified UltriumAI platform</div>
                        <div className="text-muted-foreground mb-6">All features integrated in one seamless solution</div>
                        <Button asChild size="lg">
                          <a href="/demos" target="_blank" rel="noopener noreferrer">
                            View Complete Platform Demo
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mt-12 border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Ready to Scale Your MSP Business?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of MSPs already generating additional recurring revenue with UltriumAI's unified platform
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" variant="hero">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo Call
              </Button>
              <Button size="lg" variant="outline">
                View All Demos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default MSPDemos;