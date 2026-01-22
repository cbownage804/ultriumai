import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { DarkWebDemo } from "@/components/demos/DarkWebDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VanguardUpsell } from "@/components/products/VanguardUpsell";
import { Search, Check, Star, Zap, Users, ArrowRight, Play, AlertTriangle, Eye, Globe, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import heroWeb from "@/assets/hero-web.jpg";
import screenshotSafeweb from "@/assets/screenshot-safeweb.jpg";
import { safeSuiteProducts } from "@/components/safesuite/SafeSuiteProductIcons";

const SafeWebPage = () => {
  const features = [
    "Credential monitoring",
    "Data breach detection",
    "Threat actor tracking",
    "Brand monitoring",
    "Executive protection",
    "Automated alerts",
    "Dark web intelligence",
    "Incident response support"
  ];

  const pricingTiers = [
    {
      name: 'SafeWeb Starter',
      price: '$3',
      duration: '/user/mo',
      icon: Star,
      features: [
        'Basic credential monitoring',
        'Weekly reports',
        'Email alerts',
        'Standard support'
      ],
      popular: false,
      cta: 'Start Free Trial'
    },
    {
      name: 'SafeWeb Pro',
      price: '$5',
      duration: '/user/mo',
      icon: Zap,
      features: [
        'Everything in Starter',
        'Real-time alerts',
        'Brand protection',
        'API access',
        'Priority support',
        'Custom reports'
      ],
      popular: true,
      cta: 'Start Pro Trial'
    },
    {
      name: 'SafeWeb Enterprise',
      price: 'Custom',
      duration: 'Contact sales',
      icon: Users,
      features: [
        'Everything in Pro',
        'Executive protection',
        'Threat intelligence feeds',
        'White-label customization',
        'SSO & SAML integration',
        'Dedicated account manager'
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
        <section className="relative py-20 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroWeb} 
              alt="Global network security"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/85 to-background" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Badge className="mb-4 bg-violet-500/10 text-violet-500 border-violet-500/20">
                <Eye className="h-3 w-3 mr-1" />
                Dark Web Intelligence
              </Badge>
              <div className="flex justify-center mb-8">
                <div className="px-8 py-4 bg-black rounded-2xl shadow-2xl shadow-violet-500/20 animate-fade-in">
                  <img 
                    src={safeSuiteProducts.safeweb.logo} 
                    alt="SafeWeb" 
                    className="h-24 w-auto object-contain"
                  />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-purple-500 to-violet-600 bg-clip-text text-transparent animate-fade-in">
                SafeWeb
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-8">
                Dark web monitoring and threat intelligence platform. Protect your organization from credential theft, data breaches, and cyber threats with continuous monitoring.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/vanguard/auth">
                  <Button size="lg" className="bg-violet-500 hover:bg-violet-600">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Play className="mr-2 h-5 w-5" />
                  Try Live Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">See SafeWeb in Action</h2>
              <p className="text-muted-foreground">Dark web monitoring and breach detection</p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/10 border border-violet-500/20">
              <img 
                src={screenshotSafeweb} 
                alt="SafeWeb Dashboard" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Advanced Threat Intelligence</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Comprehensive dark web monitoring with real-time threat intelligence and alerts
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1 border-violet-500/10 hover:border-violet-500/30 group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                        <Check className="h-4 w-4 text-violet-500" />
                      </div>
                      <span className="font-medium">{feature}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section id="demo" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try SafeWeb Live</h2>
              <p className="text-muted-foreground">
                Experience our dark web monitoring platform with sample threat intelligence data
              </p>
            </div>
            <DarkWebDemo />
          </div>
        </section>

        {/* Vanguard Upsell */}
        <VanguardUpsell 
          currentProduct="SafeWeb™" 
          currentProductPrice="$3/user/mo"
          competitorComparison="Best value vs. ID Agent when bundled in Vanguard Suite"
        />

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Standalone SafeWeb Pricing</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Or get SafeWeb included in Vanguard Suite for even more value
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => {
                const Icon = tier.icon;
                return (
                  <Card 
                    key={index} 
                    className={`relative ${tier.popular ? 'border-violet-500 border-2 shadow-lg' : ''} hover:shadow-lg transition-all duration-300`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-violet-500">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center">
                        <Icon className="h-6 w-6 text-violet-500" />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <div className="text-3xl font-bold text-primary">
                        {tier.price}
                        <span className="text-sm font-normal text-muted-foreground">{tier.duration}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {tier.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to={tier.cta === 'Contact Sales' ? '/contact' : '/vanguard/auth'}>
                        <Button 
                          className={`w-full ${tier.popular ? 'bg-violet-500 hover:bg-violet-600' : ''}`}
                          variant={tier.popular ? "default" : "outline"}
                        >
                          {tier.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
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
            <Card className="p-8 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20">
              <CardContent className="pt-0">
                <AlertTriangle className="h-12 w-12 text-violet-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Your Data Could Be on the Dark Web</h3>
                <p className="text-muted-foreground mb-6">
                  80% of breaches involve compromised credentials. Monitor and protect your organization today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/vanguard/auth">
                    <Button size="lg" className="bg-violet-500 hover:bg-violet-600">
                      Start Free Scan
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg">
                      Talk to Expert
                    </Button>
                  </Link>
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

export default SafeWebPage;