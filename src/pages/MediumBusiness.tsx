import { Building, Users, TrendingUp, Zap, Shield, CheckCircle, Star, ArrowRight, Brain, Lock, AlertTriangle, Server, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BusinessCheckout from "@/components/BusinessCheckout";

const MediumBusiness = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Brain,
      title: "Advanced Knowledge Management",
      description: "AI-powered document search and intelligent Q&A for your entire organization"
    },
    {
      icon: Database,
      title: "Multi-Department Support",
      description: "Scalable solutions that work across HR, IT, Operations, and Customer Service"
    },
    {
      icon: Shield,
      title: "Enterprise Security Scanning",
      description: "Advanced AI-powered security analysis for emails, links, documents, and networks"
    },
    {
      icon: Users,
      title: "Team Collaboration Tools",
      description: "Custom AI assistants that integrate with your existing workflow and team structure"
    }
  ];

  const solutions = [
    {
      id: "starter",
      title: "Starter Plus",
      description: "Advanced AI system trained on your company documents with enhanced capabilities for growing teams",
      features: ["Multi-department search", "Advanced Q&A", "Policy management", "Enhanced security scanning"],
      price: "$20/user/month"
    },
    {
      id: "professional", 
      title: "Professional Platform",
      description: "Comprehensive AI-powered platform with security scanning, knowledge management, and advanced analytics",
      features: ["Real-time threat detection", "Advanced analytics", "Compliance reporting", "Multi-vector scanning"],
      price: "$89/month"
    },
    {
      id: "enterprise",
      title: "Enterprise AI Platform",
      description: "Fully customizable AI platform with multiple specialized agents for different departments and use cases",
      features: ["Multi-agent deployment", "Department customization", "Advanced integrations", "Enterprise analytics"],
      price: "$199/month"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="secondary" className="mb-6 text-primary">
              <Building className="h-4 w-4 mr-2" />
              Medium Business Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              AI-Powered Enterprise Solutions for Growing Companies
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Scale your operations with advanced AI knowledge management and security solutions. Perfect for companies with 25-250 employees who need enterprise-grade capabilities without enterprise complexity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <BusinessCheckout 
                packageType="professional"
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </BusinessCheckout>
              <Button size="lg" variant="outline" onClick={() => navigate('/business-billing')}>
                View Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Medium Businesses Choose UltriumAI</h2>
              <p className="text-xl text-muted-foreground">
                Enterprise-grade AI solutions designed to scale with your growing organization
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
              <h2 className="text-3xl font-bold mb-4">Enterprise AI Solutions for Medium Business</h2>
              <p className="text-xl text-muted-foreground">
                Scalable AI platforms that grow with your organization and adapt to your unique needs
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
                      <BusinessCheckout 
                        packageType={solution.id}
                        className="w-full mt-3"
                      >
                        Get Started
                      </BusinessCheckout>
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
              <h2 className="text-3xl font-bold mb-4">Advanced Enterprise Features in Development</h2>
              <p className="text-xl text-muted-foreground">
                Advanced automation and enterprise integrations coming in 2025
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    ERP Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Direct integration with SAP, Oracle, Microsoft Dynamics, and other enterprise systems for seamless data flow and automated workflows.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    Predictive Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Advanced AI analytics that predict business trends, identify opportunities, and provide actionable insights for strategic decision making.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    Process Automation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Intelligent workflow automation that can handle complex business processes, approvals, and multi-step operations across departments.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Scale Your Business with AI?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join medium businesses already using AI to streamline operations and accelerate growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <BusinessCheckout 
                packageType="professional"
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                Start Free Trial
              </BusinessCheckout>
              <Button size="lg" variant="outline" onClick={() => navigate('/demos')}>
                See Enterprise Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • 30-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default MediumBusiness;