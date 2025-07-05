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
      icon: Brain,
      title: "Instant Knowledge Access",
      description: "AI searches your company documents to answer employee questions instantly"
    },
    {
      icon: Server,
      title: "Self-Service Support",
      description: "Employees get immediate answers without waiting for IT help"
    },
    {
      icon: Lock,
      title: "Basic Security Scanning",
      description: "Simple AI-powered checks for emails, links, and documents"
    },
    {
      icon: Shield,
      title: "Custom AI Assistant",
      description: "Branded chatbot trained on your specific business content"
    }
  ];

  const solutions = [
    {
      title: "AI Knowledge Assistant",
      description: "Train AI on your company documents to provide instant answers to employee questions",
      features: ["Document search", "Policy Q&A", "Procedure guidance", "Employee self-service"],
      price: "Starting at $100/month"
    },
    {
      title: "Basic Security Scanning",
      description: "Simple security checks for emails, links, and documents using AI-powered detection",
      features: ["Email scanning", "Link checking", "Document analysis", "Security tips"],
      price: "Starting at $100/month"
    },
    {
      title: "Custom Business Chatbot",
      description: "Deploy a branded AI assistant for your website or internal use with your content",
      features: ["Custom branding", "Website integration", "Knowledge training", "Usage analytics"],
      price: "Starting at $500/month"
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
              <Brain className="h-4 w-4 mr-2" />
              AI Knowledge Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              AI-Powered Knowledge Assistant for Small Business
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transform your business operations with AI that learns from your documents and procedures. Provide instant answers to employees and basic security scanning for your digital content.
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
              <h2 className="text-3xl font-bold mb-4">Why Small Businesses Choose UltriumAI</h2>
              <p className="text-xl text-muted-foreground">
                AI-powered knowledge management and basic security tools designed for growing businesses
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
              <h2 className="text-3xl font-bold mb-4">AI Knowledge Solutions for Small Business</h2>
              <p className="text-xl text-muted-foreground">
                Simple AI tools to help your business access information faster and add basic security checking
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
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business Knowledge?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join small businesses already using AI to make their company information instantly accessible to employees
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