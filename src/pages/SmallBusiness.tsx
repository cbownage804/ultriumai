import { Users, TrendingUp, Zap, Shield, CheckCircle, Star, ArrowRight, Brain, Lock, AlertTriangle, Server } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SmallBusiness = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Shield,
      title: "Cybersecurity Protection",
      description: "AI-powered threat detection and email security for small businesses"
    },
    {
      icon: Server,
      title: "IT Support Automation",
      description: "Automate common IT helpdesk tasks and reduce response times"
    },
    {
      icon: Lock,
      title: "Data Security & Compliance",
      description: "Protect sensitive business data with enterprise-grade security"
    },
    {
      icon: AlertTriangle,
      title: "Proactive Threat Monitoring",
      description: "24/7 AI monitoring for security threats and vulnerabilities"
    }
  ];

  const solutions = [
    {
      title: "AI Email Security",
      description: "Advanced email threat detection and phishing protection powered by AI",
      features: ["Phishing detection", "Malware scanning", "Link analysis", "Threat reporting"],
      price: "Starting at $79/month"
    },
    {
      title: "IT Helpdesk Automation",
      description: "Automate common IT support tasks with AI-powered helpdesk assistant",
      features: ["Password resets", "Software troubleshooting", "Hardware guidance", "Ticket routing"],
      price: "Starting at $99/month"
    },
    {
      title: "Security Monitoring & Compliance",
      description: "24/7 security monitoring with automated compliance reporting",
      features: ["Threat monitoring", "Compliance tracking", "Security alerts", "Audit reports"],
      price: "Starting at $149/month"
    }
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
              IT & Cybersecurity Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              AI-Powered IT Security for Small Business
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Protect your business with AI-driven cybersecurity solutions. Automate IT support, detect threats, and secure your data with enterprise-grade protection designed for small businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
                View Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Small Businesses Choose UltriumAI for IT Security</h2>
              <p className="text-xl text-muted-foreground">
                Enterprise-grade cybersecurity and IT automation designed for small business budgets and needs
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
              <h2 className="text-3xl font-bold mb-4">IT & Cybersecurity Solutions for Small Business</h2>
              <p className="text-xl text-muted-foreground">
                Comprehensive AI-powered IT and security services designed to protect and support your business
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <Card key={index} className="hover:shadow-xl transition-all duration-300">
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
                      <Button className="w-full mt-3" variant="outline">
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Business?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of small businesses already protecting their operations with AI-powered IT security solutions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/demos')}>
                See Live Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default SmallBusiness;