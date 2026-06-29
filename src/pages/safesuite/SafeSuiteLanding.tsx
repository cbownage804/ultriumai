/**
 * Wrayth Landing Page
 * Marketing page for the unified security suite
 */

import { Link } from 'react-router-dom';
import Navigation from '@/components/safesuite/SafeSuiteNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SAFESUITE_TIERS, FEATURE_DESCRIPTIONS, formatMonthlyPrice } from '@/config/safeSuiteTiers';
import { safeSuiteProducts, safesuiteLogo, type WraythProductKey } from '@/components/safesuite/SafeSuiteProductIcons';
import heroWrayth from '@/assets/hero-wrayth.jpg';
import {
  Shield,
  Check,
  Sparkles,
  Crown,
  ArrowRight,
  Lock,
  Star
} from 'lucide-react';

const features: WraythProductKey[] = ['safepass', 'safescan', 'safeweb'];

export default function WraythLanding() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroWrayth} 
            alt="Wrayth Security Platform"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 gap-1 animate-fade-in bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <Sparkles className="h-3 w-3" />
              Complete Security Suite
            </Badge>
            <div className="flex justify-center mb-8">
              <div className="px-12 py-6 bg-black rounded-2xl shadow-2xl shadow-emerald-500/20 animate-fade-in">
                <img 
                  src={safesuiteLogo} 
                  alt="Wrayth" 
                  className="h-28 w-auto object-contain"
                />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              All Your Security Tools in One Place
            </p>
            <p className="text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Vault, Scan, and Watch — three precise security tools unified by Ray,
              the calm AI intelligence at the core of Wrayth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?tab=signup">
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
            {features.map((productKey, index) => {
              const product = safeSuiteProducts[productKey];
              const colorMap = {
                safepass: 'amber',
                safescan: 'red',
                safeweb: 'violet',
                safetrack: 'orange'
              };
              const color = colorMap[productKey] || 'primary';
              return (
              <Card key={productKey} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex flex-col gap-3">
                      <div className="h-14 w-40 rounded-xl bg-black flex items-center justify-center overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                        <img 
                          src={product.logo} 
                          alt={product.name} 
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <CardDescription className="text-sm">{product.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                            <Check className="h-3 w-3 text-success" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to={`/products/${productKey}`} className="block mt-4">
                      <Button variant="outline" size="sm" className="w-full group-hover:bg-primary/10">
                        Explore Features
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
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
                className={`relative transition-all duration-300 hover:-translate-y-2 ${tier.popular ? 'border-primary shadow-lg shadow-primary/20 scale-105 z-10' : 'hover:shadow-lg hover:shadow-primary/10'}`}
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
                  <Link to="/auth?tab=signup">
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
            Join thousands of users who trust Wrayth to protect their passwords, 
            scan for threats, and monitor the dark web.
          </p>
          <Link to="/auth?tab=signup">
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
              <span className="font-semibold">Wrayth</span>
              <span className="text-muted-foreground">by UltriumAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} UltriumAI. All rights reserved.
            </p>
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
