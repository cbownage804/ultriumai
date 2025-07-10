import Navigation from "@/components/Navigation";
import { SafeScanDemo } from "@/components/demos/SafeScanDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, Star, Zap, Users, ArrowRight, Play, ArrowLeft, Home, Mail, FileText, Link } from "lucide-react";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";

const SafeScanPage = () => {
  const navigate = useNavigate();
  
  const features = [
    "Real-time phishing email detection",
    "Advanced malware document scanning", 
    "URL reputation analysis and verification",
    "Attachment safety verification",
    "Social engineering detection",
    "SSL certificate validation",
    "Domain age and history checks",
    "Content safety scanning across all formats"
  ];

  const pricingTiers = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '14 days',
      icon: Star,
      features: [
        'Up to 100 scans total',
        'Basic threat detection',
        'Email support',
        'Standard reporting'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'Premium',
      price: '$25',
      duration: 'per user/month',
      icon: Zap,
      features: [
        'Up to 1,000 scans per month',
        'Advanced threat intelligence',
        'Real-time alerts',
        'API access',
        'Priority support',
        'Custom reporting'
      ],
      popular: true,
      cta: 'Start Premium'
    },
    {
      name: 'Enterprise',
      price: '$40',
      duration: 'per user/month',
      icon: Users,
      features: [
        'Unlimited scans',
        'Everything in Premium',
        'White-label customization',
        'SSO & SAML integration',
        'Dedicated account manager',
        'Custom integrations',
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
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Ultrium SafeScan™
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
                Complete security scanning solution. Analyze emails, documents, and URLs in one unified platform. 
                Protect your organization from all digital threats with AI-powered detection.
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

            {/* Feature Icons */}
            <div className="flex justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2 mx-auto w-fit">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-sm font-medium">Email Security</p>
              </div>
              <div className="text-center">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-2 mx-auto w-fit">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm font-medium">Document Scanning</p>
              </div>
              <div className="text-center">
                <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-2 mx-auto w-fit">
                  <Link className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium">URL Analysis</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Comprehensive Security Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                All-in-one security scanning with AI-powered threat detection across emails, documents, and URLs
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
              <h2 className="text-3xl font-bold mb-4">Try SafeScan Live</h2>
              <p className="text-muted-foreground">
                Test our comprehensive security scanning with sample emails, documents, and URLs
              </p>
            </div>
            <SafeScanDemo />
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your SafeScan Plan</h2>
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
                <h3 className="text-2xl font-bold mb-4">Ready to Secure Everything?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of organizations protecting their digital assets with SafeScan's comprehensive security platform
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

export default SafeScanPage;