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
      name: "Business Starter",
      description: "Essential tools for growing businesses",
      price: { monthly: 29, yearly: 290 },
      trial: "14-day free trial",
      icon: Users,
      features: [
        "Unlimited Custom GPTs & AI Agents",
        "Mobile Technician App (iOS/Android)",
        "Choose 3 Security Applications",
        "Basic white-label customization",
        "API access & webhooks",
        "Knowledge base & document uploads",
        "Email & chat support",
        "Analytics dashboard"
      ],
      current: subscription.subscription_tier === "starter",
      popular: false,
      perUser: true
    },
    {
      name: "Professional",
      description: "Complete platform with enhanced security",
      price: { monthly: 49, yearly: 490 },
      trial: "14-day free trial",
      icon: Crown,
      features: [
        "Everything in Business Starter",  
        "Choose 6 Security Applications",
        "Full white-label branding suite",
        "Advanced mobile app customization",
        "Priority support",
        "Advanced analytics & reporting",
        "Custom integrations",
        "Multi-tenant management"
      ],
      current: subscription.subscription_tier === "premium",
      popular: true,
      perUser: true
    },
    {
      name: "MSP Co-Management",
      description: "Strengthen your clients' security arsenal through co-managed IT services",
      price: { monthly: 79, yearly: 790 },
      trial: "30-day free trial",
      icon: Building2,
      features: [
        "Everything in Professional",
        "All 8 Security Applications included",
        "Complete MSP client portal",
        "Co-managed service delivery tools",
        "Strengthen clients with internal IT teams",
        "White-label mobile apps per client",
        "RMM & PSA integrations",
        "SIEM & compliance dashboard",
        "Dedicated account manager",
        "Custom SLA & support tiers"
      ],
      current: subscription.subscription_tier === "enterprise",
      popular: false,
      perUser: true,
      mspProfit: {
        suggestedRate: 150,
        profit: 71,
        margin: "90%"
      }
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
                          per user/{isYearly ? 'year' : 'month'}
                        </div>
                      )}
                      {isYearly && savings && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save ${savings} per user/year
                        </div>
                      )}
                      {plan.mspProfit && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">MSP Profit Opportunity</div>
                          <div className="text-sm space-y-1">
                            <div>Charge: ${plan.mspProfit.suggestedRate}/user/month</div>
                            <div className="text-green-600 font-bold">Profit: ${plan.mspProfit.profit}/user/month ({plan.mspProfit.margin})</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Trial Badge */}
                    <div className="text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {plan.trial}
                      </Badge>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
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
                        Start {plan.trial}
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

      {/* MSP Profit Calculator */}
      <section className="py-16 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-green-700 dark:text-green-400">MSP Profit Potential</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how much profit you can generate with our per-user pricing model. Scale your business while delivering exceptional value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 10 Users Example */}
            <Card className="p-6 border-green-200 dark:border-green-800">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">10 Users</div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Your Cost: $79 × 10 = $790/month</div>
                  <div className="text-sm text-muted-foreground">Charge Clients: $150 × 10 = $1,500/month</div>
                  <div className="text-lg font-bold text-green-600">Monthly Profit: $710</div>
                  <div className="text-sm text-green-500">90% profit margin</div>
                </div>
              </div>
            </Card>

            {/* 50 Users Example */}
            <Card className="p-6 border-green-200 dark:border-green-800 ring-2 ring-green-500/20">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">50 Users</div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Your Cost: $79 × 50 = $3,950/month</div>
                  <div className="text-sm text-muted-foreground">Charge Clients: $150 × 50 = $7,500/month</div>
                  <div className="text-lg font-bold text-green-600">Monthly Profit: $3,550</div>
                  <div className="text-sm text-green-500">90% profit margin</div>
                </div>
              </div>
            </Card>

            {/* 100 Users Example */}
            <Card className="p-6 border-green-200 dark:border-green-800">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">100 Users</div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Your Cost: $79 × 100 = $7,900/month</div>
                  <div className="text-sm text-muted-foreground">Charge Clients: $150 × 100 = $15,000/month</div>
                  <div className="text-lg font-bold text-green-600">Monthly Profit: $7,100</div>
                  <div className="text-sm text-green-500">90% profit margin</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-green-200 dark:border-green-800">
            <h3 className="text-xl font-bold mb-6 text-center">Why This Pricing Works for MSPs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Scalable Revenue Model</div>
                    <div className="text-sm text-muted-foreground">Per-user pricing grows with your client base</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">High Profit Margins</div>
                    <div className="text-sm text-muted-foreground">90% margin on every user across all clients</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">White-Label Everything</div>
                    <div className="text-sm text-muted-foreground">Apps, portals, and branding for each client</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Co-Management Ready</div>
                    <div className="text-sm text-muted-foreground">Perfect for clients with internal IT teams</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Recurring Revenue</div>
                    <div className="text-sm text-muted-foreground">Predictable monthly income that scales</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Value-Based Pricing</div>
                    <div className="text-sm text-muted-foreground">Full platform justifies premium rates</div>
                  </div>
                </div>
              </div>
            </div>
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
              <h3 className="font-semibold mb-2">How do the free trials work?</h3>
              <p className="text-muted-foreground">Each plan includes a risk-free trial period (14-30 days). You get full access to all features during the trial with no credit card required to start.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What's included in the MSP Co-Management plan?</h3>
              <p className="text-muted-foreground">Perfect for MSPs supporting clients with internal IT teams. Strengthen their security arsenal with tools they can co-manage, plus white-label branding for each client.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I customize the number of security apps?</h3>
              <p className="text-muted-foreground">Yes! Business Starter includes 3 apps, Professional includes 6 apps, and MSP Co-Management includes all 8 security applications.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do you offer refunds and plan changes?</h3>
              <p className="text-muted-foreground">We offer a 30-day money-back guarantee for all plans. You can upgrade or downgrade at any time, and changes take effect immediately.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-4">Strengthen Your Clients' Security Arsenal</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Whether you're growing your business or co-managing IT services for clients, our platform provides the AI-powered tools and mobile apps needed to enhance security and streamline operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Your Free Trial
                  <Zap className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/technician-mobile">
                  Try Mobile App Demo
                  <Phone className="w-4 h-4 ml-2" />
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