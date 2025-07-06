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
import Footer from "@/components/Footer";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { subscription, createCheckout, openCustomerPortal, isLoading } = useSubscription();
  const { user } = useAuth();

  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out the platform",
      price: { monthly: 0, yearly: 0 },
      icon: Check,
      features: [
        "1 Custom GPT",
        "Basic chat interface",
        "Community support",
        "UltriumGPT branding",
        "Limited mobile app access"
      ],
      limitations: [
        "No security apps",
        "No white-label branding",
        "No API access",
        "No MSP features"
      ],
      current: subscription.subscription_tier === "free",
      popular: false
    },
    {
      name: "Professional",
      description: "Complete platform for businesses",
      price: { monthly: 149, yearly: 1490 },
      icon: Crown,
      features: [
        "Unlimited Custom GPTs",
        "Mobile Technician App (iOS/Android)",
        "4 Security Apps included",
        "White-label branding",
        "API access & webhooks",
        "Knowledge base & document uploads",
        "Priority support",
        "Advanced analytics"
      ],
      current: subscription.subscription_tier === "premium",
      popular: true
    },
    {
      name: "MSP/Enterprise",
      description: "Full platform for service providers",
      price: { monthly: 299, yearly: 2990 },
      icon: Building2,
      features: [
        "Everything in Professional",
        "All 8 Security Applications",
        "MSP client management portal",
        "Co-managed service delivery",
        "RMM & PSA integrations",
        "SIEM & compliance tools",
        "White-label mobile apps",
        "Dedicated account manager",
        "Custom integrations & SLA"
      ],
      current: subscription.subscription_tier === "enterprise",
      popular: false
    }
  ];

  const securityApps = [
    { name: "SafeMail", description: "AI email threat detection" },
    { name: "SafeDoc", description: "Document security scanning" },
    { name: "SafeLink", description: "URL analysis & protection" },
    { name: "SafePass", description: "Password management" },
    { name: "SafeNet", description: "Network discovery & mapping" },
    { name: "SafeComp", description: "Compliance management" },
    { name: "SafeWeb", description: "Dark web monitoring" },
    { name: "SafeShield", description: "Unified security dashboard" }
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
            Complete AI Business Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Custom GPTs, Mobile Apps, Security Suite, MSP Tools & White-Label Solutions - All in One Platform
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

      {/* Platform Features Breakdown */}
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Features Breakdown</h2>
            <p className="text-muted-foreground">See exactly what's included in each plan</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Mobile & Core Platform */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Mobile & Core Platform
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro & MSP</Badge>
                  <span className="text-sm">iOS & Android Technician Apps</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro & MSP</Badge>
                  <span className="text-sm">GPS tracking & field operations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro & MSP</Badge>
                  <span className="text-sm">Real-time alerts & notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">MSP Only</Badge>
                  <span className="text-sm">White-label mobile apps</span>
                </div>
              </div>
            </Card>

            {/* Security Applications */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Applications
              </h3>
              <div className="space-y-2">
                {securityApps.slice(0, 4).map((app, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="secondary">Pro & MSP</Badge>
                    <span className="text-sm font-medium">{app.name}</span>
                    <span className="text-xs text-muted-foreground">- {app.description}</span>
                  </div>
                ))}
                {securityApps.slice(4).map((app, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="default">MSP Only</Badge>
                    <span className="text-sm font-medium">{app.name}</span>
                    <span className="text-xs text-muted-foreground">- {app.description}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* MSP & Enterprise Features */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                MSP & Enterprise Features
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="default">MSP Only</Badge>
                  <span className="text-sm">Client management portal</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">MSP Only</Badge>
                  <span className="text-sm">Co-managed service delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">MSP Only</Badge>
                  <span className="text-sm">RMM & PSA integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">MSP Only</Badge>
                  <span className="text-sm">SIEM & compliance dashboard</span>
                </div>
              </div>
            </Card>

            {/* API & Development */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                API & Development
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro & MSP</Badge>
                  <span className="text-sm">Full REST API access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro & MSP</Badge>
                  <span className="text-sm">Webhook integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">MSP Only</Badge>
                  <span className="text-sm">Custom integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">MSP Only</Badge>
                  <span className="text-sm">Dedicated support & SLA</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Mobile App Showcase */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Mobile Technician App Highlights</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-sm font-medium">iOS & Android</div>
                <div className="text-xs text-muted-foreground">Native mobile apps</div>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-sm font-medium">Real-time Alerts</div>
                <div className="text-xs text-muted-foreground">Push notifications</div>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Globe className="h-6 w-6 text-purple-500" />
                </div>
                <div className="text-sm font-medium">GPS Tracking</div>
                <div className="text-xs text-muted-foreground">Field operations</div>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-orange-500" />
                </div>
                <div className="text-sm font-medium">White-Label</div>
                <div className="text-xs text-muted-foreground">Custom branding</div>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/technician-mobile">
                Try Mobile App Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
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

      <Footer />
    </div>
  );
};

export default Pricing;