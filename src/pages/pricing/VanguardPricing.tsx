import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Cpu, Users, Zap, ArrowRight, Loader2, Star, Layers, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import vanguardLogo from '@/assets/vanguard-logo.png';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConversionTracking } from "@/hooks/useConversionTracking";
import { RequestDemoForm } from "@/components/marketing/RequestDemoForm";
import { ModuleLogo, type ModuleName } from '@/components/vanguard/ModuleLogo';
import {
  IT_DEPARTMENT_PLANS,
  MSP_PLANS,
  ALL_PLANS_INCLUDE,
  ADDONS,
  getAnnualSavings,
  getAnnualSavingsPercent,
  type VanguardPlan,
} from '@/config/vanguardPricing';
import { ADDON_BUNDLES, MODULE_ADDONS, getBundleSavings } from '@/config/vanguardAddons';
import { cn } from "@/lib/utils";

type Segment = 'msp' | 'it';

const VanguardPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [segment, setSegment] = useState<Segment>('msp');
  const [annual, setAnnual] = useState(true);
  const [showAddons, setShowAddons] = useState(false);
  const { trackPricingView, trackPlanSelect, trackCheckoutStart } = useConversionTracking();

  useEffect(() => {
    trackPricingView('vanguard');
  }, [trackPricingView]);

  const plans = segment === 'msp' ? MSP_PLANS : IT_DEPARTMENT_PLANS;
  const includedFeatures = segment === 'msp' ? ALL_PLANS_INCLUDE.msp : ALL_PLANS_INCLUDE.it;

  const handleCheckout = async (plan: VanguardPlan) => {
    if (plan.enterprise) return;
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent('/pricing/vanguard'));
      return;
    }

    trackPlanSelect(plan.id, 'vanguard');
    setCheckoutLoading(plan.id);

    try {
      const price = annual ? plan.monthlyPrice : plan.monthlyPriceBilledMonthly;
      trackCheckoutStart(plan.id, price * 100, 'vanguard');

      const { data, error } = await supabase.functions.invoke('vanguard-checkout', {
        body: {
          tier: plan.id,
          seats: 1,
          billingInterval: annual ? 'year' : 'month',
          includeOnboarding: true,
        },
      });

      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050a0a] text-white">
      <Navigation />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/5" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[160px]" />

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl shadow-lg shadow-cyan-500/20 mb-6 border border-cyan-500/20">
            <img src={vanguardLogo} alt="Vanguard" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
            Simple per-technician pricing
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-2">
            Unlimited endpoints. No per-device fees. One platform for RMM, PSA, security & compliance.
          </p>
          <p className="text-sm text-cyan-400 font-medium">
            14-day free trial on all plans · No credit card required
          </p>
        </div>
      </section>

      {/* ── Segment Toggle + Billing Toggle ────────────── */}
      <section className="pb-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Segment */}
          <div className="inline-flex bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
            <button
              onClick={() => setSegment('msp')}
              className={cn(
                'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                segment === 'msp'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'text-white/60 hover:text-white'
              )}
            >
              MSPs & IT Firms
            </button>
            <button
              onClick={() => setSegment('it')}
              className={cn(
                'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
                segment === 'it'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                  : 'text-white/60 hover:text-white'
              )}
            >
              IT Departments
            </button>
          </div>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
            <span className={cn('text-sm', !annual ? 'text-white font-medium' : 'text-white/50')}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                annual ? 'bg-cyan-500' : 'bg-white/20'
              )}
            >
              <span className={cn(
                'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                annual ? 'translate-x-6' : 'translate-x-0.5'
              )} />
            </button>
            <span className={cn('text-sm', annual ? 'text-white font-medium' : 'text-white/50')}>Annual</span>
            {annual && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Save ~20%</Badge>
            )}
          </div>
        </div>
      </section>

      {/* ── All Plans Include ────────────────────────────── */}
      <section className="pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <span className="font-semibold text-white/70">All plans include:</span>
            {includedFeatures.map((f, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-cyan-400" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plan Cards ───────────────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const price = annual ? plan.monthlyPrice : plan.monthlyPriceBilledMonthly;
              const savings = getAnnualSavingsPercent(plan);
              const isLoading = checkoutLoading === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    'relative bg-white/[0.03] backdrop-blur-sm border transition-all duration-300 hover:translate-y-[-2px]',
                    plan.popular
                      ? 'border-cyan-500/50 shadow-xl shadow-cyan-500/10'
                      : 'border-white/10 hover:border-white/20'
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-bold border-0 shadow-lg shadow-cyan-500/30">
                      <Star className="h-3 w-3 mr-1" /> Most Popular
                    </Badge>
                  )}

                  <CardContent className="p-6 pt-8">
                    <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                    <p className="text-white/50 text-sm mb-6 min-h-[40px]">{plan.description}</p>

                    {plan.enterprise ? (
                      <div className="mb-6">
                        <span className="text-3xl font-bold text-white">Custom</span>
                        <p className="text-xs text-white/40 mt-1">Contact us for volume pricing</p>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-bold text-white">${price}</span>
                          <span className="text-white/40 mb-1">/tech/mo</span>
                        </div>
                        {annual && savings > 0 && (
                          <p className="text-xs text-emerald-400 mt-1">
                            Save {savings}% vs monthly · ${getAnnualSavings(plan)}/yr per tech
                          </p>
                        )}
                        {!annual && (
                          <p className="text-xs text-white/30 mt-1">
                            or ${plan.monthlyPrice}/mo billed annually
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {plan.features.slice(0, 7).map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-white/70">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 7 && (
                        <p className="text-xs text-white/40 pl-6">+{plan.features.length - 7} more features</p>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    {plan.enterprise ? (
                      <RequestDemoForm
                        defaultProduct="vanguard"
                        triggerLabel="Contact Sales"
                      />
                    ) : (
                      <Button
                        className={cn(
                          'w-full font-semibold transition-all',
                          plan.popular
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                        )}
                        onClick={() => handleCheckout(plan)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                        ) : (
                          'Start Free Trial'
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Add-On Modules ───────────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setShowAddons(!showAddons)}
            className="w-full flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-cyan-400" />
              <div className="text-left">
                <h2 className="text-lg font-bold text-white">Power-Up Add-Ons</h2>
                <p className="text-sm text-white/50">{MODULE_ADDONS.length} modules · 2 strategic bundles · Starting at $3/user/mo</p>
              </div>
            </div>
            {showAddons ? <ChevronUp className="h-5 w-5 text-white/40" /> : <ChevronDown className="h-5 w-5 text-white/40" />}
          </button>

          {showAddons && (
            <div className="mt-6 space-y-8 animate-fade-in">
              {/* Bundles */}
              <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Strategic Bundles</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {ADDON_BUNDLES.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="bg-gradient-to-br from-cyan-500/10 to-purple-500/5 border border-cyan-500/20 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-white">{bundle.name}</h4>
                          <p className="text-sm text-white/50">{bundle.description}</p>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-0 shrink-0">
                          Save {bundle.discountPercent}%
                        </Badge>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-white">${bundle.monthlyPricePerUser}</span>
                        <span className="text-white/40 text-sm mb-0.5">/user/mo</span>
                        <span className="text-white/30 text-sm line-through ml-2 mb-0.5">${bundle.alaCartePricePerUser}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual add-ons */}
              <div>
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Individual Modules</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MODULE_ADDONS.map((addon) => (
                    <div
                      key={addon.id}
                      className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ModuleLogo module={addon.module} size="xs" />
                        <h4 className="font-semibold text-white text-sm">{addon.name}</h4>
                      </div>
                      <p className="text-xs text-white/40 mb-3 line-clamp-2">{addon.description}</p>
                      <div className="flex items-end gap-1">
                        <span className="text-lg font-bold text-white">${addon.monthlyPricePerUser}</span>
                        <span className="text-white/40 text-xs mb-0.5">/user/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Comparison Highlights ─────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-white mb-4">Why MSPs switch to Vanguard</h2>
          <p className="text-center text-white/50 mb-12 max-w-xl mx-auto">
            Replace multiple tools with one unified platform. Save 40-60% compared to legacy RMM + PSA stacks.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'All-In-One Platform',
                desc: 'RMM, PSA, XDR, compliance, and documentation in a single pane of glass. No more juggling 5+ vendors.',
                color: 'cyan',
              },
              {
                icon: Users,
                title: 'Per-Technician, Not Per-Device',
                desc: 'Unlimited endpoints on every plan. Grow your client base without watching per-device costs spiral.',
                color: 'purple',
              },
              {
                icon: Zap,
                title: 'AI-Native Operations',
                desc: 'Cortex AI auto-triages tickets, generates runbooks, and detects patterns — saving technicians 5+ hrs/week.',
                color: 'emerald',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                  item.color === 'cyan' && 'bg-cyan-500/10',
                  item.color === 'purple' && 'bg-purple-500/10',
                  item.color === 'emerald' && 'bg-emerald-500/10',
                )}>
                  <item.icon className={cn(
                    'h-6 w-6',
                    item.color === 'cyan' && 'text-cyan-400',
                    item.color === 'purple' && 'text-purple-400',
                    item.color === 'emerald' && 'text-emerald-400',
                  )} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What does "per technician" mean?',
                a: 'You only pay per technician (admin/user) who accesses the platform. There are no per-device or per-endpoint fees. Add as many client devices as you need.'
              },
              {
                q: 'Can I start with one plan and add modules later?',
                a: 'Absolutely. Start with any base plan and add individual modules (like Pursuit XDR or Comply) whenever you need them. All add-ons are prorated to your billing cycle.'
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes — every plan includes a 14-day free trial with full access. No credit card required to get started.'
              },
              {
                q: 'What\'s included in the annual discount?',
                a: 'Annual billing gives you ~20% off the monthly rate. You pay for 12 months upfront per technician and can add more seats at any time.'
              },
              {
                q: 'Do you offer MSP partner/reseller pricing?',
                a: 'Yes. Our partner program offers Silver (15% off), Gold (25% off), and Platinum (35% off) tiers with optional white-labeling. Contact sales to apply.'
              },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-medium hover:text-cyan-400 transition-colors">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-white/40 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-4 text-sm text-white/50 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────── */}
      <section className="pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-cyan-500/10 via-white/[0.03] to-purple-500/10 border border-cyan-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to consolidate your stack?</h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">
            Join hundreds of MSPs who replaced 5+ tools with Vanguard. Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/20 px-8"
              onClick={() => navigate(user ? '/vanguard' : '/auth?redirect=/pricing/vanguard')}
            >
              Start Free Trial <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <RequestDemoForm
              defaultProduct="vanguard"
              triggerLabel="Schedule a Demo"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VanguardPricing;
