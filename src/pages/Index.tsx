import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, Users, Building2, Zap, ArrowRight, CheckCircle, Globe, Lock, 
  Headphones, Menu, X, Star, TrendingUp, Clock, Award, Search, 
  Database, Wifi, Monitor, Bot, FileText, Smartphone
} from 'lucide-react';
import { useState } from 'react';
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto" />
              <span className="text-xl font-bold">UltriumAI</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link to="/solutions" className="text-muted-foreground hover:text-foreground transition-colors">
                Solutions
              </Link>
              <Link to="/demos" className="text-muted-foreground hover:text-foreground transition-colors">
                Live Demos
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link to="/msps" className="text-muted-foreground hover:text-foreground transition-colors">
                For MSPs
              </Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </Link>
            </nav>

            <div className="hidden lg:flex items-center space-x-4">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button variant="hero">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t py-4">
              <nav className="flex flex-col space-y-4">
                <Link to="/solutions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Solutions
                </Link>
                <Link to="/demos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Live Demos
                </Link>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link to="/msps" className="text-muted-foreground hover:text-foreground transition-colors">
                  For MSPs
                </Link>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
                <hr />
                <Link to="/auth">
                  <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" className="w-full">Get Started</Button>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Complete Cybersecurity Platform for Modern Business
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AI-powered security operations, comprehensive RMM tools, MSP management, and advanced threat detection - all unified in one powerful platform.
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
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Security</h3>
              <p className="text-muted-foreground">Advanced threat detection and automated response</p>
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Solutions for Every Business Size</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From startups to enterprise and managed service providers
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience Our Platform</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Try our interactive demos and see how UltriumAI transforms security operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover-scale">
              <CardHeader>
                <Bot className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">UltriumGPT AI</CardTitle>
                <CardDescription>Intelligent security assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/ultriumgpt">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafePass Manager</CardTitle>
                <CardDescription>Advanced password security</CardDescription>
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
                <CardDescription>Network security surveillance</CardDescription>
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
                <CardTitle className="text-lg">SafeScan Analyzer</CardTitle>
                <CardDescription>Document and file scanning</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safescan">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafeWeb Monitor</CardTitle>
                <CardDescription>Dark web monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safeweb">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Monitor className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">RMM Platform</CardTitle>
                <CardDescription>Remote management tools</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/rmm">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link to="/demos">
              <Button size="lg" variant="hero" className="px-8">
                View All Demos <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">Choose the plan that fits your business needs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <div className="text-3xl font-bold">$29<span className="text-lg text-muted-foreground">/mo</span></div>
                <CardDescription>Perfect for small businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-left mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Up to 25 endpoints</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Basic security monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Email support</span>
                  </div>
                </div>
                <Link to="/pricing">
                  <Button variant="outline" className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center border-primary shadow-lg scale-105">
              <CardHeader>
                <div className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full mx-auto w-fit mb-2">
                  Most Popular
                </div>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <div className="text-3xl font-bold">$99<span className="text-lg text-muted-foreground">/mo</span></div>
                <CardDescription>For growing businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-left mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Up to 250 endpoints</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Advanced AI security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>24/7 support</span>
                  </div>
                </div>
                <Link to="/pricing">
                  <Button variant="hero" className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-3xl font-bold">Custom</div>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-left mb-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Unlimited endpoints</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Custom integrations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dedicated support</span>
                  </div>
                </div>
                <Link to="/contact">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </CardContent>
            </Card>
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

      {/* Footer */}
      <footer className="border-t py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-3 mb-4">
                <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto" />
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
  );
};

export default Index;
