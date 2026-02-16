import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, ArrowRight, Loader2, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import aiStudioLogo from '@/assets/ai-studio-logo.png';
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { AI_STUDIO_PLANS, CREDIT_PACKS } from "@/types/aiStudioCredits";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConversionTracking } from "@/hooks/useConversionTracking";

type BillingInterval = 'monthly' | 'annual';

const AIStudioPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingInterval>('monthly');
  const { trackPricingView, trackPlanSelect, trackCheckoutStart } = useConversionTracking();

  const isSubscribed = subscription?.subscribed;

  useEffect(() => {
    trackPricingView('ai_studio');
  }, [trackPricingView]);

  const handleGetStarted = async (planId?: string) => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent('/pricing/ai-studio'));
      return;
    }

    if (planId) {
      const plan = AI_STUDIO_PLANS[planId as keyof typeof AI_STUDIO_PLANS];
      const amount = billing === 'annual' ? plan?.annualPrice : plan?.monthlyPrice;
      trackPlanSelect(planId, 'ai_studio');
      trackCheckoutStart(planId, amount || 0, 'ai_studio');
      setCheckoutLoading(planId);
      
      try {
        const { data, error } = await supabase.functions.invoke('ai-studio-checkout', {
          body: { plan_id: planId, billing_interval: billing }
        });
        
        if (error) throw error;
        
        if (data?.upgraded) {
          toast.success(data.message || 'Plan upgraded successfully!');
          if (data.redirectUrl) window.location.href = data.redirectUrl;
          return;
        }
        
        if (data?.url) window.open(data.url, '_blank');
      } catch (err) {
        console.error('Checkout error:', err);
        toast.error('Failed to start checkout');
      } finally {
        setCheckoutLoading(null);
      }
      return;
    }

    navigate('/ai-studio');
  };

  const handleBuyCredits = async (packId: string) => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent('/pricing/ai-studio'));
      return;
    }
    setCheckoutLoading(`pack_${packId}`);
    try {
      const { data, error } = await supabase.functions.invoke('ai-studio-checkout', {
        body: { credit_pack: packId }
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Credit pack checkout error:', err);
      toast.error('Failed to start checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const getButtonText = (planId: string) => {
    if (checkoutLoading === planId) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!user) return 'Start Free';
    if (isSubscribed) return 'Upgrade';
    return 'Subscribe';
  };

  const getPrice = (plan: typeof AI_STUDIO_PLANS[keyof typeof AI_STUDIO_PLANS]) => {
    const price = billing === 'annual' ? plan.annualPrice : plan.monthlyPrice;
    if (price === 0) return { display: '$0', period: '/month' };
    if (billing === 'annual') {
      const monthly = Math.round(price / 12 / 100);
      return { display: `$${monthly}`, period: '/mo, billed annually' };
    }
    return { display: `$${(price / 100).toLocaleString()}`, period: '/month' };
  };

  const getAnnualSavings = (plan: typeof AI_STUDIO_PLANS[keyof typeof AI_STUDIO_PLANS]) => {
    if (plan.monthlyPrice === 0) return null;
    const monthlyCost = plan.monthlyPrice * 12;
    const annualCost = plan.annualPrice;
    const savings = Math.round((1 - annualCost / monthlyCost) * 100);
    return savings > 0 ? savings : null;
  };

  const plans = Object.entries(AI_STUDIO_PLANS) as [string, typeof AI_STUDIO_PLANS[keyof typeof AI_STUDIO_PLANS]][];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />
      
      {/* Hero */}
      <section className="pt-32 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl shadow-lg shadow-primary/20 mb-6">
            <img src={aiStudioLogo} alt="AI Studio" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            Simple, Predictable Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            One plan, one credit pool. Build apps, create GPTs, generate images—all from the same balance.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-muted/50 rounded-full p-1.5 border border-border/50">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billing === 'annual'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5">
                Save 33%
              </Badge>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map(([id, plan]) => {
              const price = getPrice(plan);
              const isPopular = 'popular' in plan && plan.popular;
              const savings = billing === 'annual' ? getAnnualSavings(plan) : null;

              return (
                <Card
                  key={id}
                  className={`relative transition-all ${
                    isPopular
                      ? 'border-2 border-primary/50 shadow-lg shadow-primary/10'
                      : 'border-border/50 hover:border-primary/30'
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                      Most Popular
                    </Badge>
                  )}
                  <CardContent className="p-7">
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-5">{plan.description}</p>
                    
                    <div className="mb-1">
                      <span className={`text-4xl font-bold ${isPopular ? 'text-primary' : ''}`}>
                        {price.display}
                      </span>
                      <span className="text-muted-foreground text-sm">{price.period}</span>
                    </div>
                    {savings && (
                      <p className="text-xs text-emerald-500 font-medium mb-1">Save {savings}% vs monthly</p>
                    )}
                    <p className="text-sm text-primary font-medium mb-6">
                      {plan.credits.toLocaleString()} AI credits{plan.credits > 0 ? '/mo' : ''}
                    </p>

                    <div className="space-y-2.5 mb-6">
                      {plan.features.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-7 pt-0">
                    {id === 'free' ? (
                      <Button variant="outline" className="w-full" onClick={() => handleGetStarted()}>
                        Get Started Free
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${isPopular ? '' : ''}`}
                        variant={isPopular ? 'default' : 'outline'}
                        onClick={() => handleGetStarted(id)}
                        disabled={checkoutLoading === id}
                      >
                        {getButtonText(id)}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Credit Top-Ups */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
              <Plus className="h-3 w-3 mr-1" />
              Credit Top-Ups
            </Badge>
            <h2 className="text-2xl font-bold mb-2">Need more credits?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Buy additional credits anytime. They never expire and stack on top of your monthly allowance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(CREDIT_PACKS).map(([id, pack]) => (
              <Card key={id} className="border-border/50 hover:border-primary/30 transition-all">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{pack.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-1">${(pack.price / 100).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mb-4">One-time purchase</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleBuyCredits(id)}
                    disabled={checkoutLoading === `pack_${id}`}
                  >
                    {checkoutLoading === `pack_${id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buy Credits'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/5 border-primary/20">
            <CardContent className="p-12">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
              <p className="text-muted-foreground mb-6">
                Volume discounts, dedicated infrastructure, SSO, and SLA guarantees for large organizations.
              </p>
              <Button size="lg" asChild>
                <Link to="/contact">
                  Contact Sales
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIStudioPricing;
