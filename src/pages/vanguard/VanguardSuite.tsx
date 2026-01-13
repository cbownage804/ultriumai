import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, Lock, Search, Bot, Network, Wrench, MessageSquare, 
  Check, ArrowRight, Zap, Building2, Users, Crown, Package,
  Globe, Database, Key, Loader2
} from "lucide-react";
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ProductModule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  monthlyPrice: number;
  includedIn: ('starter' | 'professional' | 'enterprise')[];
  category: 'security' | 'operations' | 'ai';
  isCore?: boolean;
}

const products: ProductModule[] = [
  {
    id: 'safepass',
    name: 'SafePass™',
    description: 'Enterprise password management with breach monitoring',
    icon: Key,
    features: ['Password vault', 'Breach monitoring', 'Browser extension', 'Team sharing'],
    monthlyPrice: 5,
    includedIn: ['starter', 'professional', 'enterprise'],
    category: 'security',
    isCore: true
  },
  {
    id: 'safescan',
    name: 'SafeScan™',
    description: 'AI-powered email, link, and document scanning',
    icon: Shield,
    features: ['Email scanning', 'Link analysis', 'Document security', 'AI threat detection'],
    monthlyPrice: 8,
    includedIn: ['starter', 'professional', 'enterprise'],
    category: 'security',
    isCore: true
  },
  {
    id: 'safenet',
    name: 'SafeNet™',
    description: 'Network discovery and vulnerability assessment',
    icon: Network,
    features: ['Network scanning', 'Vulnerability detection', 'Topology mapping', 'Asset discovery'],
    monthlyPrice: 15,
    includedIn: ['professional', 'enterprise'],
    category: 'security',
    isCore: true
  },
  {
    id: 'helpdesk',
    name: 'Helpdesk™',
    description: 'AI-powered ticketing with intelligent routing',
    icon: MessageSquare,
    features: ['Smart routing', 'AI responses', 'SLA tracking', 'Multi-channel'],
    monthlyPrice: 12,
    includedIn: ['professional', 'enterprise'],
    category: 'operations'
  },
  {
    id: 'rmm',
    name: 'RMM™',
    description: 'Remote monitoring and management',
    icon: Wrench,
    features: ['Remote desktop', 'Script execution', 'Device monitoring', 'Patch management'],
    monthlyPrice: 10,
    includedIn: ['professional', 'enterprise'],
    category: 'operations'
  },
  {
    id: 'ultriumgpt',
    name: 'UltriumGPT',
    description: 'AI assistant for IT support and documentation',
    icon: Bot,
    features: ['IT troubleshooting', 'Document analysis', 'Custom training', 'Multi-language'],
    monthlyPrice: 20,
    includedIn: ['enterprise'],
    category: 'ai'
  },
  {
    id: 'darkweb',
    name: 'Dark Web Monitor',
    description: 'Credential monitoring and threat intelligence',
    icon: Globe,
    features: ['Breach detection', 'Credential monitoring', 'Executive protection', 'Real-time alerts'],
    monthlyPrice: 15,
    includedIn: ['enterprise'],
    category: 'security'
  },
  {
    id: 'siem',
    name: 'SIEM Dashboard',
    description: 'Security information and event management',
    icon: Database,
    features: ['Log aggregation', 'Threat correlation', 'Compliance reporting', 'Custom alerts'],
    monthlyPrice: 25,
    includedIn: ['enterprise'],
    category: 'security'
  },
];

interface PricingTier {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  description: string;
  userPrice: number;
  icon: React.ComponentType<any>;
  popular?: boolean;
  features: string[];
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Essential security for small teams',
    userPrice: 5,
    icon: Shield,
    features: [
      'SafePass™ password management',
      'SafeScan™ threat scanning',
      'Basic breach monitoring',
      'Email support',
      'Up to 25 users',
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Complete security & operations suite',
    userPrice: 12,
    icon: Zap,
    popular: true,
    features: [
      'Everything in Starter',
      'SafeNet™ vulnerability scanning',
      'Helpdesk™ ticketing system',
      'RMM™ remote management',
      'Priority support',
      'Up to 100 users',
      'API access',
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full platform with AI capabilities',
    userPrice: 20,
    icon: Crown,
    features: [
      'Everything in Professional',
      'UltriumGPT AI assistant',
      'Dark web monitoring',
      'SIEM integration',
      'Custom integrations',
      'Unlimited users',
      'Dedicated account manager',
      'SLA guarantee',
    ]
  },
];

const VanguardSuite = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [userCount, setUserCount] = useState(50);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const currentTier = pricingTiers.find(t => t.id === selectedTier)!;
  const discount = billingCycle === 'annual' ? 0.8 : 1; // 20% off annual
  
  const userMonthly = currentTier.userPrice * userCount * discount;
  const addonsMonthly = selectedAddons.reduce((sum, addonId) => {
    const addon = products.find(p => p.id === addonId);
    return sum + (addon?.monthlyPrice || 0) * userCount * discount;
  }, 0);
  
  const totalMonthly = userMonthly + addonsMonthly;

  const toggleAddon = (productId: string) => {
    setSelectedAddons(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const availableAddons = products.filter(p => !p.includedIn.includes(selectedTier));

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to Vanguard Suite",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-checkout', {
        body: { tier: selectedTier, seats: userCount },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Unable to start checkout",
        variant: "destructive",
      });
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
            All-in-One Security & Operations Platform
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-8">
            Bundle our entire portfolio into a single, unified platform. Get SafePass, SafeScan, SafeNet, 
            Helpdesk, RMM, and more—all integrated with Vanguard's AI-powered security operations center.
          </p>
          <div className="flex items-center justify-center gap-4">
            <RouterLink to="/vanguard/auth">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
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

      {/* Included Products Grid */}
      <section className="py-16 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What's Included</h2>
            <p className="text-white/60">Every product, fully integrated with your Vanguard dashboard</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <Card key={product.id} className="bg-white/5 border-white/10 hover:border-cyan-500/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-600/20 flex items-center justify-center">
                      <product.icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-sm">{product.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] border-white/20 text-white/60">
                        {product.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/60 text-xs mb-3">{product.description}</p>
                  <div className="space-y-1">
                    {product.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/50">
                        <Check className="h-3 w-3 text-cyan-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-white/60 mb-6">All plans include Vanguard AI SOC, unified dashboard, and 24/7 monitoring</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={billingCycle === 'monthly' ? 'text-white' : 'text-white/50'}>Monthly</span>
              <Switch 
                checked={billingCycle === 'annual'}
                onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
              />
              <span className={billingCycle === 'annual' ? 'text-white' : 'text-white/50'}>
                Annual <Badge className="ml-1 bg-green-500/20 text-green-400 border-0">Save 20%</Badge>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative bg-white/5 border-white/10 cursor-pointer transition-all ${
                  selectedTier === tier.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'hover:border-white/20'
                }`}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-purple-600 border-0">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tier.popular ? 'bg-gradient-to-br from-cyan-500 to-purple-600' : 'bg-white/10'
                    }`}>
                      <tier.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{tier.name}</CardTitle>
                      <CardDescription className="text-white/60">{tier.description}</CardDescription>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">${Math.round(tier.userPrice * discount)}</span>
                    <span className="text-white/60">/user/mo</span>
                    <div className="text-sm text-white/50">
                      Billed per seat {billingCycle === 'annual' ? '(20% annual discount)' : ''}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className="h-4 w-4 text-cyan-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quote Calculator */}
          <Card className="bg-gradient-to-br from-cyan-500/10 to-purple-600/10 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Quick Quote Calculator
              </CardTitle>
              <CardDescription className="text-white/60">
                Customize your {currentTier.name} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Count */}
                <div>
                  <label className="text-sm text-white/70 block mb-2">Number of Users</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="5" 
                      max="500" 
                      value={userCount}
                      onChange={(e) => setUserCount(parseInt(e.target.value))}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="text-xl font-bold text-white w-16 text-right">{userCount}</span>
                  </div>
                </div>

                {/* Add-ons */}
                {availableAddons.length > 0 && (
                  <div>
                    <label className="text-sm text-white/70 block mb-2">Available Add-ons</label>
                    <div className="space-y-2">
                      {availableAddons.slice(0, 3).map(addon => (
                        <div key={addon.id} className="flex items-center justify-between">
                          <span className="text-sm text-white/60">{addon.name}</span>
                          <Switch 
                            checked={selectedAddons.includes(addon.id)}
                            onCheckedChange={() => toggleAddon(addon.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-white/60 mb-1">Estimated Monthly Cost</div>
                  <div className="text-4xl font-bold text-white mb-2">
                    ${Math.round(totalMonthly).toLocaleString()}
                  </div>
                  <div className="text-xs text-white/50 space-y-1">
                    <div>{userCount} users × ${Math.round(currentTier.userPrice * discount)}/user = ${Math.round(userMonthly)}/mo</div>
                    {addonsMonthly > 0 && <div>Add-ons: ${Math.round(addonsMonthly)}/mo</div>}
                    {billingCycle === 'annual' && <div className="text-green-400">20% annual discount applied</div>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">One-time onboarding fee:</span>
                      <span className="text-white font-semibold">$999</span>
                    </div>
                    <p className="text-xs text-white/40 mt-1">Includes Vanguard agent hardware, setup & deployment</p>
                  </div>
                  <Button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-purple-600"
                  >
                    {isCheckingOut ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-white/10 bg-gradient-to-r from-cyan-500/5 to-purple-600/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Secure Your Organization?</h2>
          <p className="text-white/60 mb-8">
            Start with a 14-day free trial. No credit card required.
          </p>
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
