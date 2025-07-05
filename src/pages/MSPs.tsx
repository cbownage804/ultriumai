import { Shield, Users, Zap, BarChart3, CheckCircle, Star, ArrowRight, Headphones, Settings, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const MSPs = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Headphones,
      title: "Instant Knowledge Access",
      description: "AI searches your documentation to provide instant answers to common questions"
    },
    {
      icon: Clock,
      title: "24/7 Self-Service",
      description: "Your clients get immediate answers from your knowledge base anytime"
    },
    {
      icon: Settings,
      title: "White-Label Ready",
      description: "Deploy under your brand with custom colors, logos, and messaging"
    },
    {
      icon: BarChart3,
      title: "Premium Service Offering",
      description: "Add AI-powered support as a new revenue stream for your MSP"
    }
  ];

  const solutions = [
    {
      title: "AI Knowledge Assistant",
      description: "Train AI on your documentation to instantly answer client questions about procedures and policies",
      features: ["Document-based Q&A", "Procedure guidance", "Policy lookups", "Smart escalation"],
      price: "Starting at $100/month",
      popular: true
    },
    {
      title: "White-Label AI Platform",
      description: "Deploy branded AI assistants for your clients with your company colors and branding",
      features: ["Custom branding", "Client segregation", "Multi-tenant access", "Usage analytics"],
      price: "Starting at $500/month",
      popular: false
    },
    {
      title: "IT Documentation Hub",
      description: "Centralize your IT knowledge base with AI-powered search and instant answers",
      features: ["Document management", "Smart search", "Staff training", "Quick lookups"],
      price: "Starting at $100/month",
      popular: false
    }
  ];

  const integrations = [
    "ConnectWise", "Autotask", "Kaseya", "NinjaRMM", "Atera", "SyncroMSP", "Teams", "Slack"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-6 text-primary">
              <Shield className="h-4 w-4 mr-2" />
              MSP Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              AI-Powered Support for MSPs
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transform your MSP with AI-powered knowledge management. Deploy white-label AI assistants trained on your documentation to provide instant answers and premium client services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300">
                Schedule MSP Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                MSP Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why MSPs Choose UltriumAI</h2>
              <p className="text-xl text-muted-foreground">
                Purpose-built for Managed Service Providers who need to scale efficiently
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">MSP-Specific AI Solutions</h2>
              <p className="text-xl text-muted-foreground">
                Designed specifically for MSP workflows and client management
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <Card key={index} className={`hover:shadow-xl transition-all duration-300 relative ${solution.popular ? 'ring-2 ring-primary' : ''}`}>
                  {solution.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{solution.title}</CardTitle>
                    <CardDescription className="text-base">{solution.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {solution.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t">
                      <p className="font-semibold text-primary text-lg">{solution.price}</p>
                      <Button className="w-full mt-3" variant={solution.popular ? "default" : "outline"}>
                        Get Started
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary">
                Coming Soon
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Advanced MSP Features in Development</h2>
              <p className="text-xl text-muted-foreground">
                Advanced integrations and automation features coming in 2025
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    PSA/RMM Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Direct integration with ConnectWise, Autotask, and other major PSA/RMM platforms for automated ticket creation and client management.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    Automated Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">AI that can actually perform password resets, account unlocks, and basic IT tasks through secure integrations with your systems.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    Advanced Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Deep client insights, predictive maintenance alerts, and comprehensive MSP performance dashboards with ROI tracking.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Popular MSP Tools</h2>
            <p className="text-xl text-muted-foreground mb-12">
              Familiar tools your team already uses daily
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {integrations.map((integration, index) => (
                <div key={index} className="bg-muted/50 p-4 rounded-lg text-center">
                  <span className="font-medium text-sm">{integration}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">MSP Benefits</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Instant</div>
                <p className="text-muted-foreground">Answers from your knowledge base</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <p className="text-muted-foreground">Self-service for your clients</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <p className="text-muted-foreground">Your branding and content</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                Schedule MSP Demo
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/demos')}>
                See Case Studies
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default MSPs;