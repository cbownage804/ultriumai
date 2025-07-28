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
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">⭐ Featured</Badge>;
      case 'available':
        return <Badge variant="outline" className="border-green-200 text-green-700">Available</Badge>;
      case 'coming_soon':
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Coming Soon</Badge>;
      default:
        return <Badge variant="secondary">Available</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8" ref={headerRef}>
        <div className={`max-w-7xl mx-auto text-center transition-all duration-1000 transform ${
          headerVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Business Solutions
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Platform
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Streamline your business operations with powerful integrations. Connect your favorite tools, 
            automate workflows, and grow your business with our comprehensive platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
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
              <div className="text-3xl font-bold text-gray-900">{businessIntegrations.length}+</div>
              <div className="text-gray-600">Business Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{businessCategories.length}</div>
              <div className="text-gray-600">Business Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Overview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything Your Business Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From CRM and accounting to e-commerce and marketing - we've got all the tools 
              your business needs to succeed in one integrated platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businessCategories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 ${category.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <category.icon className={`h-7 w-7 ${category.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {category.count} integrations
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Integration - Tegrity Connect */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <Card className="border-2 border-blue-200 bg-white shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-4">
                <img 
                  src="/lovable-uploads/28348e0f-1c72-435c-b46f-d51c7100ba4f.png" 
                  alt="Tegrity Connect" 
                  className="h-12 w-auto"
                />
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white mb-4">
                ⭐ Featured Business CRM
              </Badge>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                Complete Business Management Platform
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 mr-4">
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              All Business Integrations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect your business tools and streamline your operations with our comprehensive integration library.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-1000 transform ${
            integrationsVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}>
            {businessIntegrations.map((integration, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors duration-300">
                      <integration.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {integration.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {integration.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    {integration.benefits.slice(0, 3).map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-blue-600">
                      {integration.pricing}
                    </div>
                    <Button size="sm" variant="outline" className="group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that have streamlined their operations and accelerated growth 
            with our integrated business solutions platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-3">
              <Star className="mr-2 h-5 w-5" />
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessSolutions;