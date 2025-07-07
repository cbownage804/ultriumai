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
  MessageSquare
} from 'lucide-react';
import { SafeNetDemo } from "@/components/demos/SafeNetDemo";
import { DarkWebDemo } from "@/components/demos/DarkWebDemo";
import { SafeScoreDemo } from "@/components/demos/SafeScoreDemo";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const MSPDemos = () => {
  const [selectedDemo, setSelectedDemo] = useState('safescore');

  const mspSolutions = [
    {
      id: 'safepass',
      name: 'SafePass for MSP',
      description: 'White-label password management for your clients',
      monthlyRevenue: '$10/user',
      setupTime: '5 minutes',
      marketSize: 'Every business with employees',
      demoUrl: '/embed-demo',
      features: [
        'One-line website integration',
        'Complete white-label branding',
        'Auto-detects login forms',
        'Team collaboration features',
        'Recurring monthly revenue'
      ],
      revenueModel: {
        charge: 15,
        pay: 5,
        profit: 10
      },
      icon: Shield,
      color: 'blue'
    },
    {
      id: 'safescore',
      name: 'SafeScore for MSP',
      description: 'White-label security risk assessment platform',
      monthlyRevenue: '$35/user',
      setupTime: '15 minutes',
      marketSize: 'Every business with compliance requirements',
      demoUrl: '/demos/safescore',
      features: [
        'Multi-framework security scoring',
        'Complete white-label branding',
        'Automated security assessment',
        'Risk analysis and remediation',
        'Security posture reporting'
      ],
      revenueModel: {
        charge: 50,
        pay: 15,
        profit: 35
      },
      icon: Shield,
      color: 'green'
    },
    {
      id: 'safedoc',
      name: 'SafeDoc for MSP',
      description: 'White-label document security scanning for your clients',
      monthlyRevenue: '$8/user',
      setupTime: '3 minutes',
      marketSize: 'Every business handling documents',
      demoUrl: '/safedoc-embed-demo',
      features: [
        'One-line website integration',
        'Complete white-label branding',
        'Real-time malware detection',
        'VirusTotal API integration',
        'Recurring monthly revenue'
      ],
      revenueModel: {
        charge: 12,
        pay: 4,
        profit: 8
      },
      icon: FileText,
      color: 'green'
    },
    {
      id: 'safemail',
      name: 'SafeMail for MSP',
      description: 'White-label email security scanning for your clients',
      monthlyRevenue: '$6/user',
      setupTime: '3 minutes',
      marketSize: 'Every business with email',
      demoUrl: '/safemail-embed-demo',
      features: [
        'One-line website integration',
        'Complete white-label branding',
        'Real-time threat detection',
        'Phishing & malware scanning',
        'Recurring monthly revenue'
      ],
      revenueModel: {
        charge: 10,
        pay: 4,
        profit: 6
      },
      icon: Mail,
      color: 'blue'
    },
    {
      id: 'safenet',
      name: 'SafeNet for MSP',
      description: 'White-label network scanning and vulnerability assessment',
      monthlyRevenue: '$25/client',
      setupTime: '10 minutes',
      marketSize: 'Every business with a network',
      demoUrl: '/demos/safenet',
      features: [
        'Installable network connector',
        'Complete white-label branding',
        'Device discovery & mapping',
        'Vulnerability scanning',
        'MSP multi-client dashboard'
      ],
      revenueModel: {
        charge: 40,
        pay: 15,
        profit: 25
      },
      icon: Network,
      color: 'purple'
    },
    {
      id: 'safeweb',
      name: 'SafeWeb for MSP',
      description: 'White-label dark web monitoring and threat intelligence',
      monthlyRevenue: '$20/user',
      setupTime: '5 minutes',
      marketSize: 'Every business with digital assets',
      demoUrl: '/demos/safeweb',
      features: [
        'Complete white-label branding',
        'Continuous dark web monitoring',
        'Credential breach detection',
        'Threat intelligence feeds',
        'Automated client alerts'
      ],
      revenueModel: {
        charge: 30,
        pay: 10,
        profit: 20
      },
      icon: Eye,
      color: 'red'
    },
    {
      id: 'security-suite',
      name: 'Security Apps Bundle for MSP',
      description: 'Complete cybersecurity toolkit for SMBs',
      monthlyRevenue: '$50/client',
      setupTime: '15 minutes',
      marketSize: '32M small businesses in US',
      demoUrl: '/demos',
      features: [
        'SafeLink URL scanning',
        'SafeMail threat detection',
        'SafeDoc malware analysis',
        'DarkWeb monitoring',
        'Centralized dashboard'
      ],
      revenueModel: {
        charge: 75,
        pay: 25,
        profit: 50
      },
      icon: Building2,
      color: 'purple'
    },
    {
      id: 'custom-gpts',
      name: 'Custom AI Agents for MSP',
      description: 'Deploy AI assistants for client industries',
      monthlyRevenue: '$100/client',
      setupTime: '30 minutes',
      marketSize: 'Every industry vertical',
      demoUrl: '/ultriumgpt',
      features: [
        'Industry-specific knowledge bases',
        'Client branding and customization',
        'API integrations',
        'Analytics and reporting',
        'Multi-tenant deployment'
      ],
      revenueModel: {
        charge: 150,
        pay: 50,
        profit: 100
      },
      icon: Zap,
      color: 'green'
    },
    {
      id: 'safecenter',
      name: 'SafeCenter for MSP',
      description: 'Combined RMM and helpdesk platform for complete IT management',
      monthlyRevenue: '$45/client',
      setupTime: '25 minutes',
      marketSize: 'Every MSP and IT service provider',
      demoUrl: '/demos/rmm',
      features: [
        'Real-time device monitoring',
        'Intelligent ticket routing',
        'Automated script execution',
        'Patch management system',
        'Remote access & control',
        'SLA tracking & alerts',
        'Multi-client dashboard'
      ],
      revenueModel: {
        charge: 70,
        pay: 25,
        profit: 45
      },
      icon: Wrench,
      color: 'blue'
    },
    {
      id: 'safeav',
      name: 'SafeAV for MSP',
      description: 'AI-powered endpoint protection and threat detection for MSPs',
      monthlyRevenue: '$20/endpoint',
      setupTime: '10 minutes',
      marketSize: 'Every business with computers',
      demoUrl: '/demos/antivirus',
      features: [
        'Real-time threat detection',
        'Behavioral analysis engine',
        'Automated quarantine system',
        'Cloud-based scanning',
        'Centralized MSP management',
        'White-label deployment'
      ],
      revenueModel: {
        charge: 30,
        pay: 10,
        profit: 20
      },
      icon: Shield,
      color: 'red'
    },
    {
      id: 'mdr',
      name: 'SafeEDR for MSP',
      description: 'AI-powered endpoint detection and response for MSPs with behavioral analysis',
      monthlyRevenue: '$100/client',
      setupTime: '30 minutes',
      marketSize: 'Mid-market and enterprise businesses',
      demoUrl: '/demos/safeedr',
      features: [
        '24/7 security monitoring',
        'Expert threat hunting',
        'Incident response',
        'Threat intelligence',
        'Forensic analysis'
      ],
      revenueModel: {
        charge: 150,
        pay: 50,
        profit: 100
      },
      icon: Eye,
      color: 'purple'
    }
  ];

  const currentSolution = mspSolutions.find(s => s.id === selectedDemo) || mspSolutions[0];
  const Icon = currentSolution.icon;

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
            Discover how to create new recurring revenue streams by offering Ultrium's solutions 
            as white-label services to your clients
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
                <div className="text-3xl font-bold text-success mb-2">White-Label</div>
                <p className="text-muted-foreground">Complete branding control - it's YOUR service</p>
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
            <h3 className="text-lg font-semibold">Choose Demo:</h3>
            {mspSolutions.map((solution) => {
              const SolutionIcon = solution.icon;
              return (
                <Card 
                  key={solution.id}
                  className={`cursor-pointer transition-all ${
                    selectedDemo === solution.id 
                      ? 'border-2 border-primary bg-primary/5' 
                      : 'hover:border-border'
                  }`}
                  onClick={() => setSelectedDemo(solution.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <SolutionIcon className="h-6 w-6 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{solution.name}</div>
                        <div className="text-sm text-muted-foreground mb-1">{solution.monthlyRevenue}</div>
                        <div className="text-xs text-muted-foreground/80 line-clamp-2">{solution.description}</div>
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
                  {currentSolution.name}
                </CardTitle>
                <CardDescription className="text-lg">
                  {currentSolution.description}
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
                          <div className="font-semibold">Monthly Revenue</div>
                          <div className="text-2xl font-bold text-success">{currentSolution.monthlyRevenue}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="font-semibold">Setup Time</div>
                          <div className="text-2xl font-bold text-primary">{currentSolution.setupTime}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Target className="h-8 w-8 mx-auto mb-2 text-info" />
                          <div className="font-semibold">Market Size</div>
                          <div className="text-sm font-bold text-info">{currentSolution.marketSize}</div>
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
                              ${currentSolution.revenueModel.charge}
                            </div>
                            <div className="text-sm text-muted-foreground">You charge client</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-primary">
                              ${currentSolution.revenueModel.pay}
                            </div>
                            <div className="text-sm text-muted-foreground">You pay Ultrium</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-info">
                              ${currentSolution.revenueModel.profit}
                            </div>
                            <div className="text-sm text-muted-foreground">Your profit</div>
                          </div>
                        </div>
                        <div className="mt-6 p-4 bg-card border rounded-lg">
                          <div className="text-center">
                            <div className="font-semibold mb-2">Example: 20 clients with 5 users each</div>
                            <div className="text-2xl font-bold text-success">
                              ${currentSolution.revenueModel.profit * 100}/month recurring
                            </div>
                            <div className="text-sm text-muted-foreground">
                              = ${currentSolution.revenueModel.profit * 1200}/year additional revenue
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentSolution.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="demo" className="space-y-4">
                    {selectedDemo === 'safenet' ? (
                      <SafeNetDemo />
                    ) : selectedDemo === 'safeweb' ? (
                      <div className="space-y-4">
                        <div className="text-center space-y-2 mb-6">
                          <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                            <Search className="h-6 w-6 text-primary" />
                            MSP Dark Web Monitoring Demo
                          </h3>
                          <p className="text-muted-foreground">
                            Experience how your clients will see dark web threats targeting their business
                          </p>
                        </div>
                        <DarkWebDemo />
                      </div>
                    ) : selectedDemo === 'safescore' ? (
                      <div className="space-y-4">
                        <div className="text-center space-y-2 mb-6">
                          <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            MSP Security Risk Assessment Demo
                          </h3>
                          <p className="text-muted-foreground">
                            Show clients comprehensive security scoring and risk management
                          </p>
                        </div>
                        <SafeScoreDemo />
                      </div>
                    ) : (
                      <Card className="border-2 border-primary/20">
                        <CardContent className="p-6 text-center space-y-4">
                          <h3 className="text-xl font-semibold">Ready to see it in action?</h3>
                          <p className="text-muted-foreground">
                            Experience the full interactive demo and see how easy it is to deploy
                          </p>
                          <Button 
                            size="lg" 
                            onClick={() => window.open(currentSolution.demoUrl, '_blank')}
                            variant="hero"
                          >
                            <Globe className="h-5 w-5 mr-2" />
                            Launch Interactive Demo
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </Button>
                        </CardContent>
                      </Card>
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
              Join hundreds of MSPs already generating additional recurring revenue with Ultrium's white-label solutions
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