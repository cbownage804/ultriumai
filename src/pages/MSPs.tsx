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
      title: "Reduce Tickets by 30%",
      description: "Automated first-line support handles common client requests instantly"
    },
    {
      icon: Clock,
      title: "24/7 Client Support",
      description: "Your AI agents work around the clock, improving client satisfaction"
    },
    {
      icon: Settings,
      title: "White-Label Ready",
      description: "Deploy under your brand with custom colors, logos, and messaging"
    },
    {
      icon: BarChart3,
      title: "Scalable Revenue",
      description: "Package AI services as premium offerings for higher margins"
    }
  ];

  const solutions = [
    {
      title: "Client Helpdesk AI",
      description: "Automate Tier 1 support with AI trained on your documentation and procedures",
      features: ["Password resets", "Common IT issues", "Software guidance", "Escalation workflows"],
      price: "Starting at $199/month",
      popular: true
    },
    {
      title: "White-Label Platform",
      description: "Offer AI-powered support as a premium service to your clients",
      features: ["Your branding", "Client segregation", "Custom workflows", "Revenue sharing"],
      price: "Starting at $399/month",
      popular: false
    },
    {
      title: "Internal Operations AI",
      description: "Streamline your internal processes with AI-powered automation",
      features: ["Documentation search", "Procedure guidance", "Staff training", "Knowledge base"],
      price: "Starting at $299/month",
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
              Reduce support tickets by 30%, scale your operations efficiently, and offer premium AI services to your clients with our white-label platform.
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

        {/* Integrations Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Seamless PSA & RMM Integration</h2>
            <p className="text-xl text-muted-foreground mb-12">
              Works with your existing MSP tools and workflows
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
            <h2 className="text-3xl font-bold mb-4">Proven MSP ROI</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">30%</div>
                <p className="text-muted-foreground">Reduction in support tickets</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">$50k</div>
                <p className="text-muted-foreground">Average annual savings</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">90%</div>
                <p className="text-muted-foreground">Client satisfaction improvement</p>
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