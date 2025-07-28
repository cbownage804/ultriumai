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
  Crown,
  Shield,
  Wrench,
  Zap,
  Brain
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const MSPPricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const { subscription, createCheckout, openCustomerPortal, isLoading } = useSubscription();
  const { user } = useAuth();

  // Custom GPT Solutions for MSPs (same pricing as business)
  const customGPTSolutions = [
    {
      name: "AI Knowledge Assistant",
      description: "Transform client documents into intelligent knowledge base",
      price: { monthly: 20, yearly: 200 },
      icon: Users,
      features: [
        "Document processing & indexing",
        "Intelligent Q&A system", 
        "Multi-format support",
        "White-label branding",
        "Client portal access"
      ]
    },
    {
      name: "Security Knowledge Base",
      description: "Cybersecurity training and compliance assistant",
      price: { monthly: 20, yearly: 200 },
      icon: Shield,
      features: [
        "Security policy guidance",
        "Compliance training modules",
        "Incident response help",
        "Custom security protocols",
        "Risk assessment tools"
      ]
    },
    {
      name: "Custom Enterprise Chatbot",
      description: "Fully customized AI assistant for client businesses",
      price: { monthly: 35, yearly: 350 },
      icon: Crown,
      features: [
        "Custom training on client data",
        "Branded interface",
        "API integration",
        "Multi-language support",
        "Advanced analytics"
      ]
    }
  ];

  // Core MSP Platform Plans
  const plans = [
    {
      name: "Ultrium SafeMSP Start",
      description: "Essential security platform for MSP clients",
      price: { monthly: 29, yearly: 290 },
      trial: "14-day free trial",
      icon: Users,
      features: [
        "UltriumGPT AI Platform access",
        "SafeLink URL protection",
        "SafeMail email security",
        "Basic white-label customization",
        "Client portal access",
        "Email & chat support"
      ],
      current: subscription.subscription_tier === "starter",
      popular: false,
      perUser: true
    },
    {
      name: "Ultrium SafeMSP Pro",
      description: "Enhanced security suite with expanded capabilities",
      price: { monthly: 49, yearly: 490 },
      trial: "14-day free trial",
      icon: Crown,
      features: [
        "Everything in SafeMSP Start",
        "SafePass password management",
        "SafeKB asset management",
        "Advanced white-label branding",
        "Multi-client management portal",
        "Priority support",
        "Advanced analytics & reporting"
      ],
      current: subscription.subscription_tier === "premium",
      popular: true,
      perUser: true
    },
    {
      name: "Ultrium SafeMSP Enterprise",
      description: "Complete security arsenal for MSP co-management",
      price: { monthly: 79, yearly: 790 },
      trial: "30-day free trial",
      icon: Building2,
      features: [
        "Everything in SafeMSP Pro",
        "Complete SafeSuite Apps (8 total)",
        "SafeNet network discovery",
        "SafeScore compliance management",
        "SafeWeb dark web monitoring",
        "SafeShield unified dashboard",
        "Full co-management tools",
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

  const additionalServices = [
    {
      name: "Ultrium SafeSecure",
      description: "Advanced endpoint protection and threat response",
      price: { monthly: 15, yearly: 150 },
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
      price: { monthly: 25, yearly: 250 },
      icon: Wrench,
      features: [
        "Integrated ticketing system",
        "Remote monitoring & management (RMM)",
        "Automated patch management",
        "Asset management & tracking",
        "Service desk automation",
        "Client communication portal"
      ]
    }
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
    return `$${price}`;
  };

  const getSavings = (plan: any) => {
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
            MSP Pricing - Strengthen Your Clients' Security Arsenal
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Co-manage security for clients with internal IT teams. Add powerful tools to their arsenal with white-label solutions and scalable per-user pricing.
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

      {/* Custom GPT Builder™ Pricing Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-primary/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center space-y-8 mb-12">
            <Badge variant="secondary" className="animate-pulse">
              <Zap className="h-4 w-4 mr-2" />
              Revolutionary AI Platform
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-tight">
              Custom GPT Builder™ Pricing
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Build unlimited custom AI assistants for your business. No coding required, 
              unlimited knowledge bases, white-label deployment included.
            </p>
          </div>

          {/* Custom GPT Builder Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Starter GPT Plan */}
            <Card className="bg-white/80 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">GPT Starter</CardTitle>
                <CardDescription className="text-base">Perfect for small teams</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">$99</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">1 Custom GPT assistant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">500 queries per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">1GB knowledge base storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Up to 3 team seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Basic analytics & usage tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">API access & webhooks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Email support</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant="outline">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Professional GPT Plan - Most Popular */}
            <Card className="bg-gradient-to-br from-white/90 to-primary/5 border-2 border-primary shadow-lg scale-105 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                Most Popular
              </Badge>
              
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">GPT Professional</CardTitle>
                <CardDescription className="text-base">Everything you need for business AI</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">$499</div>
                  <div className="text-sm text-muted-foreground">per month</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm font-medium">5 Custom GPT assistants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">2,500 queries per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">5GB knowledge base storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Up to 10 team seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Advanced analytics & insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">White-label deployment options</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Remove "Powered by UltriumAI" branding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Advanced integrations</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            {/* Enterprise GPT Plan */}
            <Card className="bg-white/80 border-2 border-primary/20 hover:border-primary/40 transition-all duration-300">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">GPT Enterprise</CardTitle>
                <CardDescription className="text-base">For large-scale deployments</CardDescription>
                
                <div className="mt-6 space-y-2">
                  <div className="text-4xl font-bold text-primary">Custom</div>
                  <div className="text-sm text-muted-foreground">Contact for pricing</div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    7-day free trial
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">25 Custom GPT assistants</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Custom query limits (high volume)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">25GB+ custom data storage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Unlimited team seats</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Enterprise security & compliance</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Dedicated account manager</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">24/7 priority support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">On-premise deployment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Custom training & setup</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant="outline">
                  Contact Sales
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Live Demo CTA */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-2xl p-8 border-2 border-primary/30 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <div className="space-y-4">
                <div className="inline-block">
                  <Badge variant="secondary" className="animate-pulse bg-green-100 text-green-800 text-sm px-4 py-2">
                    <Users className="mr-2 h-4 w-4" />
                    Interactive Demo Available
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  See Custom GPT Builder™ in Action
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Experience our revolutionary AI platform firsthand. Build your first custom GPT in under 5 minutes.
                </p>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  onClick={() => window.location.href = '/demos/custom-gpt-builder'}
                >
                  <Users className="mr-3 h-6 w-6" />
                  Try Live Demo Now
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core MSP Platform Plans */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Core MSP Platform Plans</h2>
            <p className="text-muted-foreground">Choose the right security foundation for your clients</p>
          </div>

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
                      <div className="text-sm text-muted-foreground">
                        per user/{isYearly ? 'year' : 'month'}
                      </div>
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
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={isLoading}
                    >
                      Start {plan.trial}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Services</h2>
            <p className="text-muted-foreground">Enhance your security offering with specialized tools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {additionalServices.map((service, index) => {
              const ServiceIcon = service.icon;
              const savings = getSavings(service);
              
              return (
                <Card key={index} className="relative">
                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ServiceIcon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{service.name}</CardTitle>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                    
                    <div className="mt-4">
                      <div className="text-4xl font-bold">
                        {formatPrice(isYearly ? service.price.yearly : service.price.monthly)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        per user/{isYearly ? 'year' : 'month'}
                      </div>
                      {isYearly && savings && (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save ${savings} per user/year
                        </div>
                      )}
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

      {/* MSP Profit Calculator */}
      <section className="py-16 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-green-700 dark:text-green-400">MSP Revenue Potential</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how much profit you can generate with our per-user pricing model while strengthening your clients' security arsenal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-green-200 dark:border-green-800">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">25 Users</div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Your Cost: $79 × 25 = $1,975/month</div>
                  <div className="text-sm text-muted-foreground">Charge Clients: $150 × 25 = $3,750/month</div>
                  <div className="text-lg font-bold text-green-600">Monthly Profit: $1,775</div>
                  <div className="text-sm text-green-500">90% profit margin</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-green-200 dark:border-green-800 ring-2 ring-green-500/20">
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

            <Card className="p-6 border-green-200 dark:border-green-800">
              <div className="text-center space-y-4">
                <div className="text-2xl font-bold text-green-600">250 Users</div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Your Cost: $79 × 250 = $19,750/month</div>
                  <div className="text-sm text-muted-foreground">Charge Clients: $150 × 250 = $37,500/month</div>
                  <div className="text-lg font-bold text-green-600">Monthly Profit: $17,750</div>
                  <div className="text-sm text-green-500">90% profit margin</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-4">Ready to Strengthen Your Clients' Security?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start co-managing security for clients with internal IT teams. Add powerful tools to their arsenal with white-label solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Your Free Trial
                  <Zap className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/pricing">
                  View Business Pricing
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

export default MSPPricing;