import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Building2, Users, Globe, Zap, ArrowRight, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";

interface AIStudioUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mspPlans = [
  {
    id: 'msp_starter',
    name: 'MSP Starter',
    price: 99,
    features: ['5 Custom GPTs', 'Client allocation', 'White-label branding', 'Per-client analytics'],
    popular: false,
  },
  {
    id: 'msp_pro',
    name: 'MSP Pro',
    price: 249,
    features: ['25 Custom GPTs', 'Multi-client mgmt', 'API & webhooks', 'Priority support'],
    popular: true,
  },
  {
    id: 'msp_elite',
    name: 'MSP Elite',
    price: 499,
    features: ['Unlimited GPTs', 'Unlimited clients', 'Dedicated manager', 'SLA guarantee'],
    popular: false,
  },
];

const teamPlans = [
  {
    id: 'team_basic',
    name: 'Team Basic',
    price: 49,
    features: ['3 Custom GPTs', '5 team members', 'Knowledge base upload', 'Usage dashboard'],
    popular: true,
  },
  {
    id: 'team_plus',
    name: 'Team Plus',
    price: 149,
    features: ['10 Custom GPTs', '20 team members', 'Priority support', 'API access'],
    popular: false,
  },
];

const websitePlans = [
  {
    id: 'website_basic',
    name: 'Website Basic',
    price: 29,
    features: ['250 conversations/mo', '5 messages/visitor', 'Lead capture', 'Embed widget'],
    popular: false,
  },
  {
    id: 'website_pro',
    name: 'Website Pro',
    price: 79,
    features: ['1,000 conversations/mo', '5 messages/visitor', 'Custom branding', 'CRM integrations'],
    popular: true,
  },
];

export function AIStudioUpgradeModal({ open, onOpenChange }: AIStudioUpgradeModalProps) {
  const [selectedTab, setSelectedTab] = useState("team");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { createCheckout } = useSubscription();
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(planId);
    try {
      await createCheckout(planId, 'monthly');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const renderPlanCard = (plan: typeof mspPlans[0], color: string) => (
    <Card 
      key={plan.id} 
      className={`relative transition-all ${plan.popular ? `border-2 border-${color}-500/50 shadow-lg` : 'border-border/50 hover:border-primary/30'}`}
    >
      {plan.popular && (
        <Badge className={`absolute -top-2.5 left-1/2 -translate-x-1/2 bg-${color}-500 text-white text-[10px]`}>
          Recommended
        </Badge>
      )}
      <CardContent className="p-5">
        <h3 className="font-bold mb-1">{plan.name}</h3>
        <div className="mb-3">
          <span className="text-2xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground text-sm">/mo</span>
        </div>
        <div className="space-y-1.5 mb-4">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className={`h-3 w-3 text-${color}-500 flex-shrink-0`} />
              <span className="text-xs text-muted-foreground">{f}</span>
            </div>
          ))}
        </div>
        <Button 
          size="sm" 
          className={`w-full ${plan.popular ? '' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
          variant={plan.popular ? "default" : "secondary"}
          onClick={() => handleSelectPlan(plan.id)}
          disabled={isLoading !== null}
        >
          {isLoading === plan.id ? (
            <span className="flex items-center gap-2">
              <Zap className="h-3 w-3 animate-pulse" />
              Processing...
            </span>
          ) : (
            <>
              Select Plan
              <ArrowRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

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
              <DialogDescription>
                Choose the plan that fits your needs
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="team" className="gap-1.5 text-xs">
              <Users className="h-3 w-3" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="msp" className="gap-1.5 text-xs">
              <Building2 className="h-3 w-3" />
              MSP / IT Firms
            </TabsTrigger>
            <TabsTrigger value="website" className="gap-1.5 text-xs">
              <Globe className="h-3 w-3" />
              Website
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Your company's private AI with predictable usage.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {teamPlans.map(plan => renderPlanCard(plan, 'violet'))}
            </div>
          </TabsContent>

          <TabsContent value="msp" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Turn AI into a managed service for your clients.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {mspPlans.map(plan => renderPlanCard(plan, 'primary'))}
            </div>
          </TabsContent>

          <TabsContent value="website" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Smart website assistant for lead generation.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {websitePlans.map(plan => renderPlanCard(plan, 'cyan'))}
            </div>
          </TabsContent>
        </Tabs>

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
