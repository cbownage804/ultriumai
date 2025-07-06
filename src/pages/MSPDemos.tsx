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
  Crown
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const MSPDemos = () => {
  const [selectedDemo, setSelectedDemo] = useState('safepass');

  const mspSolutions = [
    {
      id: 'safepass',
      name: 'SafePass Embeddable',
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
      id: 'security-suite',
      name: 'Security Apps Bundle',
      description: 'Complete cybersecurity toolkit for SMBs',
      monthlyRevenue: '$50/client',
      setupTime: '15 minutes',
      marketSize: '32M small businesses in US',
      demoUrl: '/demos',
      features: [
        'SafeLink URL scanning',
        'SafeEmail threat detection',
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
      name: 'Custom AI Agents',
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
    }
  ];

  const currentSolution = mspSolutions.find(s => s.id === selectedDemo) || mspSolutions[0];
  const Icon = currentSolution.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
        <Card className="mb-12 border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Crown className="h-6 w-6" />
              Why MSPs Choose Ultrium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">White-Label</div>
                <p className="text-green-700">Complete branding control - it's YOUR service</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">Quick Setup</div>
                <p className="text-blue-700">Deploy to clients in minutes, not weeks</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">High Margins</div>
                <p className="text-purple-700">60-70% profit margins on all solutions</p>
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
                      ? `border-2 border-${solution.color}-500 bg-${solution.color}-50` 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDemo(solution.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <SolutionIcon className={`h-6 w-6 text-${solution.color}-600`} />
                      <div>
                        <div className="font-medium">{solution.name}</div>
                        <div className="text-sm text-muted-foreground">{solution.monthlyRevenue}</div>
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
                  <Icon className={`h-8 w-8 text-${currentSolution.color}-600`} />
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
                          <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="font-semibold">Monthly Revenue</div>
                          <div className="text-2xl font-bold text-green-600">{currentSolution.monthlyRevenue}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                          <div className="font-semibold">Setup Time</div>
                          <div className="text-2xl font-bold text-blue-600">{currentSolution.setupTime}</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <Target className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                          <div className="font-semibold">Market Size</div>
                          <div className="text-sm font-bold text-purple-600">{currentSolution.marketSize}</div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="revenue" className="space-y-4">
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">Revenue Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-green-600">
                              ${currentSolution.revenueModel.charge}
                            </div>
                            <div className="text-sm text-green-700">You charge client</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-blue-600">
                              ${currentSolution.revenueModel.pay}
                            </div>
                            <div className="text-sm text-blue-700">You pay Ultrium</div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-3xl font-bold text-purple-600">
                              ${currentSolution.revenueModel.profit}
                            </div>
                            <div className="text-sm text-purple-700">Your profit</div>
                          </div>
                        </div>
                        <div className="mt-6 p-4 bg-white rounded-lg">
                          <div className="text-center">
                            <div className="font-semibold mb-2">Example: 20 clients with 5 users each</div>
                            <div className="text-2xl font-bold text-green-600">
                              ${currentSolution.revenueModel.profit * 100}/month recurring
                            </div>
                            <div className="text-sm text-gray-600">
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
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="demo" className="space-y-4">
                    <Card className="border-2 border-blue-200">
                      <CardContent className="p-6 text-center space-y-4">
                        <h3 className="text-xl font-semibold">Ready to see it in action?</h3>
                        <p className="text-muted-foreground">
                          Experience the full interactive demo and see how easy it is to deploy
                        </p>
                        <Button 
                          size="lg" 
                          onClick={() => window.open(currentSolution.demoUrl, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Globe className="h-5 w-5 mr-2" />
                          Launch Interactive Demo
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <Card className="mt-12 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-3xl font-bold text-blue-900">
              Ready to Scale Your MSP Business?
            </h2>
            <p className="text-xl text-blue-700 max-w-2xl mx-auto">
              Join hundreds of MSPs already generating additional recurring revenue with Ultrium's white-label solutions
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
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