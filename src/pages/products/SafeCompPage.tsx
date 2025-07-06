import Navigation from "@/components/Navigation";
import { SafeCompDemo } from "@/components/demos/SafeCompDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Check, Star, Zap, Shield, ArrowRight, Play, ArrowLeft, Home } from "lucide-react";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const SafeCompPage = () => {
  const navigate = useNavigate();
  
  const features = [
    "Compliance monitoring",
    "Automated audit workflows",
    "Risk assessment tools",
    "Multi-framework support",
    "Automated reporting",
    "Remediation tracking",
    "Policy management",
    "Evidence collection"
  ];

  const pricingTiers = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '14 days',
      icon: Star,
      features: [
        'Basic compliance checks',
        'SOC 2 framework',
        'Weekly reports',
        'Email support'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Premium',
      price: '$20',
      duration: 'per user/month',
      icon: Zap,
      features: [
        'Multi-framework support',
        'Automated assessments',
        'Real-time monitoring',
        'API access',
        'Priority support',
        'Custom reports'
      ],
      popular: true,
      cta: 'Start Premium'
    },
    {
      name: 'Enterprise',
      price: '$35',
      duration: 'per user/month',
      icon: Users,
      features: [
        'Everything in Premium',
        'Custom frameworks',
        'Advanced analytics',
        'White-label customization',
        'SSO & SAML integration',
        'Dedicated account manager',
        'SLA guarantees'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-20">
        {/* Navigation Header */}
        <div className="bg-muted/30 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Ultrium SafeComp™
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
                Comprehensive compliance management and audit platform. Automate compliance monitoring, streamline audits, and maintain regulatory compliance across multiple frameworks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="btn-glow">
                  <Play className="mr-2 h-5 w-5" />
                  Try Live Demo Below
                </Button>
                <Button variant="outline" size="lg">
                  <Shield className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Advanced Compliance Management</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive compliance automation with support for multiple regulatory frameworks
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-success" />
                      <span className="font-medium">{feature}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try SafeComp Live</h2>
              <p className="text-muted-foreground">
                Experience our compliance management platform with sample frameworks and audit workflows
              </p>
            </div>
            <SafeCompDemo />
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your SafeComp Plan</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Start with a free trial, then choose the plan that fits your organization's needs
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => {
                const Icon = tier.icon;
                return (
                  <Card 
                    key={index} 
                    className={`relative ${tier.popular ? 'border-primary border-2' : ''} hover:shadow-lg transition-all duration-300`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        {tier.price}
                        <span className="text-sm font-normal text-muted-foreground">/{tier.duration}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-success flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full" 
                        variant={tier.popular ? "default" : "outline"}
                      >
                        {tier.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent>
                <h3 className="text-2xl font-bold mb-4">Ready to Automate Compliance?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of organizations streamlining their compliance with SafeComp
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="btn-glow">
                    Start Free Trial
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => window.location.href = '/contact'}>
                    Schedule Demo Call
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SafeCompPage;