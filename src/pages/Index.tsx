import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Building2, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import ultraiumAiLogo from "/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto" />
            <span className="text-xl font-bold">UltriumAI</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Advanced Security Operations for Modern Businesses
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Complete cybersecurity platform with AI-powered threat detection, RMM capabilities, and MSP management tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="hero" className="w-full sm:w-auto">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/demos">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Live Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Complete Security Platform</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to protect, monitor, and manage your digital infrastructure
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>AI-Powered Security</CardTitle>
                <CardDescription>
                  Advanced threat detection with machine learning and real-time monitoring
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>RMM & Endpoint Management</CardTitle>
                <CardDescription>
                  Complete remote monitoring and management for all your devices
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>MSP Solutions</CardTitle>
                <CardDescription>
                  Multi-tenant platform designed for managed service providers
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose UltriumAI?</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Enterprise-Grade Security</h3>
                    <p className="text-muted-foreground">Bank-level encryption and compliance standards</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Real-Time Monitoring</h3>
                    <p className="text-muted-foreground">24/7 automated threat detection and response</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Scalable Platform</h3>
                    <p className="text-muted-foreground">Grows with your business from startup to enterprise</p>
                  </div>
                </div>
              </div>
            </div>
            <Card className="p-8">
              <div className="text-center">
                <Zap className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of businesses protecting their digital assets with UltriumAI
                </p>
                <Link to="/auth">
                  <Button size="lg" variant="hero" className="w-full">
                    Start Your Free Trial
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img src={ultraiumAiLogo} alt="UltriumAI" className="h-8 w-auto" />
            <span className="text-xl font-bold">UltriumAI</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 UltriumAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
