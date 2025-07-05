import { Users, TrendingUp, Zap, Shield, CheckCircle, Star, ArrowRight, Brain } from "lucide-react";
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
      icon: TrendingUp,
      title: "Boost Productivity by 40%",
      description: "Automate routine tasks and let your team focus on growth"
    },
    {
      icon: Zap,
      title: "Instant Customer Support",
      description: "24/7 AI-powered support that never sleeps"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level security without the enterprise cost"
    },
    {
      icon: Brain,
      title: "Smart Knowledge Base",
      description: "Your company knowledge, instantly accessible"
    }
  ];

  const solutions = [
    {
      title: "Customer Support AI",
      description: "Handle customer inquiries instantly with AI trained on your knowledge base",
      features: ["24/7 availability", "Instant responses", "Escalation to humans", "Multi-language support"],
      price: "Starting at $49/month"
    },
    {
      title: "Internal Knowledge Assistant",
      description: "Help your team find information quickly from your company documents",
      features: ["Document search", "Policy Q&A", "Training materials", "Onboarding support"],
      price: "Starting at $79/month"
    },
    {
      title: "Sales & Marketing AI",
      description: "Generate content, qualify leads, and support your sales process",
      features: ["Lead qualification", "Content generation", "Email templates", "Product recommendations"],
      price: "Starting at $99/month"
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
              <Users className="h-4 w-4 mr-2" />
              Small Business Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              AI That Grows With Your Business
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Transform your small business with custom AI solutions that automate tasks, support customers, and help your team work smarter—not harder.
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
                Built specifically for growing companies that need enterprise capabilities without enterprise complexity
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
              <h2 className="text-3xl font-bold mb-4">AI Solutions Built for Small Business</h2>
              <p className="text-xl text-muted-foreground">
                Choose from our pre-built solutions or let us create something custom for your needs
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
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of small businesses already using AI to grow faster and serve customers better
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