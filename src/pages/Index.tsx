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
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

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
              {user ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.email?.split('@')[0]}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={signOut} 
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link to="/auth">
                    <Button variant="hero">Get Started</Button>
                  </Link>
                </>
              )}
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
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link to="/profile">
                      <Button variant="ghost" className="w-full justify-start">Profile</Button>
                    </Link>
                    <Button 
                      onClick={signOut} 
                      variant="outline" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" className="w-full justify-start">Sign In</Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="hero" className="w-full">Get Started</Button>
                    </Link>
                  </>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      
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
