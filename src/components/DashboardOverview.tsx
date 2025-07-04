import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useCustomGPTs } from "@/hooks/useCustomGPTs";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserCredits } from "@/hooks/useUserCredits";
import { Bot, MessageSquare, Users, TrendingUp, Star, Zap, Clock, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardOverview = () => {
  const { user } = useAuth();
  const { gpts } = useCustomGPTs();
  const { subscription } = useSubscription();
  const { credits } = useUserCredits();
  const navigate = useNavigate();

  const activeGPTs = gpts.filter(gpt => gpt.is_active).length;
  const totalChats = gpts.reduce((sum, gpt) => sum + gpt.chat_count, 0);
  const creditsUsed = credits?.credits_used || 0;
  const creditsLimit = credits?.credits_limit || 100;
  const creditsPercentage = (creditsUsed / creditsLimit) * 100;

  const quickActions = [
    {
      title: "Create New GPT",
      description: "Build a custom AI assistant",
      icon: Bot,
      action: () => navigate("/dashboard/custom-gpts/build"),
      color: "bg-blue-500",
    },
    {
      title: "View Templates",
      description: "Browse GPT templates",
      icon: Star,
      action: () => navigate("/dashboard/templates"),
      color: "bg-purple-500",
    },
    {
      title: "Chat History",
      description: "View conversation history",
      icon: MessageSquare,
      action: () => navigate("/dashboard/history"),
      color: "bg-green-500",
    },
    {
      title: "Analytics",
      description: "View usage analytics",
      icon: TrendingUp,
      action: () => navigate("/dashboard/analytics"),
      color: "bg-orange-500",
    },
  ];

  const recentActivity = [
    { action: "Created GPT 'Customer Support Bot'", time: "2 hours ago", type: "create" },
    { action: "Deployed Marketing Assistant", time: "1 day ago", type: "deploy" },
    { action: "Updated Knowledge Base", time: "2 days ago", type: "update" },
    { action: "API key generated", time: "3 days ago", type: "api" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your AI assistants today.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active GPTs</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGPTs}</div>
            <p className="text-xs text-muted-foreground">
              {gpts.length - activeGPTs} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChats}</div>
            <p className="text-xs text-muted-foreground">
              Across all GPTs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsUsed}</div>
            <Progress value={creditsPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {creditsLimit - creditsUsed} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {subscription.subscription_tier || 'Free'}
            </div>
            <p className="text-xs text-muted-foreground">
              Plan status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex-col space-y-2"
                onClick={action.action}
              >
                <div className={`p-2 rounded-full ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent GPTs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Recent GPTs
            </CardTitle>
            <CardDescription>
              Your latest AI assistants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gpts.slice(0, 4).map((gpt) => (
                <div key={gpt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {gpt.logo_url ? (
                      <img src={gpt.logo_url} alt={gpt.name} className="w-8 h-8 rounded" />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: gpt.theme_color || '#3b82f6' }}
                      >
                        {gpt.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{gpt.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {gpt.chat_count} conversations
                      </p>
                    </div>
                  </div>
                  <Badge variant={gpt.is_active ? "default" : "secondary"}>
                    {gpt.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
              {gpts.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No GPTs Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first AI assistant to get started.
                  </p>
                  <Button onClick={() => navigate("/dashboard/custom-gpts/build")}>
                    Create Your First GPT
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest actions on your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className="p-1.5 rounded-full bg-muted">
                    {activity.type === 'create' && <Bot className="h-3 w-3" />}
                    {activity.type === 'deploy' && <TrendingUp className="h-3 w-3" />}
                    {activity.type === 'update' && <Database className="h-3 w-3" />}
                    {activity.type === 'api' && <Zap className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Prompts */}
      {subscription.subscription_tier === "free" && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Star className="h-5 w-5" />
              Upgrade to Premium
            </CardTitle>
            <CardDescription className="text-purple-600">
              Unlock advanced features and increased limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">10,000</div>
                <div className="text-sm text-purple-600">Credits per month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">Unlimited</div>
                <div className="text-sm text-purple-600">Custom GPTs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700">Priority</div>
                <div className="text-sm text-purple-600">Support</div>
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