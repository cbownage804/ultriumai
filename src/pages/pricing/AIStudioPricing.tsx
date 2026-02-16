import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Building2, Globe, Users, Zap, ArrowRight, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import aiStudioLogo from '@/assets/ai-studio-logo.png';
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { MSP_PLANS, TEAM_PLANS, WEBSITE_PLANS } from "@/types/aiStudioCredits";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useConversionTracking } from "@/hooks/useConversionTracking";

const AIStudioPricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { trackPricingView, trackPlanSelect, trackCheckoutStart } = useConversionTracking();

  const isSubscribed = subscription?.subscribed;

  // Track pricing page view
  useEffect(() => {
    trackPricingView('ai_studio');
  }, [trackPricingView]);

  const handleGetStarted = async (planId?: string) => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent('/pricing/ai-studio'));
      return;
    }

    // If user is already subscribed, go to checkout to upgrade
    if (planId) {
      trackPlanSelect(planId, 'ai_studio');
      setCheckoutLoading(planId);
      
      try {
        // Get amount for tracking based on plan
        const planAmounts: Record<string, number> = {
          msp_starter: 14900, msp_pro: 47900, msp_elite: 89900, platform_pro: 179900,
          team_basic: 5900, team_plus: 23900,
          website_basic: 3900, website_pro: 5900,
        };
        trackCheckoutStart(planId, planAmounts[planId] || 0, 'ai_studio');
        
        const { data, error } = await supabase.functions.invoke('ai-studio-checkout', {
          body: { plan_id: planId }
        });
        
        if (error) throw error;
        
        if (data?.upgraded) {
          toast.success(data.message || 'Plan upgraded successfully!');
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
          }
          return;
        }
        
        if (data?.url) {
          window.open(data.url, '_blank');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        toast.error('Failed to start checkout');
      } finally {
        setCheckoutLoading(null);
      }
      return;
    }

    // No plan specified, just go to dashboard
    navigate('/ai-studio');
  };

  const getButtonText = (planId: string) => {
    if (checkoutLoading === planId) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (!user) return 'Start Trial';
    if (isSubscribed) return 'Upgrade';
    return 'Subscribe';
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl shadow-lg shadow-primary/20 mb-6">
            <img src={aiStudioLogo} alt="AI Studio" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/50 bg-clip-text text-transparent">
            AI Studio Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Business AI Control Plane—build, deploy, and govern custom AI assistants with predictable capacity-based pricing.
          </p>
        </div>
      </section>

      {/* MSP / IT Firms Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/20 text-primary border-primary/30">
              <Building2 className="h-3 w-3 mr-1" />
              For MSPs & IT Firms
            </Badge>
            <h2 className="text-2xl font-bold mb-2">Resale-Focused AI Capacity</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Turn AI into a managed service with full cost control and client allocation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* MSP Starter */}
            <Card className="border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-1">MSP Starter</h3>
                <p className="text-muted-foreground text-xs mb-4">Get started with AI services</p>
                
                <div className="mb-1">
                  <span className="text-3xl font-bold">$99</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-primary mb-4">Monthly AI capacity included</p>

                <div className="space-y-2 mb-6">
                  {["5 Custom GPTs", "Client allocation", "White-label branding", "Per-client analytics"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleGetStarted('msp_starter')} disabled={checkoutLoading === 'msp_starter'}>
                  {getButtonText('msp_starter')}
                </Button>
              </CardFooter>
            </Card>

            {/* MSP Pro - Popular */}
            <Card className="border-2 border-primary/50 relative shadow-lg shadow-primary/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                Popular
              </Badge>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-1">MSP Pro</h3>
                <p className="text-muted-foreground text-xs mb-4">Scale with your clients</p>
                
                <div className="mb-1">
                  <span className="text-3xl font-bold text-primary">$249</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-primary mb-4">Expanded AI capacity for scale</p>

                <div className="space-y-2 mb-6">
                  {["25 Custom GPTs", "Multi-client mgmt", "API & webhooks", "Priority support"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button size="sm" className="w-full" onClick={() => handleGetStarted('msp_pro')} disabled={checkoutLoading === 'msp_pro'}>
                  {getButtonText('msp_pro')}
                </Button>
              </CardFooter>
            </Card>

            {/* MSP Elite */}
            <Card className="border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-1">MSP Elite</h3>
                <p className="text-muted-foreground text-xs mb-4">Enterprise capacity</p>
                
                <div className="mb-1">
                  <span className="text-3xl font-bold">$499</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-primary mb-4">Enterprise-grade AI capacity</p>

                <div className="space-y-2 mb-6">
                  {["Unlimited GPTs", "Unlimited clients", "Dedicated manager", "SLA guarantee"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleGetStarted('msp_elite')} disabled={checkoutLoading === 'msp_elite'}>
                  {getButtonText('msp_elite')}
                </Button>
              </CardFooter>
            </Card>

            {/* Platform Pro */}
            <Card className="border-border/50 hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-1">Platform Pro</h3>
                <p className="text-muted-foreground text-xs mb-4">Maximum capacity</p>
                
                <div className="mb-1">
                  <span className="text-3xl font-bold">$999</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
                <p className="text-xs text-primary mb-4">Maximum AI capacity allocation</p>

                <div className="space-y-2 mb-6">
                  {["Everything in Elite", "Custom integrations", "Capacity rollover", "24/7 support"].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleGetStarted('platform_pro')} disabled={checkoutLoading === 'platform_pro'}>
                  {getButtonText('platform_pro')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Internal Teams Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-violet-500/20 text-violet-500 border-violet-500/30">
              <Users className="h-3 w-3 mr-1" />
              For Internal Teams
            </Badge>
            <h2 className="text-2xl font-bold mb-2">Your Company's Private AI</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Predictable monthly AI usage with no surprise costs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <Card className="border-border/50">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <p className="text-muted-foreground text-sm mb-6">Try AI Studio risk-free</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-violet-500 mb-6">Limited AI capacity</p>

                <div className="space-y-3 mb-8">
                  {["1 Custom GPT", "Basic features", "Community support", "Usage dashboard"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full" onClick={() => handleGetStarted()}>
                  Get Started Free
                </Button>
              </CardFooter>
            </Card>

            {/* Team Basic */}
            <Card className="border-2 border-violet-500/50 relative shadow-lg shadow-violet-500/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs">
                Recommended
              </Badge>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Team Basic</h3>
                <p className="text-muted-foreground text-sm mb-6">Predictable AI for small teams</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold text-violet-500">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-violet-500 mb-6">Included monthly AI capacity</p>

                <div className="space-y-3 mb-8">
                  {["3 Custom GPTs", "5 team members", "Knowledge base upload", "Usage dashboard", "Email support"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-violet-500 hover:bg-violet-600" onClick={() => handleGetStarted('team_basic')} disabled={checkoutLoading === 'team_basic'}>
                  {getButtonText('team_basic')}
                </Button>
              </CardFooter>
            </Card>

            {/* Team Plus */}
            <Card className="border-border/50">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Team Plus</h3>
                <p className="text-muted-foreground text-sm mb-6">Extended capacity for teams</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold">$149</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-violet-500 mb-6">Extended AI capacity</p>

                <div className="space-y-3 mb-8">
                  {["10 Custom GPTs", "20 team members", "Everything in Basic", "Priority support", "API access"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full" onClick={() => handleGetStarted('team_plus')} disabled={checkoutLoading === 'team_plus'}>
                  {getButtonText('team_plus')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Website / Embedded Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
              <Globe className="h-3 w-3 mr-1" />
              For Websites
            </Badge>
            <h2 className="text-2xl font-bold mb-2">Website AI Assistant</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Smart website assistant without spam or runaway costs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Website Basic */}
            <Card className="border-border/50 hover:border-cyan-500/30 transition-all">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Website Basic</h3>
                <p className="text-muted-foreground text-sm mb-6">Lead gen focused</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-cyan-500 mb-6">250 conversations/mo</p>

                <div className="space-y-3 mb-8">
                  {["5 messages/visitor cap", "Lead capture forms", "Embed widget", "Basic analytics"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button variant="outline" className="w-full" onClick={() => handleGetStarted('website_basic')} disabled={checkoutLoading === 'website_basic'}>
                  {getButtonText('website_basic')}
                </Button>
              </CardFooter>
            </Card>

            {/* Website Pro */}
            <Card className="border-2 border-cyan-500/50 relative shadow-lg shadow-cyan-500/10">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs">
                High Volume
              </Badge>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-2">Website Pro</h3>
                <p className="text-muted-foreground text-sm mb-6">High-volume lead gen</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold text-cyan-500">$79</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-cyan-500 mb-6">1,000 conversations/mo</p>

                <div className="space-y-3 mb-8">
                  {["5 messages/visitor cap", "Advanced lead forms", "Custom branding", "CRM integrations", "Priority support"].map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-8 pt-0">
                <Button className="w-full bg-cyan-500 hover:bg-cyan-600" onClick={() => handleGetStarted('website_pro')} disabled={checkoutLoading === 'website_pro'}>
                  {getButtonText('website_pro')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-cyan-500/10 border-primary/20">
            <CardContent className="p-12">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
              <p className="text-muted-foreground mb-6">
                Enterprise plans with custom capacity, SSO, dedicated support, and SLA guarantees.
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
