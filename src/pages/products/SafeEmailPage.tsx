import Navigation from "@/components/Navigation";
import { SafeEmailDemo } from "@/components/demos/SafeEmailDemo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, Star, Zap, Users, Shield, ArrowRight, Play } from "lucide-react";
import Footer from "@/components/Footer";

const SafeEmailPage = () => {
  const features = [
    "Real-time phishing detection",
    "Advanced malware scanning", 
    "Social engineering detection",
    "BEC (Business Email Compromise) protection",
    "Attachment safety verification",
    "Link analysis and reputation checking",
    "Sender reputation scoring",
    "Email header analysis"
  ];

  const pricingTiers = [
    {
      name: 'Free Trial',
      price: '$0',
      duration: '14 days',
      icon: Star,
      features: [
        'Up to 100 email scans',
        'Basic threat detection',
        'Email support',
        'Standard reporting'
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
        'Up to 1,000 email scans per month',
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
      price: '$35',
      duration: 'per user/month',
      icon: Users,
      features: [
        'Unlimited email scans',
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
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-background via-background/95 to-primary/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Ultrium SafeEmail™
                </h1>
              </div>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
                AI-powered email analysis and threat detection. Protect your organization from phishing, malware, and social engineering attacks with real-time scanning.
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
              <h2 className="text-3xl font-bold mb-4">Advanced Email Security Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive protection against email-based threats with AI-powered analysis
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
              <h2 className="text-3xl font-bold mb-4">Try SafeEmail Live</h2>
              <p className="text-muted-foreground">
                Test our email analysis with sample phishing emails and see how SafeEmail detects threats
              </p>
            </div>
            <SafeEmailDemo />
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your SafeEmail Plan</h2>
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
                <h3 className="text-2xl font-bold mb-4">Ready to Secure Your Email?</h3>
                <p className="text-muted-foreground mb-6">
                  Join thousands of organizations protecting their email communications with SafeEmail
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

export default SafeEmailPage;