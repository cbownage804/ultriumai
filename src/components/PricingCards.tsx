import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  icon: any;
  planType: string;
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$19",
    description: "Perfect for small businesses getting started with AI security",
    icon: Zap,
    planType: "starter",
    features: [
      "Up to 1,000 AI security scans per month",
      "Basic threat detection",
      "Email support",
      "Standard integrations",
      "Basic reporting"
    ]
  },
  {
    name: "Professional",
    price: "$99",
    description: "Advanced features for growing businesses",
    icon: Crown,
    planType: "professional",
    highlighted: true,
    features: [
      "Up to 10,000 AI security scans per month",
      "Advanced threat detection & response",
      "Priority support (24/7)",
      "Custom integrations",
      "Advanced analytics & reporting",
      "API access",
      "Team collaboration tools"
    ]
  },
  {
    name: "Enterprise",
    price: "$299",
    description: "Complete solution for large organizations",
    icon: Building,
    planType: "enterprise",
    features: [
      "Unlimited AI security scans",
      "Enterprise-grade threat intelligence",
      "Dedicated success manager",
      "Custom development",
      "White-label options",
      "Advanced compliance reporting",
      "Single sign-on (SSO)",
      "Custom SLAs"
    ]
  }
];

export const PricingCards = () => {
  const navigate = useNavigate();

  const handleSubscribe = (planType: string) => {
    navigate('/business-billing');
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        
        return (
          <Card 
            key={plan.name} 
            className={`relative ${plan.highlighted ? 'border-primary shadow-lg scale-105' : ''}`}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                {plan.price}
                <span className="text-base font-normal text-muted-foreground">/month</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full" 
                variant={plan.highlighted ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.planType)}
              >
                Choose {plan.name}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};