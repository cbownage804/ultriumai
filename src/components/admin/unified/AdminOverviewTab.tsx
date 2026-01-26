import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  Activity,
  Shield,
  Sparkles,
  Zap
} from 'lucide-react';

interface OverviewStats {
  totalUsers: number;
  aiStudioUsers: number;
  safeSuiteUsers: number;
  vanguardUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
}

export const AdminOverviewTab = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    aiStudioUsers: 0,
    safeSuiteUsers: 0,
    vanguardUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewStats();
  }, []);

  const loadOverviewStats = async () => {
    try {
      // Get total profiles
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get AI Studio subscribers
      const { count: aiStudioCount } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('subscribed', true);

      // Get SafeSuite subscriptions
      const { count: safeSuiteCount } = await supabase
        .from('safesuite_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'trialing']);

      // Get Vanguard subscriptions
      const { count: vanguardCount } = await supabase
        .from('vanguard_subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'manual']);

      setStats({
        totalUsers: profileCount || 0,
        aiStudioUsers: aiStudioCount || 0,
        safeSuiteUsers: safeSuiteCount || 0,
        vanguardUsers: vanguardCount || 0,
        totalRevenue: 0, // Would need Stripe integration
        activeSubscriptions: (aiStudioCount || 0) + (safeSuiteCount || 0) + (vanguardCount || 0)
      });
    } catch (error) {
      console.error('Error loading overview stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "All registered accounts",
      color: "text-blue-500"
    },
    {
      title: "AI Studio",
      value: stats.aiStudioUsers,
      icon: Sparkles,
      description: "Active subscribers",
      color: "text-purple-500"
    },
    {
      title: "SafeSuite",
      value: stats.safeSuiteUsers,
      icon: Shield,
      description: "Active subscribers",
      color: "text-emerald-500"
    },
    {
      title: "Vanguard",
      value: stats.vanguardUsers,
      icon: Zap,
      description: "Active subscribers",
      color: "text-amber-500"
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      description: "Across all products",
      color: "text-cyan-500"
    },
    {
      title: "System Status",
      value: "Healthy",
      icon: Activity,
      description: "All systems operational",
      color: "text-green-500",
      isStatus: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <p className="text-muted-foreground">Unified view of all UltriumAI products</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stat.isStatus ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {stat.value}
                  </Badge>
                ) : (
                  stat.value.toLocaleString()
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <Users className="h-4 w-4" />
                View All Users
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage user accounts across products
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <CreditCard className="h-4 w-4" />
                Subscription Reports
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                View revenue and subscription metrics
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <Building2 className="h-4 w-4" />
                MSP Management
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Manage MSP partners and clients
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
