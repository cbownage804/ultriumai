import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Users, 
  Building2, 
  FileText,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  Zap
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const SafeCompPage = () => {
  const features = [
    {
      icon: Shield,
      title: 'Multi-Framework Compliance',
      description: 'Support for SOC 2, HIPAA, PCI DSS, GDPR, ISO 27001, and more'
    },
    {
      icon: Target,
      title: 'Gap Analysis & Remediation',
      description: 'Automated identification of compliance gaps with actionable remediation plans'
    },
    {
      icon: FileText,
      title: 'Evidence Collection',
      description: 'Automated collection and organization of audit evidence and documentation'
    },
    {
      icon: TrendingUp,
      title: 'Risk Assessment',
      description: 'Continuous risk monitoring and assessment with real-time reporting'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Shield className="h-12 w-12 text-primary" />
                <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  SafeComp
                </h1>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Comprehensive Compliance Management Platform
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Streamline your compliance efforts across multiple frameworks with automated gap analysis, 
                risk assessment, and evidence collection. Stay audit-ready 24/7.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Live Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Powerful Compliance Features</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Everything you need to maintain compliance across multiple frameworks and regulations
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Icon className="h-8 w-8 text-primary" />
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default SafeCompPage;