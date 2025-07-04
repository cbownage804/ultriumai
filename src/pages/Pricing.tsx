import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Check, 
  ArrowRight, 
  Users, 
  Building2, 
  Factory,
  MessageSquare,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Globe,
  Phone,
  Crown,
  X
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { subscription, createCheckout, openCustomerPortal, isLoading } = useSubscription();
  const { user } = useAuth();

  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out UltriumGPT",
      price: { monthly: 0, yearly: 0 },
      icon: Check,
      features: [
        "1 Custom GPT",
        "500 character prompts",
        "Basic chat interface",
        "Community support",
        "UltriumGPT branding"
      ],
      limitations: [
        "No API access",
        "No embedding",
        "No custom branding",
        "No document uploads"
      ],
      current: subscription.subscription_tier === "free",
      popular: false
    },
    {
      name: "Premium",
      description: "Best for small teams and professionals",
      price: { monthly: 100, yearly: 1000 },
      icon: Crown,
      features: [
        "5 Custom GPTs",
        "2,000 character prompts",
        "Document uploads & knowledge base",
        "Custom branding & theming",
        "Embed widgets",
        "API access",
        "Priority support",
        "Advanced analytics"
      ],
      current: subscription.subscription_tier === "premium",
      popular: true
    },
    {
      name: "Enterprise",
      description: "Unlimited power for growing businesses",
      price: { monthly: 500, yearly: 5000 },
      icon: Building2,
      features: [
        "Unlimited Custom GPTs",
        "5,000 character prompts",
        "Everything in Premium",
        "White-label solutions",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantees",
        "Custom deployment options"
      ],
      current: subscription.subscription_tier === "enterprise",
      popular: false
    }
  ];

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }

    if (planName === "Free") return;

    const interval = isYearly ? "yearly" : "monthly";
    await createCheckout(planName.toLowerCase(), interval);
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    return `$${price}`;
  };

  const getSavings = (plan: any) => {
    if (plan.price.yearly === 0) return null;
    const monthlyCost = plan.price.monthly * 12;
    const savings = monthlyCost - plan.price.yearly;
    return savings;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Choose Your <span className="text-primary">AI Power</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Transform your business with custom AI assistants. Start free, scale as you grow.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm ${isYearly ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="text-xs">
              Save 2 months
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              const PlanIcon = plan.icon;
              const savings = getSavings(plan);
              
              return (
                <Card 
                  key={index}
                  className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${plan.current ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  
                  {plan.current && (
                    <Badge variant="outline" className="absolute -top-3 right-4 border-primary text-primary">
                      Current Plan
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PlanIcon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="text-4xl font-bold">
                        {formatPrice(isYearly ? plan.price.yearly : plan.price.monthly)}
                      </div>
                      {plan.price.monthly > 0 && (
                        <div className="text-sm text-muted-foreground">
                          per {isYearly ? 'year' : 'month'}
                        </div>
                      )}
                      {isYearly && savings && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save ${savings}/year
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Limitations for Free plan */}
                    {plan.limitations && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="text-sm font-medium text-muted-foreground">Not included:</div>
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <div key={limitationIndex} className="flex items-center gap-3">
                            <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </CardContent>

                  <CardFooter>
                    {plan.current ? (
                      <div className="w-full space-y-2">
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                        {plan.name !== "Free" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full"
                            onClick={openCustomerPortal}
                          >
                            Manage Subscription
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.name)}
                        disabled={isLoading}
                      >
                        {plan.name === "Free" ? "Get Started" : `Upgrade to ${plan.name}`}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What happens to my GPTs if I downgrade?</h3>
              <p className="text-muted-foreground">Your GPTs remain accessible, but you may need to deactivate some to meet your plan's limits.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">Yes! Start with our free plan and upgrade when you're ready for more features.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-muted-foreground">We offer a 30-day money-back guarantee for all paid plans. No questions asked.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-primary/5 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of businesses already using UltriumGPT to create powerful AI assistants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Today
                  <Zap className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/dashboard">
                  View Live Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Pricing;