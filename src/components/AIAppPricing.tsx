import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Building2, Rocket, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AIAppPricingProps {
  onSelectPlan?: (planId: string) => void;
}

const AIAppPricing = ({ onSelectPlan }: AIAppPricingProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: "creator",
      name: "Creator",
      price: 29,
      period: "month",
      description: "Perfect for individuals building their first AI apps",
      icon: Sparkles,
      color: "#3b82f6",
      features: [
        "3 Custom AI Apps",
        "Included monthly AI capacity",
        "Basic templates",
        "Public sharing links",
        "Email support",
        "UltriumAI branding"
      ],
      limits: {
        apps: 3,
        teamMembers: 1
      }
    },
    {
      id: "professional",
      name: "Professional",
      price: 99,
      period: "month",
      description: "For professionals monetizing AI solutions",
      icon: Zap,
      color: "#8b5cf6",
      popular: true,
      features: [
        "15 Custom AI Apps",
        "Expanded AI capacity",
        "All templates",
        "Custom branding",
        "API access",
        "Teams integration",
        "Priority support",
        "Usage analytics"
      ],
      limits: {
        apps: 15,
        teamMembers: 5
      }
    },
    {
      id: "agency",
      name: "Agency",
      price: 299,
      period: "month",
      description: "For agencies building AI apps for clients",
      icon: Building2,
      color: "#f59e0b",
      features: [
        "Scalable AI capacity",
        "All templates + early access",
        "White-label everything",
        "Client sub-accounts",
        "Reseller license",
        "Dedicated support",
        "Custom integrations"
      ],
      limits: {
        apps: -1, // unlimited
        teamMembers: 25
      }
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: null,
      period: "custom",
      description: "For large organizations with custom needs",
      icon: Crown,
      color: "#dc2626",
      features: [
        "Custom AI capacity allocation",
        "On-premise deployment option",
        "SSO / SAML",
        "SLA guarantee",
        "Dedicated success manager",
        "Custom training",
        "Volume discounts"
      ],
      limits: {
        apps: -1,
        teamMembers: -1
      }
    }
  ];

  const usageAddons = [
    {
      id: "capacity-boost",
      name: "Capacity Boost",
      price: 49,
      description: "Expand your monthly AI capacity allocation"
    },
    {
      id: "capacity-pro",
      name: "Capacity Pro",
      price: 149,
      description: "Significant AI capacity expansion for scaling teams"
    },
    {
      id: "apps-5",
      name: "5 Extra Apps",
      price: 29,
      description: "Increase your app limit by 5"
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }

    setLoading(planId);

    try {
      // Call checkout function
      const { data, error } = await supabase.functions.invoke('ai-studio-checkout', {
        body: { planId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }

      onSelectPlan?.(planId);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">AI Studio — Business AI Control Plane</h2>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Build, deploy, and govern AI assistants with predictable cost and enterprise controls.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const IconComponent = plan.icon;
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div 
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${plan.color}20` }}
                >
                  <IconComponent className="h-6 w-6" style={{ color: plan.color }} />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="text-center py-4 border-t border-b">
                  {plan.price ? (
                    <>
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">Contact Sales</span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button 
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? (
                    "Loading..."
                  ) : plan.price ? (
                    `Get ${plan.name}`
                  ) : (
                    "Contact Sales"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Usage Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Capacity Add-ons
          </CardTitle>
          <CardDescription>
            Need more AI capacity? Expand your allocation anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {usageAddons.map((addon) => (
              <Card key={addon.id} className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{addon.name}</span>
                    <Badge variant="secondary">${addon.price}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-App Pricing Note */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Need to deliver AI to clients? The Agency plan includes reseller licensing 
          with white-label options and client-level visibility.
        </p>
      </div>
    </div>
  );
};

export default AIAppPricing;
