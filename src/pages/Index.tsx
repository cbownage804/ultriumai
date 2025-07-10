import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, Building2, Zap, ArrowRight, CheckCircle, Globe, Lock, Headphones } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Complete Cybersecurity Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered security operations, RMM tools, and MSP management - all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="hero" className="w-full sm:w-auto">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/demos">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View Live Demos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Solutions for Every Business</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From small businesses to enterprise and MSP providers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover-scale">
              <CardHeader>
                <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Small Business</CardTitle>
                <CardDescription>
                  Complete security solutions designed for growing companies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/small-business">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale">
              <CardHeader>
                <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>
                  Advanced security operations for large organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/enterprise">
                  <Button variant="outline" className="w-full">Learn More</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="text-center hover-scale">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle>MSP/MSSP</CardTitle>
                <CardDescription>
                  Multi-tenant platform for managed service providers
                </CardDescription>
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
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our interactive demos and see how UltriumAI can transform your security operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-scale">
              <CardHeader>
                <Shield className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">UltriumGPT</CardTitle>
                <CardDescription>AI-powered security assistant</CardDescription>
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
                <CardTitle className="text-lg">SafePass</CardTitle>
                <CardDescription>Password security management</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safepass">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">SafeNet</CardTitle>
                <CardDescription>Network security monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/demos/safenet">
                  <Button variant="outline" className="w-full">Try Demo</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link to="/demos">
              <Button size="lg" variant="hero">
                View All Demos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Choose UltriumAI?</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">AI-Powered Security</h3>
                    <p className="text-muted-foreground">Advanced threat detection with machine learning</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Complete RMM Suite</h3>
                    <p className="text-muted-foreground">Remote monitoring and management tools</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">MSP-Ready Platform</h3>
                    <p className="text-muted-foreground">Multi-tenant architecture for service providers</p>
                  </div>
                </div>
              </div>
            </div>
            <Card className="p-8">
              <div className="text-center">
                <Headphones className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of businesses securing their digital infrastructure
                </p>
                <Link to="/contact">
                  <Button size="lg" variant="hero" className="w-full mb-4">
                    Contact Sales
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="w-full">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
