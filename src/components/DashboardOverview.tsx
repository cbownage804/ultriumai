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
  Brain,
  Mic,
  Eye,
  Sparkles,
  Code,
  Palette,
  Shield,
  ExternalLink,
  Inbox
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
      featured: true,
    },
    {
      title: "GPT Templates",
      description: "Start from pre-built templates",
      icon: Star,
      action: () => navigate("/dashboard/gpt/templates"),
      color: "bg-secondary",
      featured: true,
    },
    {
      title: "AI Intelligence Hub",
      description: "Advanced AI analysis",
      icon: Brain,
      action: () => navigate("/dashboard/ai/intelligence"),
      color: "bg-purple-500",
    },
    {
      title: "Voice Interface",
      description: "Voice-to-text AI",
      icon: Mic,
      action: () => navigate("/dashboard/ai/voice"),
      color: "bg-blue-500",
    },
    {
      title: "Vision Analyzer",
      description: "Image analysis AI",
      icon: Eye,
      action: () => navigate("/dashboard/ai/vision"),
      color: "bg-green-500",
    },
    {
      title: "Ultrium GPT",
      description: "Your AI co-pilot",
      icon: Sparkles,
      action: () => navigate("/dashboard/ultrium-gpt"),
      color: "bg-orange-500",
    },
  ];

  // Check if user has no data yet
  const hasNoData = gptStats.totalGPTs === 0 && gptStats.totalConversations === 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-glow">
            Good {getTimeOfDay()}, {profile?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1 animate-fade-in stagger-1">
            Welcome to AI Studio - Build powerful AI solutions
          </p>
        </div>
        <div className="flex items-center space-x-3 animate-fade-in stagger-2">
          <Badge variant="outline" className="text-sm hover-scale">
            {subscription?.subscription_tier || 'Free'} Plan
          </Badge>
          {subscription?.subscribed && (
            <Badge variant="default" className="text-sm hover-scale animate-pulse-glow">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up stagger-3">
        <Card className="border-l-4 border-l-primary hover-scale hover-glow animate-fade-in stagger-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your GPTs</CardTitle>
            <Bot className="h-4 w-4 text-primary animate-bounce-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary animate-glow">{gptStats.totalGPTs}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {gptStats.activeGPTs} active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover-scale hover-glow animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 animate-glow">{gptStats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover-scale hover-glow animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 animate-glow">{gptStats.avgSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">
              Average rating
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover-scale hover-glow animate-fade-in stagger-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Remaining</CardTitle>
            <Zap className="h-4 w-4 text-purple-500 animate-bounce-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 animate-glow">
              {remainingCredits || (credits?.credits_limit || 0) - (credits?.credits_used || 0)}
            </div>
            <div className="mt-2">
              <Progress value={100 - (usagePercentage || 0)} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(100 - (usagePercentage || 0))}% remaining
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-fade-in-up stagger-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 animate-glow">
            <Zap className="h-5 w-5 text-primary" />
            <span>Quick Actions</span>
          </CardTitle>
          <CardDescription>
            Get started building AI solutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 flex-col space-y-2 hover-scale hover-glow transition-all duration-300 animate-fade-in ${
                  action.featured ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 animate-pulse-glow' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={action.action}
              >
                <div className={`p-2 rounded-full ${action.color} animate-float`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <div className={`font-medium ${action.featured ? 'text-primary animate-glow' : ''}`}>{action.title}</div>
                  <div className="text-xs text-muted-foreground">
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

        {/* Vanguard CTA */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Ultrium Vanguard</span>
            </CardTitle>
            <CardDescription>
              Enterprise cybersecurity platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our all-in-one AI-powered cybersecurity operations platform with:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                XDR/EDR threat detection
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI-powered service desk with ticketing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Network scanning & penetration testing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Compliance monitoring & reporting
              </li>
            </ul>
            <Button 
              className="w-full mt-4"
              onClick={() => window.location.href = 'https://vanguard.ultriumai.com'}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Explore Vanguard
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
