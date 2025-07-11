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
      name: "Starter",
      description: "Perfect for small teams getting started with AI",
      platformFee: { monthly: 149, yearly: 1490 },
      perUserFee: { monthly: 25, yearly: 250 },
      trial: "14-day free trial",
      icon: Users,
      features: [
        "Up to 10 team members",
        "5 Custom AI Agents",
        "Basic security scanning",
        "Email support",
        "Standard integrations",
        "10GB storage",
        "Basic analytics"
      ],
      current: subscription.subscription_tier === "starter",
      popular: false
    },
    {
      name: "Professional",
      description: "Advanced features for growing businesses",
      platformFee: { monthly: 299, yearly: 2990 },
      perUserFee: { monthly: 39, yearly: 390 },
      trial: "14-day free trial",
      icon: Crown,
      features: [
        "Up to 50 team members",
        "Unlimited Custom AI Agents",
        "Advanced security suite",
        "Mobile technician apps (iOS & Android)",
        "Full MSP dashboard",
        "Priority support",
        "Premium integrations",
        "50GB storage",
        "Advanced analytics",
        "Custom workflows",
        "API access"
      ],
      current: subscription.subscription_tier === "professional",
      popular: true
    },
    {
      name: "Enterprise",
      description: "Complete platform for large organizations",
      platformFee: { monthly: 599, yearly: 5990 },
      perUserFee: { monthly: 49, yearly: 490 },
      trial: "30-day free trial",
      icon: Building2,
      features: [
        "Unlimited team members",
        "White-label solutions",
        "Enterprise security & compliance",
        "Dedicated account manager",
        "24/7 phone support",
        "Custom integrations",
        "100GB storage + additional available",
        "Custom reporting",
        "SLA guarantees",
        "On-premise deployment",
        "Advanced user management",
        "Custom training"
      ],
      current: subscription.subscription_tier === "enterprise",
      popular: false
    }
  ];

  const additionalServices = [
    {
      name: "Ultrium SafeSecure",
      description: "Advanced endpoint protection and threat response",
      perUserFee: { monthly: 15, yearly: 150 },
      icon: Shield,
      features: [
        "AI-powered SafeAV protection",
        "Managed Detection & Response (SafeEDR)",
        "24/7 threat monitoring",
        "Incident response automation",
        "Endpoint detection & response",
        "Threat intelligence feeds"
      ]
    },
    {
      name: "Ultrium SafeCenter",
      description: "Complete service management platform",
      perUserFee: { monthly: 25, yearly: 250 },
      icon: Factory,
      features: [
        "Integrated ticketing system",
        "Remote monitoring & management (RMM)",
        "Automated patch management",
        "Asset management & tracking",
        "Service desk automation",
        "Internal team collaboration"
      ]
    }
  ];

  const securityApps = [
    { name: "SafeScan", description: "AI email, link & document threat detection", tier: "starter" },
    { name: "SafePass", description: "Password management", tier: "professional" },
    { name: "SafeKB", description: "Knowledge base & asset management", tier: "professional" },
    { name: "SafeNet", description: "Network discovery & mapping", tier: "professional" },
    { name: "SafeScore", description: "Compliance management", tier: "professional" },
    { name: "SafeWeb", description: "Dark web monitoring", tier: "enterprise" },
    { name: "SafeShield", description: "Unified security dashboard", tier: "enterprise" }
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

  const calculateTotalPrice = (plan: any, userCount: number = 1) => {
    const platformCost = isYearly ? plan.platformFee.yearly : plan.platformFee.monthly;
    const userCost = (isYearly ? plan.perUserFee.yearly : plan.perUserFee.monthly) * userCount;
    return platformCost + userCost;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
            Business Pricing - AI-Powered Security Solutions
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Strengthen your business security with AI-powered tools, custom GPTs, and comprehensive protection suite
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

      {/* Main Plans */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Core Business Plans</h2>
            <p className="text-muted-foreground">Choose the right security foundation for your business</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => {
              const PlanIcon = plan.icon;
              
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

                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PlanIcon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                    
                    <div className="mt-4 space-y-2">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(isYearly ? plan.platformFee.yearly : plan.platformFee.monthly)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Platform fee/{isYearly ? 'year' : 'month'}
                        </div>
                      </div>
                      <div className="text-lg font-medium text-foreground">
                        + {formatPrice(isYearly ? plan.perUserFee.yearly : plan.perUserFee.monthly)}/user
                      </div>
                      <div className="text-xs text-muted-foreground">
                        per user/{isYearly ? 'year' : 'month'}
                      </div>
                      {isYearly && (
                        <div className="text-sm text-green-600 font-medium">
                          Save 2 months with yearly billing
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {plan.trial}
                      </Badge>
                    </div>

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
                    {subscription.subscribed && plan.current ? (
                      <div className="w-full space-y-2">
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={openCustomerPortal}
                          disabled={isLoading}
                        >
                          Manage Subscription
                          <Settings className="w-4 h-4 ml-2" />
                        </Button>
                        <div className="text-center text-sm text-green-600 font-medium">
                          Current Plan
                        </div>
                      </div>
                    ) : (
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.name)}
                        disabled={isLoading}
                      >
                        {subscription.subscribed ? `Upgrade to ${plan.name}` : `Start ${plan.trial}`}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* Additional Services */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Services</h2>
            <p className="text-muted-foreground">Enhance your security offering with specialized tools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {additionalServices.map((service, index) => {
              const ServiceIcon = service.icon;
              
              return (
                <Card key={index} className="relative">
                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ServiceIcon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{service.name}</CardTitle>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="text-3xl font-bold">
                        {formatPrice(isYearly ? service.perUserFee.yearly : service.perUserFee.monthly)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per user/{isYearly ? 'year' : 'month'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Add-on to core platform
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => handleSubscribe(service.name)}
                      disabled={isLoading}
                    >
                      Add to Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
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
                  <Badge variant="outline">Pro+</Badge>
                  <span className="text-sm">iOS & Android Technician Apps</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro+</Badge>
                  <span className="text-sm">GPS tracking & field operations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Pro+</Badge>
                  <span className="text-sm">Real-time alerts & notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Enterprise</Badge>
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
                {securityApps.filter(app => app.tier === "starter").map((app, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="secondary">Starter+</Badge>
                    <span className="text-sm font-medium">{app.name}</span>
                    <span className="text-xs text-muted-foreground">- {app.description}</span>
                  </div>
                ))}
                {securityApps.filter(app => app.tier === "professional").map((app, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="secondary">Pro+</Badge>
                    <span className="text-sm font-medium">{app.name}</span>
                    <span className="text-xs text-muted-foreground">- {app.description}</span>
                  </div>
                ))}
                {securityApps.filter(app => app.tier === "enterprise").map((app, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Badge variant="default">Enterprise</Badge>
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
                  <Badge variant="default">Enterprise</Badge>
                  <span className="text-sm">Client management portal</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Enterprise</Badge>
                  <span className="text-sm">Co-managed service delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Enterprise</Badge>
                  <span className="text-sm">RMM & PSA integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Enterprise</Badge>
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
            <h2 className="text-3xl font-bold mb-4">Ready to Strengthen Your Business Security?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start protecting your business with AI-powered security tools and custom GPT solutions designed for modern threats.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Your Free Trial
                  <Zap className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/msp-pricing">
                  View MSP Pricing
                  <ArrowRight className="w-4 h-4 ml-2" />
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