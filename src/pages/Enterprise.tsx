import { Building, Users, TrendingUp, Zap, Shield, CheckCircle, Star, ArrowRight, Brain, Lock, AlertTriangle, Server, Database, Globe, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BusinessCheckout from "@/components/BusinessCheckout";

const Enterprise = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Brain,
      title: "Enterprise AI Intelligence",
      description: "Advanced AI systems that understand complex organizational structures and enterprise workflows"
    },
    {
      icon: Globe,
      title: "Global Scale & Compliance",
      description: "Multi-region deployment with enterprise-grade compliance for GDPR, HIPAA, SOX, and industry standards"
    },
    {
      icon: Shield,
      title: "Zero-Trust Security Architecture", 
      description: "Enterprise security with advanced threat detection, audit trails, and complete data sovereignty"
    },
    {
      icon: Settings,
      title: "Enterprise Integrations",
      description: "Seamless integration with SAP, Oracle, Microsoft 365, Salesforce, and custom enterprise systems"
    }
  ];

  const solutions = [
    {
      id: "enterprise",
      title: "Enterprise AI Command Center",
      description: "Comprehensive AI platform with multi-department intelligence, advanced analytics, and executive dashboards for enterprise-wide transformation",
      features: ["Multi-tenant architecture", "Executive analytics", "Department-specific AI agents", "Enterprise SSO integration"],
      price: "$199/month + add-ons"
    },
    {
      id: "enterprise", 
      title: "Enterprise Security Intelligence",
      description: "Advanced AI-powered SafeSOC with threat intelligence, compliance monitoring, and automated incident response",
      features: ["SOC automation", "Threat intelligence", "Compliance reporting", "Incident response workflows"],
      price: "$199/month + SafeSecure"
    },
    {
      id: "custom",
      title: "Custom Enterprise Platform",
      description: "Fully customized AI ecosystem designed for your specific enterprise requirements with dedicated support and custom integrations",
      features: ["Custom AI development", "Dedicated support team", "Enterprise SLA", "Custom integrations"],
      price: "Contact for Quote"
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
              Enterprise Solutions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Transform Your Enterprise with AI-Powered Intelligence
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Deploy enterprise-grade AI solutions that scale across your entire organization. Built for Fortune 500 companies who demand security, compliance, and performance at global scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <BusinessCheckout 
                packageType="enterprise"
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:scale-105 transition-all duration-300"
              >
                Schedule Enterprise Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </BusinessCheckout>
              <Button size="lg" variant="outline" onClick={() => navigate('/business-billing')}>
                Enterprise Pricing
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Fortune 500 Companies Choose UltriumAI</h2>
              <p className="text-xl text-muted-foreground">
                Enterprise-grade AI solutions built for the most demanding organizational requirements
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
              <h2 className="text-3xl font-bold mb-4">Enterprise AI Solutions</h2>
              <p className="text-xl text-muted-foreground">
                Comprehensive AI platforms designed for enterprise scale, security, and compliance
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
                        packageType={solution.id === "custom" ? "enterprise" : solution.id}
                        className="w-full mt-3"
                      >
                        {solution.id === "custom" ? "Contact Sales" : "Get Started"}
                      </BusinessCheckout>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise Features Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 text-primary border-primary">
                Enterprise Grade
              </Badge>
              <h2 className="text-3xl font-bold mb-4">Built for Enterprise Requirements</h2>
              <p className="text-xl text-muted-foreground">
                Advanced capabilities that meet the highest enterprise standards
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Advanced Security & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">SOC 2 Type II, HIPAA, GDPR compliance with advanced encryption, audit trails, and enterprise security controls.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Enterprise Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">Native integration with SAP, Oracle, Microsoft 365, Salesforce, and custom enterprise systems via APIs and webhooks.</p>
                </CardContent>
              </Card>
              
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Executive Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">C-suite dashboards with AI insights, performance metrics, ROI tracking, and strategic recommendations.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Enterprise?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join Fortune 500 companies using AI to drive innovation and competitive advantage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <BusinessCheckout 
                packageType="enterprise"
                size="lg" 
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                Schedule Enterprise Consultation
              </BusinessCheckout>
              <Button size="lg" variant="outline" onClick={() => navigate('/demos')}>
                See Enterprise Demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Dedicated success manager • Enterprise SLA • Custom implementation
            </p>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Enterprise;