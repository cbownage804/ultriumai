import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  Calculator,
  Mail,
  ShoppingCart,
  CreditCard,
  Phone,
  MessageSquare,
  BarChart,
  Calendar,
  FileText,
  Globe,
  Star,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const BusinessSolutions = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: integrationsRef, isVisible: integrationsVisible } = useScrollAnimation();

  const businessIntegrations = [
    {
      name: 'Tegrity Connect',
      description: 'Complete CRM & Marketing Automation Platform',
      category: 'CRM & Sales',
      status: 'featured',
      icon: Shield,
      benefits: ['Lead Management', 'Email & SMS Marketing', 'Sales Pipeline', 'Customer Communications'],
      pricing: 'Starting at $97/month'
    },
    {
      name: 'Xero',
      description: 'Cloud Accounting & Financial Management',
      category: 'Accounting',
      status: 'available',
      icon: Calculator,
      benefits: ['Invoicing', 'Expense Tracking', 'Financial Reports', 'Bank Integration'],
      pricing: 'Starting at $13/month'
    },
    {
      name: 'QuickBooks Online',
      description: 'Small Business Accounting Software',
      category: 'Accounting',
      status: 'available',
      icon: FileText,
      benefits: ['Bookkeeping', 'Tax Preparation', 'Payroll', 'Inventory Management'],
      pricing: 'Starting at $30/month'
    },
    {
      name: 'HubSpot',
      description: 'Inbound Marketing & Sales Growth Platform',
      category: 'Marketing',
      status: 'available',
      icon: TrendingUp,
      benefits: ['Website Analytics', 'Lead Generation', 'Email Marketing', 'Sales CRM'],
      pricing: 'Free tier available'
    },
    {
      name: 'Shopify',
      description: 'E-commerce Platform for Online Stores',
      category: 'E-commerce',
      status: 'available',
      icon: ShoppingCart,
      benefits: ['Online Store', 'Payment Processing', 'Inventory Management', 'Order Fulfillment'],
      pricing: 'Starting at $39/month'
    },
    {
      name: 'Square',
      description: 'Point of Sale & Payment Processing',
      category: 'Payments',
      status: 'available',
      icon: CreditCard,
      benefits: ['In-Person Payments', 'Online Payments', 'Invoicing', 'Analytics'],
      pricing: '2.6% + 10¢ per transaction'
    },
    {
      name: 'Mailchimp',
      description: 'Email Marketing & Automation',
      category: 'Marketing',
      status: 'available',
      icon: Mail,
      benefits: ['Email Campaigns', 'Audience Management', 'Marketing Automation', 'Analytics'],
      pricing: 'Free up to 500 contacts'
    },
    {
      name: 'Microsoft 365',
      description: 'Business Productivity & Collaboration Suite',
      category: 'Productivity',
      status: 'available',
      icon: Building2,
      benefits: ['Email & Calendar', 'Document Collaboration', 'Video Conferencing', 'Cloud Storage'],
      pricing: 'Starting at $6/user/month'
    },
    {
      name: 'Zapier',
      description: 'Workflow Automation & App Integration',
      category: 'Automation',
      status: 'available',
      icon: Zap,
      benefits: ['App Connections', 'Automated Workflows', 'Data Sync', 'Process Optimization'],
      pricing: 'Free tier available'
    },
    {
      name: 'Calendly',
      description: 'Meeting Scheduling & Appointment Booking',
      category: 'Productivity',
      status: 'available',
      icon: Calendar,
      benefits: ['Online Scheduling', 'Calendar Integration', 'Automated Reminders', 'Meeting Analytics'],
      pricing: 'Free tier available'
    },
    {
      name: 'Slack',
      description: 'Team Communication & Collaboration',
      category: 'Communication',
      status: 'available',
      icon: MessageSquare,
      benefits: ['Team Messaging', 'File Sharing', 'App Integrations', 'Video Calls'],
      pricing: 'Free tier available'
    },
    {
      name: 'Google Workspace',
      description: 'Business Email & Productivity Tools',
      category: 'Productivity',
      status: 'available',
      icon: Globe,
      benefits: ['Gmail for Business', 'Google Drive', 'Google Meet', 'Collaborative Docs'],
      pricing: 'Starting at $6/user/month'
    }
  ];

  const businessCategories = [
    {
      title: 'CRM & Sales',
      description: 'Manage customer relationships and grow your sales',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      count: businessIntegrations.filter(i => i.category === 'CRM & Sales').length
    },
    {
      title: 'Accounting & Finance',
      description: 'Track finances and manage business accounting',
      icon: Calculator,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      count: businessIntegrations.filter(i => i.category === 'Accounting').length
    },
    {
      title: 'E-commerce & Payments',
      description: 'Sell online and process payments securely',
      icon: ShoppingCart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      count: businessIntegrations.filter(i => i.category === 'E-commerce' || i.category === 'Payments').length
    },
    {
      title: 'Marketing & Growth',
      description: 'Attract customers and grow your business',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      count: businessIntegrations.filter(i => i.category === 'Marketing').length
    },
    {
      title: 'Productivity & Communication',
      description: 'Streamline operations and team collaboration',
      icon: MessageSquare,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      count: businessIntegrations.filter(i => i.category === 'Productivity' || i.category === 'Communication').length
    },
    {
      title: 'Automation & Workflows',
      description: 'Automate processes and save time',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      count: businessIntegrations.filter(i => i.category === 'Automation').length
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'featured':
        return <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">⭐ Featured</Badge>;
      case 'available':
        return <Badge variant="outline" className="border-success/30 text-success">Available</Badge>;
      case 'coming_soon':
        return <Badge variant="outline" className="border-info/30 text-info">Coming Soon</Badge>;
      default:
        return <Badge variant="secondary">Available</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" ref={headerRef}>
        <div className={`max-w-7xl mx-auto text-center transition-all duration-1000 transform ${
          headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-primary/80 to-secondary/80 rounded-2xl shadow-lg">
              <Building2 className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Business Solutions
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Platform
            </span>
          </h1>
          
          <p className="text-xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your business operations with powerful integrations. Connect your favorite tools, 
            automate workflows, and grow your business with our comprehensive platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-8 py-3">
              <Star className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-3">
              View Integrations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{businessIntegrations.length}+</div>
              <div className="text-foreground/70">Business Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{businessCategories.length}</div>
              <div className="text-foreground/70">Business Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">24/7</div>
              <div className="text-foreground/70">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              From CRM and accounting to e-commerce and marketing - we've got all the tools 
              your business needs to succeed in one integrated platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businessCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border border-border shadow-md bg-card">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className={`h-7 w-7 text-primary`} />
                  </div>
                  <h3 className="font-semibold text-lg text-card-foreground mb-2">{category.title}</h3>
                  <p className="text-card-foreground/70 text-sm mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {category.count} integrations
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-card-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Integration - Tegrity Connect */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-7xl mx-auto">
          <Card className="border-2 border-primary/30 bg-card shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/28348e0f-1c72-435c-b46f-d51c7100ba4f.png" 
                  alt="Tegrity Connect" 
                  className="h-12 w-auto"
                />
              </div>
              <Badge className="bg-gradient-to-r from-primary to-secondary text-primary-foreground mb-4">
                ⭐ Featured Business CRM
              </Badge>
              <CardTitle className="text-3xl font-bold text-foreground mb-4">
                Complete Business Management Platform
              </CardTitle>
              <CardDescription className="text-lg text-foreground/80 max-w-2xl mx-auto">
                Tegrity Connect provides everything your business needs: CRM, marketing automation, 
                customer communications, and sales pipeline management - all in one powerful platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { icon: Users, title: 'Customer Management', desc: 'Organize and track all customer interactions' },
                  { icon: Mail, title: 'Email & SMS Marketing', desc: 'Automated campaigns and communications' },
                  { icon: BarChart, title: 'Sales Pipeline', desc: 'Track deals from lead to close' },
                  { icon: Phone, title: 'Multi-Channel Support', desc: 'Phone, email, chat, and social media' }
                ].map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                    <p className="text-sm text-foreground/70">{feature.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-8 py-3 mr-4">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="px-8 py-3">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* All Integrations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8" ref={integrationsRef}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              All Business Integrations
            </h2>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              Connect your business tools and streamline your operations with our comprehensive integration library.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 transform ${
            integrationsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            {businessIntegrations.map((integration, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border border-border shadow-md overflow-hidden bg-card">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <integration.icon className="h-6 w-6 text-card-foreground/70 group-hover:text-primary transition-colors duration-300" />
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                  <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-300">
                    {integration.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-card-foreground/70">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {integration.benefits.slice(0, 3).map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center text-sm text-card-foreground/70">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-primary">
                      {integration.pricing}
                    </div>
                    <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Success Stories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Customer Success Stories
            </h2>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              See how businesses like yours have transformed their operations and accelerated growth with our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Success Story 1 - Small Business */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 p-6 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop"
                  alt="Sarah Johnson, Founder of TechStart Solutions"
                  className="w-20 h-20 rounded-full object-cover border-4 border-background"
                />
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-card-foreground/80 italic">
                    "UltriumAI's Tegrity Connect transformed how we manage our 200+ clients. Our response time went from hours to minutes, and client satisfaction increased by 85%."
                  </blockquote>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-card-foreground">Sarah Johnson</h4>
                  <p className="text-sm text-card-foreground/70">Founder, TechStart Solutions</p>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">85%</div>
                      <div className="text-xs text-card-foreground/70">Client Satisfaction</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">200+</div>
                      <div className="text-xs text-card-foreground/70">Clients Managed</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Story 2 - Medium Business */}
            <Card className="group hover:shadow-xl transition-all duration-300 border border-border shadow-md overflow-hidden bg-card">
              <div className="aspect-video bg-gradient-to-br from-success/10 to-info/10 p-6 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=400&h=300&fit=crop"
                  alt="Michael Chen, Operations Director at GrowthCorp"
                  className="w-20 h-20 rounded-full object-cover border-4 border-background"
                />
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-card-foreground/80 italic">
                    "The integrated platform eliminated our workflow bottlenecks. We saved 40 hours per week on manual processes and increased our team productivity by 60%."
                  </blockquote>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-card-foreground">Michael Chen</h4>
                  <p className="text-sm text-card-foreground/70">Operations Director, GrowthCorp</p>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-success">40hrs</div>
                      <div className="text-xs text-card-foreground/70">Weekly Time Saved</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success">60%</div>
                      <div className="text-xs text-card-foreground/70">Productivity Increase</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Story 3 - MSP Partner */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-warning/10 to-primary/10 p-6 flex items-center justify-center">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center border-4 border-background">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <blockquote className="text-card-foreground/80 italic">
                    "As an MSP partner, offering UltriumAI to our clients created a new $50K+ monthly revenue stream. Our clients love the white-labeled solution."
                  </blockquote>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-card-foreground">Elite IT Solutions</h4>
                  <p className="text-sm text-card-foreground/70">MSP Partner Since 2023</p>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-warning">$50K+</div>
                      <div className="text-xs text-card-foreground/70">Monthly Revenue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-warning">150+</div>
                      <div className="text-xs text-card-foreground/70">Deployed Clients</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-card-foreground mb-4">
                  Ready to Write Your Success Story?
                </h3>
                <p className="text-card-foreground/80 mb-6">
                  Join hundreds of businesses that have transformed their operations with our integrated platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground">
                    Start Your Success Story
                  </Button>
                  <Button size="lg" variant="outline">
                    View More Case Studies
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/90 to-secondary/90">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that have streamlined their operations and accelerated growth 
            with our integrated business solutions platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 px-8 py-3">
              <Star className="mr-2 h-5 w-5" />
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-3">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessSolutions;