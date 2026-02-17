import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, ArrowRight, Loader2, Plus, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import aiStudioLogo from '@/assets/ai-studio-logo.png';
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { AI_STUDIO_PLANS, CREDIT_TIERS, CREDIT_PACKS } from "@/types/aiStudioCredits";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const AIStudioPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [basicTier, setBasicTier] = useState(0);
  const [proTier, setProTier] = useState(0);
  const [basicAnnual, setBasicAnnual] = useState(false);
  const [proAnnual, setProAnnual] = useState(false);
  const { trackPricingView, trackPlanSelect, trackCheckoutStart } = useConversionTracking();

  const isSubscribed = subscription?.subscribed;

  useEffect(() => {
    trackPricingView('ai_studio');
  }, [trackPricingView]);

  const handleGetStarted = async (planId?: string, tierIndex?: number, annual?: boolean) => {
    // Free plan or no plan specified — go to AI Studio dashboard (auth if needed)
    if (!planId || planId === 'free') {
      if (!user) {
        navigate('/auth?redirect=' + encodeURIComponent('/ai-studio'));
      } else {
        navigate('/ai-studio');
      }
      return;
    }

    if (planId === 'enterprise') {
      navigate('/contact');
      return;
    }

    // Paid plans — require auth first
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent('/pricing/ai-studio'));
      return;
    }

    const tiers = CREDIT_TIERS[planId as keyof typeof CREDIT_TIERS];
    const tier = tiers[tierIndex ?? 0];
    const amount = annual ? tier.annualPrice : tier.monthlyPrice;
    trackPlanSelect(planId, 'ai_studio');
    trackCheckoutStart(planId, amount, 'ai_studio');
    setCheckoutLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('ai-studio-checkout', {
        body: {
          plan_id: planId,
          credits: tier.credits,
          billing_interval: annual ? 'annual' : 'monthly',
        }
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

  const formatPrice = (cents: number, annual: boolean) => {
    if (cents === 0) return { display: '$0', period: 'per month' };
    if (annual) {
      const monthly = Math.round(cents / 12 / 100);
      return { display: `$${monthly}`, period: 'per month' };
    }
    return { display: `$${(cents / 100).toLocaleString()}`, period: 'per month' };
  };

  const getAnnualSavings = (monthlyPrice: number, annualPrice: number) => {
    const monthlyCost = monthlyPrice * 12;
    return Math.round((1 - annualPrice / monthlyCost) * 100);
  };

  const basicSelected = CREDIT_TIERS.basic[basicTier];
  const proSelected = CREDIT_TIERS.pro[proTier];

  const basicPrice = formatPrice(
    basicAnnual ? basicSelected.annualPrice : basicSelected.monthlyPrice,
    basicAnnual
  );
  const proPrice = formatPrice(
    proAnnual ? proSelected.annualPrice : proSelected.monthlyPrice,
    proAnnual
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />

      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl shadow-lg shadow-primary/20 mb-6">
            <img src={aiStudioLogo} alt="AI Studio" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start for free. Upgrade to get the capacity that exactly matches your team's needs.
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Free */}
            <Card className="border-border/50 hover:border-primary/30 transition-all flex flex-col">
              <CardContent className="p-7 flex-1">
                <h3 className="text-xl font-bold mb-1">{AI_STUDIO_PLANS.free.name}</h3>
                <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{AI_STUDIO_PLANS.free.description}</p>

                <div className="mb-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground text-sm ml-1">per month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">No credit card needed</p>

                <div className="border-t border-border/50 pt-4 mb-4">
                  <p className="text-xs text-muted-foreground">Free forever</p>
                </div>
              </CardContent>
              <CardFooter className="p-7 pt-0 flex flex-col gap-4">
                <Button variant="outline" className="w-full" onClick={() => handleGetStarted()}>
                  Get Started
                </Button>
                <div className="space-y-2.5 w-full">
                  <p className="text-xs font-medium text-muted-foreground">Free for everyone</p>
                  {AI_STUDIO_PLANS.free.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>

            {/* Basic */}
            <Card className="border-primary/50 shadow-lg shadow-primary/10 relative flex flex-col">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                Most Popular
              </Badge>
              <CardContent className="p-7 flex-1">
                <h3 className="text-xl font-bold mb-1">{AI_STUDIO_PLANS.basic.name}</h3>
                <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{AI_STUDIO_PLANS.basic.description}</p>

                <div className="mb-1">
                  <span className="text-4xl font-bold text-primary">{basicPrice.display}</span>
                  <span className="text-muted-foreground text-sm ml-1">{basicPrice.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">shared across unlimited users</p>

                <div className="border-t border-border/50 pt-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={basicAnnual}
                      onCheckedChange={setBasicAnnual}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">Annual</span>
                  </div>
                  {basicAnnual && (
                    <span className="text-xs text-emerald-500 font-medium">
                      Save {getAnnualSavings(basicSelected.monthlyPrice, basicSelected.annualPrice)}%
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-7 pt-0 flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() => handleGetStarted('basic', basicTier, basicAnnual)}
                  disabled={checkoutLoading === 'basic'}
                >
                  {checkoutLoading === 'basic' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Started'}
                </Button>

                <Select value={String(basicTier)} onValueChange={(v) => setBasicTier(Number(v))}>
                  <SelectTrigger className="w-full bg-muted/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {CREDIT_TIERS.basic.map((tier, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {tier.credits} credits / month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2.5 w-full mt-2">
                  {AI_STUDIO_PLANS.basic.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {i === 0 ? (
                        <span className="text-xs font-medium text-muted-foreground">{f}</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>

            {/* Pro */}
            <Card className="border-border/50 hover:border-primary/30 transition-all flex flex-col">
              <CardContent className="p-7 flex-1">
                <h3 className="text-xl font-bold mb-1">{AI_STUDIO_PLANS.pro.name}</h3>
                <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{AI_STUDIO_PLANS.pro.description}</p>

                <div className="mb-1">
                  <span className="text-4xl font-bold">{proPrice.display}</span>
                  <span className="text-muted-foreground text-sm ml-1">{proPrice.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">shared across unlimited users</p>

                <div className="border-t border-border/50 pt-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={proAnnual}
                      onCheckedChange={setProAnnual}
                      className="scale-75"
                    />
                    <span className="text-xs text-muted-foreground">Annual</span>
                  </div>
                  {proAnnual && (
                    <span className="text-xs text-emerald-500 font-medium">
                      Save {getAnnualSavings(proSelected.monthlyPrice, proSelected.annualPrice)}%
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-7 pt-0 flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGetStarted('pro', proTier, proAnnual)}
                  disabled={checkoutLoading === 'pro'}
                >
                  {checkoutLoading === 'pro' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Get Started'}
                </Button>

                <Select value={String(proTier)} onValueChange={(v) => setProTier(Number(v))}>
                  <SelectTrigger className="w-full bg-muted/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {CREDIT_TIERS.pro.map((tier, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {tier.credits.toLocaleString()} credits / month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2.5 w-full mt-2">
                  {AI_STUDIO_PLANS.pro.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {i === 0 ? (
                        <span className="text-xs font-medium text-muted-foreground">{f}</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>

            {/* Enterprise */}
            <Card className="border-border/50 hover:border-primary/30 transition-all flex flex-col">
              <CardContent className="p-7 flex-1">
                <h3 className="text-xl font-bold mb-1">{AI_STUDIO_PLANS.enterprise.name}</h3>
                <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">{AI_STUDIO_PLANS.enterprise.description}</p>

                <div className="mb-1">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <p className="text-xs text-muted-foreground mb-6">&nbsp;</p>

                <div className="border-t border-border/50 pt-4 mb-4">
                  <p className="text-xs text-muted-foreground">Flexible plans</p>
                </div>
              </CardContent>
              <CardFooter className="p-7 pt-0 flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleGetStarted('enterprise')}
                >
                  Book a demo
                </Button>

                <div className="space-y-2.5 w-full mt-2">
                  {AI_STUDIO_PLANS.enterprise.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {i === 0 ? (
                        <span className="text-xs font-medium text-muted-foreground">{f}</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{f}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>
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

      <Footer />
    </div>
  );
};

export default AIStudioPricing;
