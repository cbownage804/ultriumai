import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, Lock, Search, Bot, Network, Wrench, MessageSquare, 
  Check, ArrowRight, Zap, Building2, Users, Crown, Package,
  Globe, Database, Key, Loader2, Layers, Target, Eye, Brain, 
  ClipboardCheck, BookOpen, BarChart3, Siren
} from "lucide-react";
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { IT_DEPARTMENT_PLANS, MSP_PLANS, ADDONS, getAnnualSavings, getAnnualSavingsPercent, type VanguardPlan } from '@/config/vanguardPricing';
import { MODULE_ADDONS, ADDON_BUNDLES, getBundleSavings } from '@/config/vanguardAddons';
import { ModuleLogo, type ModuleName } from '@/components/vanguard/ModuleLogo';

const VanguardSuite = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [audience, setAudience] = useState<'msp' | 'it'>('msp');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlanId, setSelectedPlanId] = useState('msp-growth');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [techCount, setTechCount] = useState(3);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const plans = audience === 'msp' ? MSP_PLANS : IT_DEPARTMENT_PLANS;
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];
  const pricePerTech = billingCycle === 'annual' ? selectedPlan.monthlyPrice : selectedPlan.monthlyPriceBilledMonthly;

  const addonMonthly = selectedAddons.reduce((sum, addonId) => {
    const addon = ADDONS.find(a => a.id === addonId);
    if (!addon) return sum;
    return sum + (addon.perUser ? addon.monthlyPrice * techCount : addon.monthlyPrice);
  }, 0);

  const totalMonthly = (pricePerTech * techCount) + addonMonthly;

  const toggleAddon = (addonId: string) => {
    setSelectedAddons(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to subscribe", variant: "destructive" });
      return;
    }
    if (selectedPlan.enterprise) {
      toast({ title: "Contact Sales", description: "Enterprise plans require a custom quote." });
      return;
    }
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-checkout', {
        body: { planId: selectedPlan.id, seats: techCount, addons: selectedAddons },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (error: any) {
      toast({ title: "Checkout failed", description: error.message || "Unable to start checkout", variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-purple-600 border-0">
            <Package className="h-3 w-3 mr-1" />
            Vanguard Suite
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-clip-text text-transparent">
            Per-Technician Pricing, Unlimited Endpoints
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8">
            One price per technician. Monitor and manage unlimited devices. 
            $20 less than Atera on every tier.
          </p>
          <div className="flex items-center justify-center gap-4">
            <RouterLink to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </RouterLink>
            <RouterLink to="/contact">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Talk to Sales
              </Button>
            </RouterLink>
          </div>
        </div>
      </div>

      {/* Audience Toggle + Billing */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-6 mb-12">
            <Tabs value={audience} onValueChange={(v) => {
              setAudience(v as 'msp' | 'it');
              setSelectedPlanId(v === 'msp' ? 'msp-growth' : 'it-expert');
            }}>
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="msp" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                  <Users className="h-4 w-4 mr-2" /> MSP Plans
                </TabsTrigger>
                <TabsTrigger value="it" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
                  <Building2 className="h-4 w-4 mr-2" /> IT Department Plans
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-4">
              <span className={billingCycle === 'monthly' ? 'text-white' : 'text-white/50'}>Monthly</span>
              <Switch
                checked={billingCycle === 'annual'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
              />
              <span className={billingCycle === 'annual' ? 'text-white' : 'text-white/50'}>
                Annual <Badge className="ml-1 bg-green-500/20 text-green-400 border-0">Save up to 30%</Badge>
              </span>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {plans.map((plan) => {
              const price = billingCycle === 'annual' ? plan.monthlyPrice : plan.monthlyPriceBilledMonthly;
              const savings = getAnnualSavings(plan);
              const isSelected = selectedPlanId === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={`relative bg-white/5 border-white/10 cursor-pointer transition-all ${
                    isSelected ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'hover:border-white/20'
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-cyan-500 to-purple-600 border-0">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-white/60 text-xs">{plan.description}</CardDescription>
                    <div className="mt-4">
                      {plan.enterprise ? (
                        <span className="text-3xl font-bold text-white">Custom</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-white">${price}</span>
                          <span className="text-white/60">/tech/mo</span>
                        </>
                      )}
                      {billingCycle === 'annual' && savings > 0 && (
                        <div className="text-xs text-green-400 mt-1">Save ${savings}/yr per tech</div>
                      )}
                      {!plan.enterprise && (
                        <div className="text-xs text-white/40 mt-1">Unlimited endpoints</div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {plan.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-white/70">
                          <Check className="h-3 w-3 text-cyan-400 flex-shrink-0" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Module Add-Ons */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-gradient-to-r from-amber-500/20 to-violet-500/20 border-amber-500/30 text-amber-400">
                <Layers className="h-3 w-3 mr-1" /> Module Add-Ons
              </Badge>
              <h2 className="text-2xl font-bold">Supercharge Your Stack</h2>
              <p className="text-white/50 text-sm">Add specialized modules à la carte</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {ADDONS.map(addon => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <Card
                    key={addon.id}
                    className={`bg-white/5 border-white/10 cursor-pointer transition-all ${
                      isSelected ? 'border-cyan-500 ring-1 ring-cyan-500/20' : 'hover:border-white/20'
                    }`}
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-sm font-medium">{addon.name}</span>
                        <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                          ${addon.monthlyPrice}{addon.perUser ? '/user' : ''}
                        </Badge>
                      </div>
                      <p className="text-white/40 text-[11px]">{addon.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Strategic Bundles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {ADDON_BUNDLES.map(bundle => (
              <Card key={bundle.id} className="bg-gradient-to-br from-cyan-500/5 to-purple-600/5 border-white/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-cyan-400" />
                      {bundle.name}
                    </CardTitle>
                    <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">
                      Save ${getBundleSavings(bundle)}/user/mo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">${bundle.monthlyPricePerUser}</span>
                    <span className="text-white/50 text-sm">/user/mo</span>
                    <span className="text-white/30 text-sm line-through">${bundle.alaCartePricePerUser}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quote Calculator */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Quick Quote — {selectedPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="text-sm text-white/70 block mb-2">Technicians</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range" min="1" max="50" value={techCount}
                      onChange={(e) => setTechCount(parseInt(e.target.value))}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="text-xl font-bold text-white w-12 text-right">{techCount}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">Unlimited endpoints per tech</p>
                </div>

                <div>
                  <label className="text-sm text-white/70 block mb-2">Selected Add-Ons</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedAddons.length === 0 && <p className="text-xs text-white/30">None selected</p>}
                    {selectedAddons.map(id => {
                      const addon = ADDONS.find(a => a.id === id);
                      return addon ? (
                        <div key={id} className="text-xs text-white/60 flex justify-between">
                          <span>{addon.name}</span>
                          <span>${addon.perUser ? addon.monthlyPrice * techCount : addon.monthlyPrice}/mo</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Estimated Monthly</div>
                  <div className="text-4xl font-bold text-white mb-2">
                    ${totalMonthly.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/50 space-y-1">
                    <div>{techCount} techs × ${pricePerTech}/tech = ${pricePerTech * techCount}/mo</div>
                    {addonMonthly > 0 && <div>Add-ons: ${addonMonthly}/mo</div>}
                    {billingCycle === 'annual' && <div className="text-green-400">Annual discount applied</div>}
                  </div>
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || selectedPlan.enterprise}
                    className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-600"
                  >
                    {isCheckingOut ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                    ) : selectedPlan.enterprise ? (
                      'Contact Sales'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MSP Partner CTA */}
          <div className="mt-8 text-center">
            <RouterLink to="/vanguard/partner-program">
              <Button variant="outline" className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                <Crown className="h-4 w-4 mr-2" />
                Reseller? Join our MSP Partner Program for volume discounts up to 35%
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </RouterLink>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/10 bg-gradient-to-r from-cyan-500/5 to-purple-600/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Secure Your Organization?</h2>
          <p className="text-white/60 mb-8">Start with a 14-day free trial. No credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <RouterLink to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90">
                Start Free Trial
              </Button>
            </RouterLink>
            <RouterLink to="/demos/vanguard">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Watch Demo
              </Button>
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VanguardSuite;
