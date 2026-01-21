/**
 * SafeSuite Landing Page
 * Marketing page for the unified security suite
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, formatMonthlyPrice } from '@/config/safeSuiteTiers';
import { safeSuiteProducts, safesuiteLogo, type SafeSuiteProductKey } from '@/components/safesuite/SafeSuiteProductIcons';
import heroSafesuite from '@/assets/hero-safesuite.jpg';
import {
  Shield,
  Check,
  Sparkles,
  Crown,
  ArrowRight,
  Lock,
  Star
} from 'lucide-react';

const features: SafeSuiteProductKey[] = ['safepass', 'safescan', 'safeweb', 'safetrack'];

export default function SafeSuiteLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/safesuite" className="flex items-center gap-2">
            <img 
              src={safesuiteLogo} 
              alt="SafeSuite" 
              className="h-10 w-10 rounded-lg object-contain"
            />
            <span className="font-bold text-xl">SafeSuite</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/safesuite/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/safesuite/auth?tab=signup">
              <Button className="gap-2">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroSafesuite} 
            alt="SafeSuite Security Platform"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4 gap-1">
              <Sparkles className="h-3 w-3" />
              Complete Security Suite
            </Badge>
            <div className="flex justify-center mb-6">
              <img 
                src={safesuiteLogo} 
                alt="SafeSuite" 
                className="h-24 w-24 object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              All Your Security Tools in One Place
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Password management, threat scanning, dark web monitoring, and asset tracking — 
              unified in one powerful, easy-to-use suite.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/safesuite/auth?tab=signup">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="#pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Stay Secure
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Four powerful security tools working together to protect your digital life
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((productKey) => {
              const product = safeSuiteProducts[productKey];
              return (
                <Card key={productKey} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <img 
                        src={product.logo} 
                        alt={product.name} 
                        className="h-12 w-12 object-contain rounded-lg"
                      />
                      <div>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-success" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your needs. Upgrade anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Object.values(SAFESUITE_TIERS).map((tier) => (
              <Card
                key={tier.id}
                className={`relative ${tier.popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gap-1 bg-primary">
                      <Star className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {tier.id === 'business' && <Crown className="h-5 w-5 text-amber-500" />}
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">
                      {tier.price === 0 ? 'Free' : `$${(tier.price / 100).toFixed(0)}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-muted-foreground">{tier.priceLabel || '/month'}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {Object.entries(tier.features).map(([key, value]) => {
                      const featureInfo = FEATURE_DESCRIPTIONS[key as keyof typeof FEATURE_DESCRIPTIONS];
                      return (
                        <li key={key} className="flex items-center gap-2">
                          {value.enabled ? (
                            <Check className="h-4 w-4 text-success flex-shrink-0" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={!value.enabled ? 'text-muted-foreground' : ''}>
                            {featureInfo.name}
                            {value.enabled && value.limit > 0 && (
                              <span className="text-muted-foreground text-sm ml-1">
                                ({value.limit === -1 ? '∞' : value.limit})
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Link to="/safesuite/auth?tab=signup">
                    <Button 
                      variant={tier.popular ? 'default' : 'outline'} 
                      className="w-full"
                    >
                      {tier.price === 0 ? 'Get Started Free' : `Start ${tier.name}`}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Secure Your Digital Life?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust SafeSuite to protect their passwords, 
            scan for threats, and monitor the dark web.
          </p>
          <Link to="/safesuite/auth?tab=signup">
            <Button size="lg" className="gap-2">
              Start Your Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">SafeSuite</span>
              <span className="text-muted-foreground">by UltriumAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/security" className="hover:text-foreground transition-colors">Security</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
