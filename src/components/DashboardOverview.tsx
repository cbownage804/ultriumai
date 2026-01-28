import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { CreditUsageDisplay } from "@/components/CreditUsageDisplay";
import { SubscriptionTestSuite } from "@/components/SubscriptionTestSuite";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  CheckCircle, 
  Zap,
  Bot,
  MessageSquare,
  Star,
  Sparkles,
  Code,
  Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";


interface GPTStats {
  totalGPTs: number;
  activeGPTs: number;
  totalConversations: number;
  avgSatisfaction: number;
}

export const DashboardOverview = () => {
  const { user } = useAuth();
  const { profile, credits, subscription, loading } = useUserProfile();
  const { remainingCredits, usagePercentage } = useUserCredits();
  const navigate = useNavigate();
  
  const [gptStats, setGptStats] = useState<GPTStats>({
    totalGPTs: 0,
    activeGPTs: 0,
    totalConversations: 0,
    avgSatisfaction: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch real GPT stats from database
  useEffect(() => {
    const fetchGPTStats = async () => {
      if (!user) {
        setStatsLoading(false);
        return;
      }

      try {
        // Fetch total GPTs
        const gptResult = await supabase
          .from('custom_gpts')
          .select('id')
          .eq('user_id', user.id);

        const totalGPTs = gptResult.data?.length || 0;
        const activeGPTs = totalGPTs; // All GPTs considered active

        // Fetch total conversations this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const convResult = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());
        
        const totalConversations = convResult.data?.length || 0;

        // Calculate average satisfaction from feedback (using client_feedback as proxy)
        const { data: feedbackData } = await supabase
          .from('client_feedback')
          .select('rating');
        
        let avgSatisfaction = 0;
        if (feedbackData && feedbackData.length > 0) {
          const validRatings = feedbackData.filter((item: { rating: number | null }) => item.rating !== null);
          if (validRatings.length > 0) {
            const total = validRatings.reduce((sum: number, item: { rating: number | null }) => sum + (item.rating || 0), 0);
            avgSatisfaction = Math.round((total / validRatings.length) * 10) / 10;
          }
        }

        setGptStats({
          totalGPTs: totalGPTs || 0,
          activeGPTs: activeGPTs || 0,
          totalConversations: totalConversations || 0,
          avgSatisfaction: avgSatisfaction,
        });
      } catch (error) {
        console.error('Error fetching GPT stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchGPTStats();
  }, [user]);

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const quickActions = [
    {
      title: "Build a GPT",
      description: "Create custom AI assistants",
      icon: Bot,
      action: () => navigate("/dashboard/gpt/build"),
      color: "bg-primary",
    },
    {
      title: "GPT Templates",
      description: "Start from pre-built templates",
      icon: Star,
      action: () => navigate("/dashboard/gpt/templates"),
      color: "bg-secondary",
    },
    {
      title: "Ultrium GPT",
      description: "Your AI co-pilot",
      icon: Sparkles,
      action: () => navigate("/dashboard/ultrium-gpt"),
      color: "bg-purple-500",
    },
    {
      title: "Analytics",
      description: "View GPT performance",
      icon: TrendingUp,
      action: () => navigate("/dashboard/gpt/analyze"),
      color: "bg-blue-500",
    },
    {
      title: "White-label",
      description: "Brand your GPTs",
      icon: Palette,
      action: () => navigate("/dashboard/white-label"),
      color: "bg-pink-500",
    },
    {
      title: "API Management",
      description: "Manage API keys",
      icon: Code,
      action: () => navigate("/dashboard/api-management"),
      color: "bg-green-500",
    },
  ];

  // Check if user has no data yet
  const hasNoData = gptStats.totalGPTs === 0 && gptStats.totalConversations === 0;

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">
            <span className="text-muted-foreground font-normal">Good {getTimeOfDay()}, </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              {profile?.full_name || user?.email?.split('@')[0]}!
            </span>
          </h1>
          <p className="text-muted-foreground">
            Welcome to AI Studio — Build powerful AI solutions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
            {subscription?.subscription_tier || 'Free'} Plan
          </Badge>
          {subscription?.subscribed && (
            <Badge className="px-4 py-1.5 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 border-0">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="group relative overflow-hidden border-l-4 border-l-primary bg-gradient-to-br from-card to-card/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/dashboard/gpt')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your GPTs</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-primary">{gptStats.totalGPTs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {gptStats.activeGPTs} active
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-l-4 border-l-emerald-500 bg-gradient-to-br from-card to-card/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-500">{gptStats.totalConversations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-card to-card/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-500">{gptStats.avgSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average rating
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-l-4 border-l-violet-500 bg-gradient-to-br from-card to-card/50 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-4 w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-violet-500">
              {remainingCredits || (credits?.credits_limit || 0) - (credits?.credits_used || 0)}
            </div>
            <div className="mt-3">
              <Progress value={100 - (usagePercentage || 0)} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(100 - (usagePercentage || 0))}% remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-primary/[0.02]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Get started building AI solutions
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto min-h-[120px] p-4 flex flex-col items-center justify-center gap-3 
                  bg-background/50 hover:bg-background border-border/50 hover:border-primary/30
                  hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                onClick={action.action}
              >
                <div className={`p-3 rounded-xl ${action.color} shadow-lg`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">
                    {action.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Studio Features</span>
            </CardTitle>
            <CardDescription>
              Build and deploy custom AI solutions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/gpt/build')}>
              <div className="flex items-center space-x-3">
                <Code className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Custom GPT Builder</h3>
                  <p className="text-sm text-muted-foreground">Create AI assistants trained on your data</p>
                </div>
              </div>
              <Badge variant="outline">Available</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/white-label')}>
              <div className="flex items-center space-x-3">
                <Palette className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">White-Label Branding</h3>
                  <p className="text-sm text-muted-foreground">Deploy GPTs under your brand</p>
                </div>
              </div>
              <Badge variant="outline">Available</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate('/dashboard/api-management')}>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">API Integration</h3>
                  <p className="text-sm text-muted-foreground">Connect GPTs to external services</p>
                </div>
              </div>
              <Badge variant="outline">Available</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pro Tips */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Pro Tips</span>
            </CardTitle>
            <CardDescription>
              Get the most out of AI Studio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Build smarter AI solutions with these best practices:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Train GPTs on your specific domain knowledge
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Use templates as starting points
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Connect external APIs for dynamic responses
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                White-label to match your brand
              </li>
            </ul>
            <Button 
              className="w-full mt-4"
              variant="outline"
              onClick={() => navigate('/dashboard/gpt/templates')}
            >
              <Star className="h-4 w-4 mr-2" />
              Explore Templates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionStatus />
        <CreditUsageDisplay />
      </div>

      {/* Testing & Development Tools */}
      {(user?.email?.includes('@ultriumai.com') || subscription?.subscription_tier === 'enterprise') && (
        <SubscriptionTestSuite />
      )}

      {/* Upgrade Prompts */}
      {(subscription?.subscription_tier === "free" || !subscription?.subscribed) && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Star className="h-5 w-5" />
              Upgrade to Pro
            </CardTitle>
            <CardDescription className="text-purple-600 dark:text-purple-400">
              Unlock advanced AI features and increased limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">5,000</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Credits per month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">Unlimited</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">GPT Builds</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">Advanced</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">AI Features</div>
              </div>
            </div>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => navigate("/pricing")}
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
