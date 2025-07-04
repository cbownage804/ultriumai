import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  ArrowRight, 
  Zap,
  Coins,
  MessageSquare,
  FileText,
  Search,
  Image,
  Globe
} from "lucide-react";
import { CREDIT_PACKAGES, CREDIT_COSTS } from "@/types/credits";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

const CreditsPurchase = () => {
  const { user, session } = useAuth();
  const { credits, loading: profileLoading } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      // Verify and add credits
      supabase.functions.invoke('verify-credit-purchase', {
        body: { sessionId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }).then(() => {
        toast({
          title: "Credits purchased successfully!",
          description: "Your credits have been added to your account.",
        });
      });
    }
  }, [searchParams, session, toast]);

  const handlePurchase = async (packageId: string) => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('create-credit-purchase', {
        body: { packageId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating credit purchase:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase session.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const getCreditsPerDollar = (credits: number, price: number) => {
    return Math.round(credits / (price / 100));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-background to-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Coins className="h-8 w-8 text-primary" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary to-blue-400 bg-clip-text text-transparent">
              Buy More Credits
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Power up your AI interactions with additional credits. Choose the package that fits your needs.
          </p>
          
          {/* Current Credit Status */}
          {!profileLoading && credits && (
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Coins className="h-4 w-4" />
              Current Balance: {credits.credits_used || 0} / {credits.credits_limit || 0} credits used
            </div>
          )}
        </div>
      </section>

      {/* Credit Usage Guide */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How Credits Are Used</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader className="pb-3">
                <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Chat Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Basic (GPT-4o-mini): <span className="font-semibold text-foreground">{CREDIT_COSTS.CHAT_MESSAGE_BASIC} credit</span></div>
                <div className="text-sm text-muted-foreground">Advanced (GPT-4o): <span className="font-semibold text-foreground">{CREDIT_COSTS.CHAT_MESSAGE_ADVANCED} credits</span></div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Document Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Small docs: <span className="font-semibold text-foreground">{CREDIT_COSTS.DOCUMENT_PROCESSING_SMALL} credits</span></div>
                <div className="text-sm text-muted-foreground">Large docs: <span className="font-semibold text-foreground">{CREDIT_COSTS.DOCUMENT_PROCESSING_LARGE} credits</span></div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <Search className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">Search & Knowledge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Knowledge search: <span className="font-semibold text-foreground">{CREDIT_COSTS.KNOWLEDGE_SEARCH} credits</span></div>
                <div className="text-sm text-muted-foreground">Web search: <span className="font-semibold text-foreground">{CREDIT_COSTS.WEB_SEARCH} credits</span></div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="pb-3">
                <Image className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg">AI Generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">Image generation: <span className="font-semibold text-foreground">{CREDIT_COSTS.IMAGE_GENERATION} credits</span></div>
                <div className="text-sm text-muted-foreground">API calls: <span className="font-semibold text-foreground">{CREDIT_COSTS.API_CALL_BASIC}-{CREDIT_COSTS.API_CALL_COMPLEX} credits</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Credit Packages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Credit Package</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {CREDIT_PACKAGES.map((pkg, index) => (
              <Card 
                key={pkg.id}
                className={`relative ${pkg.popular ? 'border-primary shadow-lg scale-105' : ''}`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-6">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                  
                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      {formatPrice(pkg.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pkg.credits.toLocaleString()} credits
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-1">
                      {getCreditsPerDollar(pkg.credits, pkg.price)} credits per $1
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{pkg.credits.toLocaleString()} credits added to your account</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Credits never expire</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Use across all AI features</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Instant delivery</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <Button 
                    className={`w-full ${pkg.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    variant={pkg.popular ? "default" : "outline"}
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isLoading || !user}
                  >
                    {!user ? 'Login to Purchase' : `Buy ${pkg.name}`}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Do credits expire?</h3>
              <p className="text-muted-foreground">No, purchased credits never expire and remain in your account until used.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Can I use credits across different features?</h3>
              <p className="text-muted-foreground">Yes, credits can be used for any AI-powered feature including chat, document processing, searches, and more.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">What happens if I run out of credits?</h3>
              <p className="text-muted-foreground">You'll need to purchase more credits to continue using AI features, or wait for your monthly allocation to reset.</p>
            </Card>
            
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Is there a refund policy?</h3>
              <p className="text-muted-foreground">Due to the digital nature of credits, refunds are handled on a case-by-case basis. Contact support for assistance.</p>
            </Card>
          </div>
        </div>
      </section>

    </div>
  );
};

export default CreditsPurchase;