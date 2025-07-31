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
import { 
  Shield, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Lock,
  Mail,
  Globe,
  Database,
  Zap,
  Bot,
  MessageSquare,
  Star,
  Activity,
  Search,
  FileText,
  Settings,
  BarChart3,
  Scan
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const DashboardOverview = () => {
  const { user } = useAuth();
  const { profile, credits, subscription, loading } = useUserProfile();
  const { remainingCredits, usagePercentage } = useUserCredits();
  const navigate = useNavigate();

  if (loading) {
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

  const securityScore = 85; // Mock data - will be calculated from real security metrics
  const threatsBlocked = 147; // Mock data
  const activeScans = 3; // Mock data

  const quickActions = [
    {
      title: "AI Security Assistant",
      description: "Voice-enabled security guidance",
      icon: Brain,
      action: () => navigate("/dashboard/voice-assistant"),
      color: "bg-primary",
      featured: true,
    },
    {
      title: "Run Security Scan",
      description: "Comprehensive security audit",
      icon: Scan,
      action: () => navigate("/dashboard/safescan"),
      color: "bg-secondary",
      featured: true,
    },
    {
      title: "SafePass Manager",
      description: "Manage passwords securely",
      icon: Lock,
      action: () => navigate("/dashboard/safepass"),
      color: "bg-blue-500",
    },
    {
      title: "Email Security",
      description: "Monitor email threats",
      icon: Mail,
      action: () => navigate("/dashboard/safemail"),
      color: "bg-green-500",
    },
    {
      title: "Network Monitor",
      description: "Network security status",
      icon: Globe,
      action: () => navigate("/dashboard/safenet"),
      color: "bg-purple-500",
    },
    {
      title: "UltriumGPT",
      description: "AI security assistant",
      icon: Bot,
      action: () => navigate("/dashboard/ultrium-gpt"),
      color: "bg-orange-500",
    },
    {
      title: "Security Settings",
      description: "Configure security",
      icon: Settings,
      action: () => navigate("/dashboard/security"),
      color: "bg-red-500",
    },
  ];

  const recentActivity = [
    { action: "Security scan completed", time: "2 hours ago", type: "scan", status: "success" },
    { action: "Password breach detected", time: "1 day ago", type: "breach", status: "warning" },
    { action: "Email threat blocked", time: "2 days ago", type: "block", status: "success" },
    { action: "Network device discovered", time: "3 days ago", type: "discovery", status: "info" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-glow">
            Good {getTimeOfDay()}, {profile?.full_name || user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1 animate-fade-in stagger-1">
            Welcome to your UltriumAI security dashboard
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
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-primary animate-bounce-gentle" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary animate-glow">{securityScore}/100</div>
            <div className="mt-2">
              <Progress value={securityScore} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +5 from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover-scale hover-glow animate-fade-in stagger-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 animate-glow">{threatsBlocked}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover-scale hover-glow animate-fade-in stagger-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 animate-glow">{activeScans}</div>
            <p className="text-xs text-muted-foreground">
              Running now
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

      {/* Security Services Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Services</span>
            </CardTitle>
            <CardDescription>
              Overview of your active security tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Lock className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">SafePass</h3>
                  <p className="text-sm text-muted-foreground">Password Manager</p>
                </div>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">SafeMail</h3>
                  <p className="text-sm text-muted-foreground">Email Security</p>
                </div>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Globe className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">SafeWeb</h3>
                  <p className="text-sm text-muted-foreground">Web Protection</p>
                </div>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">SafeNet</h3>
                  <p className="text-sm text-muted-foreground">Network Security</p>
                </div>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>
              Latest security events and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className={`h-5 w-5 mt-0.5 ${
                  activity.status === 'success' ? 'text-green-500' :
                  activity.status === 'warning' ? 'text-yellow-500' :
                  activity.status === 'error' ? 'text-red-500' : 'text-blue-500'
                }`}>
                  {activity.status === 'success' && <CheckCircle className="h-5 w-5" />}
                  {activity.status === 'warning' && <AlertTriangle className="h-5 w-5" />}
                  {activity.status === 'info' && <Activity className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
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
            Common security tasks and operations
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
              Upgrade to Premium
            </CardTitle>
            <CardDescription className="text-purple-600 dark:text-purple-400">
              Unlock advanced security features and increased limits
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
                <div className="text-sm text-purple-600 dark:text-purple-400">Security Scans</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">Advanced</div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Security Tools</div>
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