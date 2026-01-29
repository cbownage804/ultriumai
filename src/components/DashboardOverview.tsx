import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { CreditUsageDisplay } from "@/components/CreditUsageDisplay";
import { SubscriptionTestSuite } from "@/components/SubscriptionTestSuite";
import { ProductTour } from "@/components/onboarding";
import { AI_STUDIO_TOUR_STEPS } from "@/config/productTours";
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
  Lightbulb,
  BookOpen,
  Palette,
  Globe,
  Shield,
  Users,
  BarChart3
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

  // Quick Actions - focused on creation and getting help
  // Management (Analytics, White-label, API) now lives per-GPT
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
      title: "Studio Assistant",
      description: "Your AI co-pilot",
      icon: Sparkles,
      action: () => navigate("/ai-studio/assistant"),
      color: "bg-purple-500",
    },
  ];

  // Pro tips with clickable explanations
  const proTips = [
    {
      title: "Train on domain knowledge",
      description: "Upload documents, PDFs, or text files to teach your GPT about your specific industry, products, or services. This creates a custom knowledge base for accurate, contextual responses.",
      icon: BookOpen,
    },
    {
      title: "Use templates as starting points",
      description: "Browse our template marketplace for pre-configured GPTs. They're optimized for common use cases and can be customized to fit your exact needs.",
      icon: Lightbulb,
    },
    {
      title: "Connect external APIs",
      description: "Integrate live data sources like CRMs, databases, or web services. Your GPT can fetch real-time information and perform actions on external systems.",
      icon: Globe,
    },
    {
      title: "White-label your brand",
      description: "Remove all AI Studio branding and customize colors, logos, and styling to match your company identity for a seamless customer experience.",
      icon: Palette,
    },
    {
      title: "Set up team collaboration",
      description: "Invite team members to collaborate on GPT development. Assign roles, share analytics, and manage access permissions across your organization.",
      icon: Users,
    },
    {
      title: "Monitor with analytics",
      description: "Track usage patterns, popular queries, response quality, and user satisfaction. Use insights to continuously improve your GPT's performance.",
      icon: BarChart3,
    },
    {
      title: "Use system prompts wisely",
      description: "Craft detailed system prompts that define personality, boundaries, and response style. Well-written prompts dramatically improve output quality.",
      icon: Code,
    },
    {
      title: "Enable anti-hallucination",
      description: "Turn on factual grounding to reduce inaccurate responses. Your GPT will cite sources and acknowledge uncertainty when appropriate.",
      icon: Shield,
    },
  ];

  // Check if user has no data yet
  const hasNoData = gptStats.totalGPTs === 0 && gptStats.totalConversations === 0;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
      {/* Welcome Header - Fluid typography, mobile optimized */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-fluid-lg md:text-fluid-xl font-bold">
            <span className="text-muted-foreground font-normal">Good {getTimeOfDay()}, </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent animate-glow">
              {profile?.full_name || user?.email?.split('@')[0]}!
            </span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome to AI Studio — Build powerful AI solutions
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Badge variant="outline" className="px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm border-primary/30 bg-primary/5">
            {subscription?.subscription_tier || 'Free'} Plan
          </Badge>
          {subscription?.subscribed && (
            <Badge className="px-3 md:px-4 py-1 md:py-1.5 text-xs md:text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" />
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Overview - Responsive grid with premium cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6" data-tour="stats-overview">
        <Card 
          className="group relative overflow-hidden border-l-4 border-l-primary card-glass hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
          onClick={() => navigate('/dashboard/gpt')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Your GPTs</CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold text-primary">{gptStats.totalGPTs}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {gptStats.activeGPTs} active
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-l-4 border-l-emerald-500 card-glass hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Conversations</CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold text-emerald-500">{gptStats.totalConversations}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-l-4 border-l-blue-500 card-glass hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Satisfaction</CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold text-blue-500">{gptStats.avgSatisfaction}/5</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              Average rating
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden border-l-4 border-l-violet-500 card-glass hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium">Credits</CardTitle>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent className="relative p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-2xl md:text-3xl font-bold text-violet-500">
              {remainingCredits || (credits?.credits_limit || 0) - (credits?.credits_used || 0)}
            </div>
            <div className="mt-2 md:mt-3">
              <Progress value={100 - (usagePercentage || 0)} className="h-1.5 md:h-2" />
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
              {Math.round(100 - (usagePercentage || 0))}% remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Touch optimized */}
      <Card className="relative overflow-hidden border-border/50 card-glass" data-tour="quick-actions">
        <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <CardHeader className="relative p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg">
            <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Get started building AI solutions
          </CardDescription>
        </CardHeader>
        <CardContent className="relative p-4 pt-0 md:p-6 md:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto min-h-[100px] md:min-h-[120px] p-3 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-3 
                  bg-background/50 hover:bg-background border-border/50 hover:border-primary/30
                  hover:shadow-lg hover:-translate-y-1 transition-all duration-300 touch-target active:scale-95"
                onClick={action.action}
              >
                <div className={`p-2.5 md:p-3 rounded-xl ${action.color} shadow-lg`}>
                  <action.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium text-xs md:text-sm">
                    {action.title}
                  </div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pro Tips - Touch optimized with better mobile layout */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5" data-tour="pro-tips">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span>Pro Tips</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Get the most out of AI Studio
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <TooltipProvider delayDuration={200}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              {proTips.map((tip, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg bg-background/50 border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200 group touch-target active:bg-primary/10">
                      <tip.icon className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs md:text-sm line-clamp-1">{tip.title}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-3">
                    <p className="text-sm">{tip.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Subscription Management Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriptionStatus />
        <CreditUsageDisplay />
      </div>

      {/* Testing & Development Tools - Admin only */}
      {user?.email?.endsWith('@ultriumai.com') && (
        <SubscriptionTestSuite />
      )}

      {/* Upgrade Prompts - Only show for truly free/unsubscribed users */}
      {!subscription?.subscribed && subscription?.subscription_tier === "free" && (
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

      {/* Product Tour */}
      <ProductTour 
        tourId="ai-studio-intro" 
        steps={AI_STUDIO_TOUR_STEPS}
        autoStart={true}
      />
    </div>
  );
};
