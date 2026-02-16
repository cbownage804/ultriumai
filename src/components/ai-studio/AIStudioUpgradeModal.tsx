import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AI_STUDIO_PLANS, CREDIT_TIERS } from "@/types/aiStudioCredits";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface AIStudioUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIStudioUpgradeModal({ open, onOpenChange }: AIStudioUpgradeModalProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [basicTier, setBasicTier] = useState(0);
  const [proTier, setProTier] = useState(0);
  const [basicAnnual, setBasicAnnual] = useState(false);
  const [proAnnual, setProAnnual] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGetStarted = async (planId: string, tierIndex: number, annual: boolean) => {
    if (!user) {
      navigate('/auth?redirect=' + encodeURIComponent('/ai-studio'));
      onOpenChange(false);
      return;
    }

    if (planId === 'enterprise') {
      navigate('/contact');
      onOpenChange(false);
      return;
    }

    const tiers = CREDIT_TIERS[planId as keyof typeof CREDIT_TIERS];
    if (!tiers) return;
    const tier = tiers[tierIndex];

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
        toast({ title: "Plan Upgraded!", description: data.message });
        if (data.redirectUrl) window.location.href = data.redirectUrl;
        onOpenChange(false);
        return;
      }
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({ title: "Error", description: "Failed to start checkout. Please try again.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatPrice = (cents: number, annual: boolean) => {
    if (annual) return `$${Math.round(cents / 12 / 100)}`;
    return `$${(cents / 100).toLocaleString()}`;
  };

  const getAnnualSavings = (monthlyPrice: number, annualPrice: number) => {
    return Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100);
  };

  const basicSelected = CREDIT_TIERS.basic[basicTier];
  const proSelected = CREDIT_TIERS.pro[proTier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Upgrade AI Studio</DialogTitle>
              <DialogDescription>Choose the AI capacity that fits your needs</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {/* Basic Plan */}
          <Card className="border-primary/50 shadow-lg shadow-primary/10 relative">
            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
              Most Popular
            </Badge>
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-1">{AI_STUDIO_PLANS.basic.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{AI_STUDIO_PLANS.basic.description}</p>

              <div className="mb-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(basicAnnual ? basicSelected.annualPrice : basicSelected.monthlyPrice, basicAnnual)}
                </span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Switch checked={basicAnnual} onCheckedChange={setBasicAnnual} className="scale-75" />
                  <span className="text-xs text-muted-foreground">Annual</span>
                </div>
                {basicAnnual && (
                  <span className="text-xs text-emerald-500 font-medium">
                    Save {getAnnualSavings(basicSelected.monthlyPrice, basicSelected.annualPrice)}%
                  </span>
                )}
              </div>

              <Select value={String(basicTier)} onValueChange={(v) => setBasicTier(Number(v))}>
                <SelectTrigger className="w-full bg-muted/50 border-border/50 mb-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[200]">
                  {CREDIT_TIERS.basic.map((tier, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {tier.credits.toLocaleString()} credits / month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1.5 mb-4">
                {AI_STUDIO_PLANS.basic.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => handleGetStarted('basic', basicTier, basicAnnual)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === 'basic' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Get Started <ArrowRight className="h-3 w-3 ml-1" /></>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="border-border/50 hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <h3 className="font-bold text-lg mb-1">{AI_STUDIO_PLANS.pro.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{AI_STUDIO_PLANS.pro.description}</p>

              <div className="mb-2">
                <span className="text-2xl font-bold">
                  {formatPrice(proAnnual ? proSelected.annualPrice : proSelected.monthlyPrice, proAnnual)}
                </span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Switch checked={proAnnual} onCheckedChange={setProAnnual} className="scale-75" />
                  <span className="text-xs text-muted-foreground">Annual</span>
                </div>
                {proAnnual && (
                  <span className="text-xs text-emerald-500 font-medium">
                    Save {getAnnualSavings(proSelected.monthlyPrice, proSelected.annualPrice)}%
                  </span>
                )}
              </div>

              <Select value={String(proTier)} onValueChange={(v) => setProTier(Number(v))}>
                <SelectTrigger className="w-full bg-muted/50 border-border/50 mb-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[200]">
                  {CREDIT_TIERS.pro.map((tier, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {tier.credits.toLocaleString()} credits / month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-1.5 mb-4">
                {AI_STUDIO_PLANS.pro.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleGetStarted('pro', proTier, proAnnual)}
                disabled={checkoutLoading !== null}
              >
                {checkoutLoading === 'pro' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>Get Started <ArrowRight className="h-3 w-3 ml-1" /></>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Need a custom enterprise solution?{" "}
            <a href="/contact" className="text-primary hover:underline">Contact Sales</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
