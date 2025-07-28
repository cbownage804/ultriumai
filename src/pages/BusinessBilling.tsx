import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Building, Users, Star, Check } from "lucide-react";
import Navigation from "@/components/Navigation";
import BusinessCheckout from "@/components/BusinessCheckout";

interface PricingPlan {
  id: string;
  name: string;
  category: string;
  monthly_price: number;
  onboarding_fee: number | null;
  features: any;
  limits: any;
  created_at: string;
}

const BusinessBilling = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showCheckout, setShowCheckout] = useState(false);

  // Fetch pricing plans from database
  useEffect(() => {
    const fetchPricingPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('category', 'platform')
          .order('monthly_price', { ascending: true });

        if (error) throw error;
        setPricingPlans(data || []);
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing plans",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPricingPlans();
  }, [toast]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = () => {
    toast({
      title: "Checkout Created",
      description: "Redirecting to payment...",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (showCheckout && selectedPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
              <p className="text-muted-foreground">Configure your plan and billing details</p>
            </div>
            
            <BusinessCheckout 
              packageType={selectedPlan}
              onSuccess={handleCheckoutSuccess}
            />
            
            <div className="text-center mt-8">
              <Button 
                variant="ghost" 
                onClick={() => setShowCheckout(false)}
              >
                ← Back to Plans
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
              Business Solutions
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose from our enterprise-grade AI solutions designed for different business needs.
          </p>
        </div>
      </section>

      {/* Custom GPT Solutions */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Custom GPT Solutions</h2>
            <p className="text-muted-foreground">Pre-built AI solutions for specific business needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">AI Knowledge Assistant</CardTitle>
                <CardDescription>Transform your documents into intelligent knowledge base</CardDescription>
                <div className="text-2xl font-bold text-primary">$20/user/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Document processing & indexing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Intelligent Q&A system
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Multi-format support
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Security Knowledge Base</CardTitle>
                <CardDescription>Cybersecurity training and compliance assistant</CardDescription>
                <div className="text-2xl font-bold text-primary">$20/user/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Security policy guidance
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Compliance training
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Incident response help
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Custom Enterprise Chatbot</CardTitle>
                <CardDescription>Fully customized AI assistant for your business</CardDescription>
                <div className="text-2xl font-bold text-primary">$35/user/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Custom training on your data
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Branded interface
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    API integration
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Plans */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Platform Plans</h2>
            <p className="text-muted-foreground">Full platform access with team collaboration features</p>
          </div>

          {pricingPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No platform plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pricingPlans.map((plan, index) => {
                const isPopular = index === 1; // Mark middle plan as popular
                
                return (
                  <Card 
                    key={plan.id}
                    className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                    )}

                    <CardHeader className="text-center pb-6">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                        {index === 0 && <Users className="w-6 h-6 text-primary" />}
                        {index === 1 && <Star className="w-6 h-6 text-primary" />}
                        {index === 2 && <Building className="w-6 h-6 text-primary" />}
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Full platform access for teams
                      </CardDescription>
                      
                      <div className="mt-4">
                        <div className="text-4xl font-bold">
                          ${plan.monthly_price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per month + per user fees
                        </div>
                        {plan.onboarding_fee && (
                          <div className="text-xs text-muted-foreground mt-1">
                            + ${plan.onboarding_fee} setup fee
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.features && Array.isArray(plan.features) && plan.features.map((feature: string, featureIndex: number) => (
                          <div key={featureIndex} className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                        
                        {plan.limits && (
                          <div className="pt-2 space-y-2">
                            {plan.limits.users && (
                              <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm">Up to {plan.limits.users} users</span>
                              </div>
                            )}
                            {plan.limits.storage && (
                              <div className="flex items-center gap-3">
                                <CreditCard className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm">{plan.limits.storage} storage</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Button 
                        className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={isPopular ? "default" : "outline"}
                        onClick={() => handlePlanSelect(plan.name.toLowerCase())}
                        disabled={!user}
                      >
                        {!user ? 'Login to Purchase' : `Choose ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Additional Services</h2>
            <p className="text-muted-foreground">Enhance your platform with specialized security tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">SafeSecure Add-on</CardTitle>
                <CardDescription>Advanced security monitoring and protection</CardDescription>
                <div className="text-2xl font-bold text-primary">$25/user/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Real-time threat monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Automated security alerts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Compliance reporting
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Add to Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">SafeCenter Add-on</CardTitle>
                <CardDescription>Centralized security management dashboard</CardDescription>
                <div className="text-2xl font-bold text-primary">$35/user/month</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Unified security dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Multi-site management
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Advanced analytics
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  Add to Plan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">What's Included</h2>
            <p className="text-muted-foreground">All plans include our core platform features</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="w-8 h-8 mx-auto mb-2 rounded bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Invite team members, set permissions, and collaborate effectively
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="w-8 h-8 mx-auto mb-2 rounded bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Secure Billing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enterprise-grade security with flexible payment options
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="w-8 h-8 mx-auto mb-2 rounded bg-primary/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Priority Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get help when you need it with dedicated support channels
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <div className="w-8 h-8 mx-auto mb-2 rounded bg-primary/10 flex items-center justify-center">
                  <Building className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg">Custom Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Connect with your existing tools and workflows seamlessly
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Can I change my plan later?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">What happens during the free trial?</h3>
                <p className="text-muted-foreground">
                  You get full access to all features of your chosen plan for 14 days. No credit card required to start.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
                <p className="text-muted-foreground">
                  Some plans include a one-time setup fee to cover onboarding and initial configuration. This is clearly marked in the pricing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessBilling;