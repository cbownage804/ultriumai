import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageSquare, 
  Clock, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Star,
  Globe,
  Smartphone,
  Mail,
  Slack,
  Phone,
  AlertTriangle,
  TrendingUp,
  Target,
  DollarSign
} from "lucide-react";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const TicketingPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Automation",
      description: "Intelligent ticket routing, automated responses, and smart categorization reduce manual work by 80%"
    },
    {
      icon: MessageSquare,
      title: "Multi-Channel Support",
      description: "Unified inbox for email, chat, phone, and social media inquiries with seamless context switching"
    },
    {
      icon: Clock,
      title: "SLA Management",
      description: "Automated SLA tracking, escalation rules, and performance monitoring to ensure compliance"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time dashboards, performance metrics, and predictive insights for data-driven decisions"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Internal notes, @mentions, task assignments, and knowledge sharing tools"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "SOC 2 compliance, role-based access, audit trails, and data encryption"
    }
  ];

  const useCases = [
    {
      title: "MSP Service Desk",
      description: "Manage client tickets across multiple organizations with dedicated portals and custom branding",
      benefits: ["Multi-tenant architecture", "White-label customization", "Client-specific SLAs", "Automated billing integration"]
    },
    {
      title: "Enterprise IT Support",
      description: "Streamline internal IT operations with advanced automation and integration capabilities",
      benefits: ["AD/LDAP integration", "Asset management sync", "Change management workflows", "Executive reporting"]
    },
    {
      title: "Customer Success Teams",
      description: "Transform support interactions into growth opportunities with intelligent insights",
      benefits: ["Customer health scoring", "Proactive outreach triggers", "Product usage analytics", "Renewal risk alerts"]
    }
  ];

  const integrations = [
    { name: "Microsoft 365", icon: Mail, category: "Productivity" },
    { name: "Slack", icon: Slack, category: "Communication" },
    { name: "Zoom Phone", icon: Phone, category: "Communication" },
    { name: "Salesforce", icon: Globe, category: "CRM" },
    { name: "Jira", icon: Target, category: "Project Management" },
    { name: "Confluence", icon: Globe, category: "Knowledge Base" }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$25",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 3 agents",
        "Email & web chat",
        "Basic automation",
        "Standard SLA tracking",
        "Community support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$45",
      description: "Full-featured solution for growing teams",
      features: [
        "Unlimited agents",
        "All communication channels",
        "Advanced AI automation",
        "Custom SLA rules",
        "Priority support",
        "Advanced analytics"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solution for large organizations",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "Dedicated success manager",
        "Advanced security features",
        "Custom training",
        "SLA guarantees"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto text-center space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <MessageSquare className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold text-gradient">
                SafeDesk
              </h1>
            </div>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto">
              AI-powered ticketing system that transforms support operations with intelligent automation, 
              seamless integrations, and actionable insights
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button size="lg" className="text-lg px-8 py-3" variant="hero">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Watch Demo
              </Button>
            </div>
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                No setup fees
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">80%</div>
                <div className="text-muted-foreground">Faster Resolution</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-success mb-2">95%</div>
                <div className="text-muted-foreground">Customer Satisfaction</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-info mb-2">60%</div>
                <div className="text-muted-foreground">Cost Reduction</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-warning mb-2">24/7</div>
                <div className="text-muted-foreground">AI Availability</div>
              </div>
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
                  <h2 className="text-3xl font-bold">Modern Support Operations</h2>
                  <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
                    SafeDesk combines AI automation with human expertise to deliver exceptional 
                    support experiences while reducing operational costs and improving efficiency.
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
                  <h2 className="text-3xl font-bold">Powerful Features</h2>
                  <p className="text-xl text-muted-foreground">
                    Everything you need to deliver world-class support
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-6 w-6 text-primary" />
                        AI-Powered Automation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Smart ticket categorization and priority assignment</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Automated response suggestions based on context</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Intelligent routing to best available agent</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Predictive escalation recommendations</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        Advanced Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
          
                          <span>Real-time performance dashboards</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Customer satisfaction tracking and trends</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Agent productivity and workload analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span>Predictive insights and recommendations</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="use-cases" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Perfect for Every Team</h2>
                  <p className="text-xl text-muted-foreground">
                    Tailored solutions for different business needs
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
                  <h2 className="text-3xl font-bold">Seamless Integrations</h2>
                  <p className="text-xl text-muted-foreground">
                    Connect with your existing tools and workflows
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
                    Need a custom integration? Our API-first architecture makes it easy to connect 
                    with any system. Contact our team for assistance.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
                  <p className="text-xl text-muted-foreground">
                    Choose the plan that fits your team size and needs
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
                          {tier.price !== "Custom" && <span className="text-lg text-muted-foreground">/agent/month</span>}
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
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="max-w-4xl mx-auto text-center px-4 space-y-8">
            <h2 className="text-4xl font-bold">Ready to Transform Your Support?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of teams who've revolutionized their support operations with SafeDesk
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

export default TicketingPage;