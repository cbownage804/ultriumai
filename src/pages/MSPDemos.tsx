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
  const [selectedDemo, setSelectedDemo] = useState('safeshield-platform');

  const platformFeatures = [
    {
      id: 'safeshield-platform',
      name: '🛡️ SafeShield™ Complete Security Platform',
      description: 'Revolutionary AI-powered security ecosystem - the only cybersecurity platform your clients will ever need',
      demoUrl: '/demos/safeshield',
      features: [
        '🧠 SafeShield AI - Predictive threat intelligence that stops attacks before they happen',
        '🎯 Security Dashboard - Real-time threat visualization & automated response',
        '🔒 SafeAV - Next-gen antivirus with behavioral analysis',
        '🚨 SafeEDR - Advanced endpoint detection & response',
        '🛡️ SafeMDR - 24/7 managed detection & response service'
      ],
      icon: Shield,
      color: 'primary'
    },
    {
      id: 'safescan-suite',
      name: '🔍 SafeScan™ Advanced Threat Detection',
      description: 'Military-grade scanning suite that competitors fear and clients demand',
      demoUrl: '/demos/safescan',
      features: [
        'SafeDoc - Advanced document malware detection with 99.8% accuracy',
        'SafeMail - Email threat prevention that blocks what others miss', 
        'SafeLink - URL security analysis with real-time reputation scoring',
        'Multi-layered threat intelligence from 500+ security sources',
        'Unified threat dashboard with predictive analytics'
      ],
      icon: Search,
      color: 'blue'
    },
    {
      id: 'safeintel-monitoring',
      name: '🕵️ SafeIntel™ Elite Threat Intelligence',
      description: 'Dark web monitoring so advanced, hackers fear being exposed before they strike',
      demoUrl: '/demos/safeintel',
      features: [
        'Deep & Dark web credential breach monitoring',
        'Advanced persistent threat (APT) tracking',
        'Stolen data marketplace surveillance',
        'Executive protection & brand monitoring',
        'Real-time threat actor intelligence feeds'
      ],
      icon: Eye,
      color: 'red'
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
    name: '🚀 UltriumAI Complete Security Domination Platform',
    description: 'The only cybersecurity platform that makes your competition irrelevant',
    monthlyRevenue: '$500/client',
    setupTime: '15 minutes to market domination',
    marketSize: '32M+ businesses desperately need what you offer',
    revenueModel: {
      charge: 750,
      pay: 250, 
      profit: 500
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
              🚀 MSP Revenue Explosion Center
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
            <strong>Stop competing on price. Start dominating with technology.</strong> Deploy the complete UltriumAI 
            cybersecurity platform and watch your clients beg their competitors to explain why they're so far behind.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-lg px-4 py-2 bg-success/20 text-success border-success/30">
              <TrendingUp className="h-4 w-4 mr-2" />
              $5000+/month potential per MSP
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 border-primary/30 text-primary">
              <Target className="h-4 w-4 mr-2" />
              Unlimited client capacity
            </Badge>
            <Badge variant="outline" className="text-lg px-4 py-2 border-warning/30 text-warning">
              <Star className="h-4 w-4 mr-2" />
              Competition-crushing technology
            </Badge>
          </div>
        </div>

        {/* MSP Value Proposition */}
        <Card className="mb-12 border-2 border-success/20 bg-gradient-to-r from-success/5 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success-foreground text-2xl">
              <Crown className="h-8 w-8 text-warning" />
              Why MSPs Choose UltriumAI - And Why Their Clients Can't Live Without Them
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-success mb-2">🏆 Market Domination</div>
                <p className="text-muted-foreground">Complete platform integration - your clients get everything, competitors get nothing</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">⚡ Instant Deployment</div>
                <p className="text-muted-foreground">15-minute setup that makes you look like a cybersecurity genius</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-warning mb-2">💰 Profit Explosion</div>
                <p className="text-muted-foreground">70-80% profit margins that make other MSPs weep with envy</p>
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