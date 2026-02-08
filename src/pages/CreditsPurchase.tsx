import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  ArrowRight, 
  Zap,
  Coins,
  MessageSquare,
  FileText,
  Search,
  Image,
  Clock,
  TrendingUp,
  TrendingDown,
  CreditCard,
  History,
  BarChart3,
  RefreshCw,
  Shield,
  Sparkles
} from "lucide-react";
import { CREDIT_PACKAGES, CREDIT_COSTS } from "@/types/credits";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { safeWindowOpen } from "@/utils/security";
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";
import { FloatingBackButton } from "@/components/shared/BackToHubButton";

const CreditsPurchase = () => {
  const { user, session } = useAuth();
  const { 
    credits, 
    history,
    remainingCredits,
    dailyRemaining,
    usagePercentage,
    getTimeUntilReset,
    refreshCredits,
    addBonusCredits,
    isLoading: creditsLoading 
  } = useUserCredits();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [usageData, setUsageData] = useState<any[]>([]);

  // Update countdown
  useEffect(() => {
    const updateTime = () => setTimeUntilReset(getTimeUntilReset());
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [getTimeUntilReset]);

  // Generate usage chart data
  useEffect(() => {
    const generateChartData = () => {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayHistory = history.filter(h => {
          const hDate = new Date(h.created_at);
          return hDate >= startOfDay(date) && hDate <= endOfDay(date);
        });
        
        const used = dayHistory
          .filter(h => h.action_type === 'usage')
          .reduce((sum, h) => sum + Math.abs(h.credits_amount), 0);

        data.push({
          date: format(date, 'EEE'),
          fullDate: format(date, 'MMM dd'),
          used
        });
      }
      setUsageData(data);
    };

    if (history.length > 0) {
      generateChartData();
    } else {
      // Generate empty chart data
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        data.push({
          date: format(date, 'EEE'),
          fullDate: format(date, 'MMM dd'),
          used: 0
        });
      }
      setUsageData(data);
    }
  }, [history]);

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const creditsParam = searchParams.get('credits');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && session?.access_token) {
      const creditsToAdd = parseInt(creditsParam || '0');
      
      if (sessionId) {
        // Always verify via server when we have a session ID (most secure)
        supabase.functions.invoke('verify-credit-purchase', {
          body: { sessionId },
        }).then(({ data, error }) => {
          if (error) {
            console.error('Credit verification error:', error);
            // Fallback: add credits client-side if we know the amount
            if (creditsToAdd > 0) {
              addBonusCredits(creditsToAdd, 'Credit pack purchase');
            }
          }
          toast({
            title: "Credits purchased successfully!",
            description: `${data?.creditsAdded || creditsToAdd} bonus credits have been added to your account.`,
          });
          refreshCredits();
        });
      } else if (creditsToAdd > 0) {
        // Fallback: add credits client-side
        addBonusCredits(creditsToAdd, 'Credit pack purchase').then(() => {
          toast({
            title: "Credits purchased successfully!",
            description: `${creditsToAdd} credits have been added to your account.`,
          });
          refreshCredits();
        });
      }
      navigate('/credits', { replace: true });
    }
  }, [searchParams, session, toast, addBonusCredits, refreshCredits, navigate]);

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
      safeWindowOpen(data.url, '_blank');
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

  const getCreditsPerDollar = (creditCount: number, price: number) => {
    return Math.round(creditCount / (price / 100));
  };

  const getStatusColor = () => {
    if (remainingCredits <= 0) return 'text-red-500';
    if (usagePercentage >= 80) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getProgressColor = () => {
    if (remainingCredits <= 0) return 'bg-red-500';
    if (usagePercentage >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'usage': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'purchase': return <CreditCard className="h-4 w-4 text-emerald-500" />;
      case 'reset': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'bonus': return <Sparkles className="h-4 w-4 text-amber-500" />;
      default: return <Coins className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <FloatingBackButton />
      
      {/* Hero Section */}
      <section className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Coins className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">AI Credits</h1>
                </div>
                <p className="text-white/80 max-w-lg">
                  Manage your AI credits, purchase more capacity, and track your usage.
                  <span className="block mt-1 font-medium text-white/90">Credits reset daily at midnight UTC.</span>
                </p>
              </div>

              {/* Current Balance Card */}
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white min-w-[280px]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white/80">Available Credits</span>
                    <Badge className="bg-white/20 text-white border-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {timeUntilReset}
                    </Badge>
                  </div>
                  <p className="text-4xl font-bold mb-2">{remainingCredits.toLocaleString()}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-white/70">
                      <span>Daily: {dailyRemaining} left</span>
                      <span>Bonus: +{credits.bonus_credits}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", getProgressColor())}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="buy" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Buy Credits
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20">
                        <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">Daily Limit</span>
                    </div>
                    <p className="text-3xl font-bold">{credits.credits_limit}</p>
                    <p className="text-xs text-muted-foreground mt-1">credits per day</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 border-blue-200/50 dark:border-blue-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">Used Today</span>
                    </div>
                    <p className="text-3xl font-bold">{credits.credits_used}</p>
                    <p className="text-xs text-muted-foreground mt-1">{usagePercentage.toFixed(1)}% of daily</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/20 border-amber-200/50 dark:border-amber-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-amber-500/20">
                        <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">Bonus Credits</span>
                    </div>
                    <p className="text-3xl font-bold">+{credits.bonus_credits}</p>
                    <p className="text-xs text-muted-foreground mt-1">never expire</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/20 border-purple-200/50 dark:border-purple-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-sm text-muted-foreground">Next Reset</span>
                    </div>
                    <p className="text-3xl font-bold">{timeUntilReset}</p>
                    <p className="text-xs text-muted-foreground mt-1">midnight UTC</p>
                  </CardContent>
                </Card>
              </div>

              {/* Usage Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    7-Day Usage
                  </CardTitle>
                  <CardDescription>Your credit consumption over the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageData}>
                        <defs>
                          <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullDate || label}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="used" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorUsed)" 
                          name="Credits Used"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Usage Guide */}
              <Card>
                <CardHeader>
                  <CardTitle>How Credits Are Used</CardTitle>
                  <CardDescription>Different AI operations consume different amounts of credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border bg-muted/50 text-center">
                      <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-sm">Chat Messages</p>
                      <p className="text-xs text-muted-foreground">{CREDIT_COSTS.CHAT_MESSAGE_BASIC}-{CREDIT_COSTS.CHAT_MESSAGE_ADVANCED} credits</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 text-center">
                      <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-sm">Documents</p>
                      <p className="text-xs text-muted-foreground">{CREDIT_COSTS.DOCUMENT_PROCESSING_SMALL}-{CREDIT_COSTS.DOCUMENT_PROCESSING_LARGE} credits</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 text-center">
                      <Search className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-sm">Search & KB</p>
                      <p className="text-xs text-muted-foreground">{CREDIT_COSTS.KNOWLEDGE_SEARCH}-{CREDIT_COSTS.WEB_SEARCH} credits</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/50 text-center">
                      <Image className="h-6 w-6 text-primary mx-auto mb-2" />
                      <p className="font-medium text-sm">AI Generation</p>
                      <p className="text-xs text-muted-foreground">{CREDIT_COSTS.IMAGE_GENERATION} credits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Buy Credits Tab */}
            <TabsContent value="buy" className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Choose Your Credit Pack</h2>
                <p className="text-muted-foreground">
                  Bonus credits are added to your account and never expire
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {CREDIT_PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={cn(
                      "relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                      pkg.popular && "border-primary ring-2 ring-primary/20"
                    )}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                        <Sparkles className="h-3 w-3 mr-1" />
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
                          <span className="text-sm">{pkg.credits.toLocaleString()} bonus credits</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">Never expire</span>
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
                        className={cn("w-full", pkg.popular && "bg-primary hover:bg-primary/90")}
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

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Powered by Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Instant delivery</span>
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Credit History
                      </CardTitle>
                      <CardDescription>Your recent credit transactions</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={refreshCredits}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    {history.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No credit history yet</p>
                        <p className="text-sm">Start using AI features to see your usage</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {history.map((item) => (
                          <div 
                            key={item.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted">
                                {getActionIcon(item.action_type)}
                              </div>
                              <div>
                                <p className="font-medium">{item.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(item.created_at), 'MMM dd, yyyy • h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className={cn(
                              "text-lg font-semibold tabular-nums",
                              item.credits_amount > 0 ? "text-emerald-500" : "text-red-500"
                            )}>
                              {item.credits_amount > 0 ? '+' : ''}{item.credits_amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default CreditsPurchase;