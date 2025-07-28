import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Shield, Users, Building2, Zap, ArrowRight, CheckCircle, Globe, Lock, 
  Headphones, Menu, X, Star, TrendingUp, Clock, Award, Search, 
  Database, Wifi, Monitor, Bot, FileText, Smartphone, Eye, User, LogOut
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { FAQSection } from '@/components/FAQSection';
import { FAQSchema, OrganizationSchema, ServiceSchema } from '@/components/SEOSchemas';

const Index = () => {
  const mainFAQs = [
    {
      question: "What is UltriumAI and how does it protect my business?",
      answer: "UltriumAI is a comprehensive cybersecurity platform that combines AI-powered threat detection, remote monitoring tools, and MSP management capabilities. Our platform provides 24/7 protection against cyber threats, automated incident response, and complete visibility into your digital infrastructure."
    },
    {
      question: "How quickly can I implement UltriumAI in my organization?",
      answer: "Most businesses can be up and running with UltriumAI within 24-48 hours. Our onboarding team provides white-glove setup, agent deployment assistance, and initial configuration to ensure seamless integration with your existing infrastructure."
    },
    {
      question: "What makes UltriumAI different from other cybersecurity solutions?",
      answer: "UltriumAI uniquely combines AI-powered security operations with comprehensive RMM tools in a single platform. Our UltriumGPT AI assistant provides intelligent threat analysis, automated response capabilities, and can integrate with your existing security stack for enhanced protection."
    },
    {
      question: "Do you support MSPs and MSSPs?",
      answer: "Yes! UltriumAI is built with a multi-tenant architecture specifically designed for Managed Service Providers and Managed Security Service Providers. We offer white-label solutions, client management tools, and scalable pricing for service providers."
    },
    {
      question: "What kind of support and training do you provide?",
      answer: "We provide comprehensive support including 24/7 technical assistance, onboarding training, regular security briefings, and access to our knowledge base. Enterprise customers receive dedicated account management and custom training programs."
    },
    {
      question: "How does your pricing work for different business sizes?",
      answer: "We offer flexible pricing tiers designed for every business size - from small businesses starting at $29/month to enterprise custom solutions. All plans include core security features, with advanced capabilities and higher endpoint limits in upper tiers."
    }
  ];

  const services = [
    { name: "AI-Powered Threat Detection", description: "Advanced machine learning algorithms for real-time threat identification", url: "https://ultriumai.com/products/safescan" },
    { name: "SafeSOC", description: "Complete SOC dashboard with real-time monitoring and incident response", url: "https://ultriumai.com/security-dashboard" },
    { name: "Remote Monitoring & Management", description: "Comprehensive RMM tools for endpoint management", url: "https://ultriumai.com/products/safenet" },
    { name: "MSP Management Platform", description: "Multi-tenant platform for service providers", url: "https://ultriumai.com/msps" },
    { name: "Password Management", description: "Enterprise-grade password security solution", url: "https://ultriumai.com/products/safepass" },
    { name: "Security Analytics", description: "Advanced security intelligence and reporting", url: "https://ultriumai.com/products/safescore" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Schemas */}
      <OrganizationSchema />
      <ServiceSchema services={services} />
      <FAQSchema faqs={mainFAQs} />
      
      <Navigation />
      <div className="pt-16">
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="animate-fade-in">
            <div className="space-y-2 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Powered by UltriumGPT AI</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Complete Cybersecurity Platform with AI-Powered Intelligence
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              UltriumGPT AI-powered security operations, comprehensive RMM tools, MSP management, and advanced threat detection - all unified in one revolutionary platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/auth">
                <Button size="lg" variant="hero" className="w-full sm:w-auto px-8">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/demos">
                <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                  View Live Demos
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              ✓ No credit card required • ✓ 14-day free trial • ✓ Full platform access
            </p>
          </div>
        </div>
      </section>

      {/* Key Features Highlight */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">UltriumGPT AI Assistant</h3>
              <p className="text-muted-foreground">Intelligent security analysis and automated response with advanced reasoning</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete RMM Suite</h3>
              <p className="text-muted-foreground">Remote monitoring and management tools</p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">MSP-Ready Platform</h3>
              <p className="text-muted-foreground">Multi-tenant architecture for service providers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">💼 Choose Your Security Victory</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Every business size gets enterprise-grade protection. From startup to Fortune 500 - 
              <strong>your competition wishes they had what you're about to get.</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center hover-scale border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Small Business</CardTitle>
                <CardDescription>Essential security for growing companies</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/small-business">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Medium Business</CardTitle>
                <CardDescription>Advanced security operations</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/medium-business">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Full-scale security platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/enterprise">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale border-2 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>MSP/MSSP</CardTitle>
                <CardDescription>Multi-tenant service provider platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/msps">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Demos Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">🔥 Experience The Security Revolution</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Don't just protect your business - <strong>dominate cyber threats</strong> with our AI-powered security arsenal. 
              These aren't just demos - they're your competitive advantage waiting to be unleashed.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-success/10 rounded-full border border-primary/20">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join 50,000+ businesses already protected</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* SafeShield - Revolutionary Platform */}
            <Card className="hover-scale border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">🚀 SafeShield™ Platform</CardTitle>
                <CardDescription className="font-medium text-primary/80">Revolutionary AI-powered security ecosystem</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safeshield">
                  <Button variant="hero" className="w-full">Experience Revolution</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardHeader>
                <Bot className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">🚀 UltriumGPT AI Assistant</CardTitle>
                <CardDescription className="font-medium text-primary/80">Revolutionary AI-powered intelligent assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/ultriumgpt">
                  <Button variant="hero" className="w-full">Experience UltriumGPT</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Bot className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">UltriumGPT Chat</CardTitle>
                <CardDescription>Your intelligent security co-pilot with web browsing & memory</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/ultrium-gpt">
                  <Button variant="outline" className="w-full">Try Interactive Chat</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafePass Manager</CardTitle>
                <CardDescription>Unbreakable password fortress</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safepass">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Wifi className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafeNet Monitor</CardTitle>
                <CardDescription>Network fortress protection</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safenet">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Search className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafeScan™ Analyzer</CardTitle>
                <CardDescription>Advanced threat detection engine</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safescan">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale border-2 border-success/30 bg-gradient-to-br from-success/5 to-success/10">
              <CardHeader>
                <Monitor className="h-8 w-8 text-success mb-2" />
                <CardTitle className="text-lg">🔥 SafeSOC</CardTitle>
                <CardDescription className="font-medium text-success/80">Full SOC dashboard with real-time threat intelligence</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/security-dashboard">
                  <Button variant="outline" className="w-full border-success text-success hover:bg-success hover:text-success-foreground">
                    Launch SOC Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Eye className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafeIntel™ Monitor</CardTitle>
                <CardDescription>Elite threat intelligence platform</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safeintel">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link to="/demos">
              <Button size="lg" variant="hero" className="px-8 py-4 text-lg">
                🚀 Experience All Revolutionary Tools <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-3">
              See why competitors can't keep up with businesses using UltriumAI
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Pricing Path</h2>
            <p className="text-xl text-muted-foreground">Tailored pricing for businesses and service providers</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Business Pricing */}
            <Card className="text-center hover-scale border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-8">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-primary" />
                <CardTitle className="text-2xl mb-2">Business Pricing</CardTitle>
                <CardDescription className="text-base">
                  Perfect for companies looking to protect their own infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Direct endpoint protection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">AI-powered threat detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">24/7 monitoring & support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Starting at $29/month</span>
                  </div>
                </div>
                <Link to="/pricing">
                  <Button variant="hero" className="w-full" size="lg">
                    View Business Pricing
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* MSP Pricing */}
            <Card className="text-center hover-scale border-2 border-success/30 bg-gradient-to-br from-success/5 to-success/10">
              <CardHeader className="pb-8">
                <Users className="h-16 w-16 mx-auto mb-4 text-success" />
                <CardTitle className="text-2xl mb-2">MSP Pricing</CardTitle>
                <CardDescription className="text-base">
                  Designed for service providers managing multiple clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Multi-tenant architecture</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">White-label solutions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">High profit margins (90%+)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Per-user pricing model</span>
                  </div>
                </div>
                <Link to="/msp-pricing">
                  <Button variant="outline" className="w-full border-success text-success hover:bg-success hover:text-success-foreground" size="lg">
                    View MSP Pricing
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-6">
              Not sure which pricing model fits your needs?
            </p>
            <Link to="/contact">
              <Button variant="outline" size="lg">
                Contact Our Sales Team
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose UltriumAI */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Choose UltriumAI?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Industry-Leading Security</h3>
                    <p className="text-muted-foreground">SOC2 compliant with enterprise-grade encryption and security protocols</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">24/7 Real-Time Monitoring</h3>
                    <p className="text-muted-foreground">Continuous threat detection and automated response capabilities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Scalable Platform</h3>
                    <p className="text-muted-foreground">Grows seamlessly from small business to enterprise scale</p>
                  </div>
                </div>
              </div>
            </div>
            <Card className="p-8">
              <div className="text-center">
                <Headphones className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6">
                  Join over 10,000+ businesses securing their digital infrastructure with UltriumAI
                </p>
                <div className="space-y-3">
                  <Link to="/auth">
                    <Button size="lg" variant="hero" className="w-full">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button size="lg" variant="outline" className="w-full">
                      Schedule Demo
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  No credit card required • 14-day free trial
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection faqs={mainFAQs} className="bg-muted/30" />

      {/* Footer */}
      <footer className="border-t py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-3 mb-4">
                <span className="text-xl font-bold">UltriumAI</span>
              </Link>
              <p className="text-muted-foreground text-sm">
                Complete cybersecurity platform for modern businesses.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <div className="space-y-2 text-sm">
                <Link to="/small-business" className="block text-muted-foreground hover:text-foreground">Small Business</Link>
                <Link to="/medium-business" className="block text-muted-foreground hover:text-foreground">Medium Business</Link>
                <Link to="/enterprise" className="block text-muted-foreground hover:text-foreground">Enterprise</Link>
                <Link to="/msps" className="block text-muted-foreground hover:text-foreground">MSP/MSSP</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link to="/demos" className="block text-muted-foreground hover:text-foreground">Live Demos</Link>
                <Link to="/pricing" className="block text-muted-foreground hover:text-foreground">Pricing</Link>
                <Link to="/docs" className="block text-muted-foreground hover:text-foreground">Documentation</Link>
                <Link to="/security" className="block text-muted-foreground hover:text-foreground">Security</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <Link to="/contact" className="block text-muted-foreground hover:text-foreground">Contact Us</Link>
                <Link to="/terms" className="block text-muted-foreground hover:text-foreground">Terms of Service</Link>
                <Link to="/privacy" className="block text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              </div>
            </div>
          </div>
          
          <hr className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            © 2024 UltriumAI. All rights reserved.
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Index;
