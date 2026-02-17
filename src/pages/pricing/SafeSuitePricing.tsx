import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Lock, Eye, Users, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import safesuiteLogo from '@/assets/safesuite-logo.png';
import { useAuth } from "@/hooks/useAuth";
import { useStripeCheckout, SAFESUITE_PRICES } from "@/hooks/useStripeCheckout";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useState, useEffect } from "react";
import { Testimonials } from "@/components/marketing/Testimonials";
import { SocialProof, UserCountBadge } from "@/components/marketing/SocialProof";
import { CompetitorComparison } from "@/components/marketing/CompetitorComparison";
import { RequestDemoForm } from "@/components/marketing/RequestDemoForm";
import { useConversionTracking } from "@/hooks/useConversionTracking";

const SafeSuitePricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading, startCheckout } = useStripeCheckout();
  const { productAccess, tier: currentTier } = useUserSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { trackPricingView, trackPlanSelect, trackCheckoutStart } = useConversionTracking();

  // Track pricing page view
  useEffect(() => {
    trackPricingView('safesuite');
  }, [trackPricingView]);

  const handleGetStarted = () => {
    if (user) {
      navigate('/safesuite');
    } else {
      navigate('/auth');
    }
  };

  const handleCheckout = async (tier: 'pro' | 'business' | 'enterprise') => {
    if (tier === 'enterprise') {
      navigate('/contact');
      return;
    }
    
    trackPlanSelect(tier, 'safesuite');
    setLoadingTier(tier);
    
    // Track checkout start with amount
    const amount = tier === 'pro' ? 999 : 1500;
    trackCheckoutStart(tier, amount, 'safesuite');
    
    await startCheckout({
      product: 'safesuite',
      tier,
      billing: 'monthly',
    });
    setLoadingTier(null);
  };

  const isCurrentPlan = (tier: string) => {
    return productAccess.safesuite?.tier === tier || currentTier === tier;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl shadow-lg shadow-emerald-500/20 mb-6">
            <img src={safesuiteLogo} alt="SafeSuite" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            SafeSuite Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">
            Personal & SMB security toolkit with password vault, threat scanning, and dark web monitoring.
          </p>
          <UserCountBadge />
        </div>
      </section>

      {/* Social Proof */}
      <SocialProof variant="compact" className="pb-8" />

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free */}
            <Card className="border-border/50 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <p className="text-muted-foreground text-sm mb-6">Get started with essential security</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "25 password entries",
                    "5 threat scans/month",
                    "Basic dark web alerts",
                    "Browser extension",
                    "Mobile app access",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                  Get Started Free
                </Button>
              </CardFooter>
            </Card>

            {/* Pro - Popular */}
            <Card className="border-2 border-emerald-500/50 relative shadow-xl shadow-emerald-500/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white">
                Most Popular
              </Badge>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-muted-foreground text-sm mb-6">For individuals & small teams</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold text-emerald-500">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Unlimited passwords",
                    "100 threat scans/month",
                    "5 monitored assets",
                    "Priority dark web alerts",
                    "Secure file storage (1GB)",
                    "2FA authentication",
                    "Up to 5 team members",
                    "Shared password vaults",
                    "Team activity feed",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  className="w-full bg-emerald-500 hover:bg-emerald-600" 
                  onClick={() => handleCheckout('pro')}
                  disabled={loading || loadingTier === 'pro' || isCurrentPlan('pro')}
                >
                  {loadingTier === 'pro' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : isCurrentPlan('pro') ? (
                    'Current Plan'
                  ) : (
                    'Start Pro Trial'
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Business */}
            <Card className="border-border/50 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Business</h3>
                <p className="text-muted-foreground text-sm mb-6">For teams and organizations</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold">$15</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Everything in Pro",
                    "Unlimited team members",
                    "Advanced admin controls",
                    "Audit logs & compliance",
                    "SSO integration",
                    "Role-based access control",
                    "Priority support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleCheckout('business')}
                  disabled={loading || loadingTier === 'business' || isCurrentPlan('business')}
                >
                  {loadingTier === 'business' ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                  ) : isCurrentPlan('business') ? (
                    'Current Plan'
                  ) : (
                    'Start Business Trial'
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/50 hover:border-emerald-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <p className="text-muted-foreground text-sm mb-6">For large organizations</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-bold">$45</span>
                  <span className="text-muted-foreground">/user/month</span>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    "Everything in Business",
                    "1,500 password entries",
                    "1,500 threat scans/month",
                    "150 monitored assets",
                    "Up to 60 team members",
                    "Dedicated support",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <RequestDemoForm 
                  defaultProduct="safesuite" 
                  triggerLabel="Contact Sales"
                />
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">All plans include</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: "End-to-end encryption", desc: "Your data is always protected" },
              { icon: Shield, title: "Zero-knowledge architecture", desc: "We can't see your passwords" },
              { icon: Eye, title: "Dark web monitoring", desc: "Get alerted to breaches" },
              { icon: Users, title: "Cross-device sync", desc: "Access anywhere, anytime" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <CompetitorComparison product="safesuite" />

      {/* Testimonials */}
      <Testimonials 
        product="safesuite" 
        maxItems={3}
        title="Loved by Security-Conscious Teams"
        subtitle="See why businesses choose SafeSuite over alternatives"
      />

      <Footer />
    </div>
  );
};

export default SafeSuitePricing;
