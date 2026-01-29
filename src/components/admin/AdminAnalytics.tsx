import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Bot, CreditCard, Activity, Database } from 'lucide-react';
import { devLog } from '@/lib/logger';

export const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    gptUsage: [],
    revenue: [],
    accountTypes: [],
    dailyActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      devLog.log('Starting admin analytics fetch...');
      
      // Check authentication first
      const { data: { user } } = await supabase.auth.getUser();
      devLog.log('Current user:', user?.email);
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeRange));

      devLog.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

      const [
        usersRes,
        gptsRes,
        subscriptionsRes,
        analyticsRes
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at, account_type')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('custom_gpts')
          .select('created_at, sharing_level, ai_model')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('subscribers')
          .select('created_at, subscription_tier, subscribed')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('gpt_analytics')
          .select('created_at, interaction_type, tokens_used')
          .gte('created_at', startDate.toISOString())
      ]);

      devLog.log('Query results:', {
        users: { data: usersRes.data?.length, error: usersRes.error?.message },
        gpts: { data: gptsRes.data?.length, error: gptsRes.error?.message },
        subscriptions: { data: subscriptionsRes.data?.length, error: subscriptionsRes.error?.message },
        analytics: { data: analyticsRes.data?.length, error: analyticsRes.error?.message }
      });

      if (usersRes.error) throw new Error(`Users query failed: ${usersRes.error.message}`);
      if (gptsRes.error) throw new Error(`GPTs query failed: ${gptsRes.error.message}`);
      if (subscriptionsRes.error) throw new Error(`Subscriptions query failed: ${subscriptionsRes.error.message}`);
      if (analyticsRes.error) throw new Error(`Analytics query failed: ${analyticsRes.error.message}`);

      // Process user growth data
      const userGrowthData = processTimeSeriesData(usersRes.data, 'created_at');
      
      // Process GPT usage data
      const gptUsageData = processGPTUsageData(analyticsRes.data);
      
      // Process revenue data
      const revenueData = processRevenueData(subscriptionsRes.data);
      
      // Process account types
      const accountTypeData = processAccountTypeData(usersRes.data);
      
      // Process daily activity
      const dailyActivityData = processDailyActivityData(analyticsRes.data);

      setAnalyticsData({
        userGrowth: userGrowthData,
        gptUsage: gptUsageData,
        revenue: revenueData,
        accountTypes: accountTypeData,
        dailyActivity: dailyActivityData
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = (data: any[], dateField: string) => {
    const groupedData: { [key: string]: number } = {};
    
    data.forEach(item => {
      const date = new Date(item[dateField]).toLocaleDateString();
      groupedData[date] = (groupedData[date] || 0) + 1;
    });

    return Object.entries(groupedData)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const processGPTUsageData = (data: any[]) => {
    const usageByType: { [key: string]: number } = {};
    
    data.forEach(item => {
      const type = item.interaction_type || 'unknown';
      usageByType[type] = (usageByType[type] || 0) + 1;
    });

    return Object.entries(usageByType)
      .map(([type, count]) => ({ type, count }));
  };

  const processRevenueData = (data: any[]) => {
    const monthlyPrices = { basic: 29, premium: 99, enterprise: 299 };
    const revenueByTier: { [key: string]: number } = {};
    
    data.filter(sub => sub.subscribed).forEach(sub => {
      const tier = sub.subscription_tier || 'basic';
      const revenue = monthlyPrices[tier as keyof typeof monthlyPrices] || 0;
      revenueByTier[tier] = (revenueByTier[tier] || 0) + revenue;
    });

    return Object.entries(revenueByTier)
      .map(([tier, revenue]) => ({ tier, revenue }));
  };

  const processAccountTypeData = (data: any[]) => {
    const typeStats: { [key: string]: number } = {};
    
    data.forEach(user => {
      const type = user.account_type || 'business';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });

    return Object.entries(typeStats)
      .map(([name, value]) => ({ name, value }));
  };

  const processDailyActivityData = (data: any[]) => {
    const dailyStats: { [key: string]: { interactions: number, tokens: number } } = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!dailyStats[date]) {
        dailyStats[date] = { interactions: 0, tokens: 0 };
      }
      dailyStats[date].interactions += 1;
      dailyStats[date].tokens += item.tokens_used || 0;
    });

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Platform Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive insights into platform performance and usage
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.userGrowth.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPT Interactions</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.gptUsage.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsData.revenue.reduce((sum, item) => sum + item.revenue, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.dailyActivity.reduce((sum, item) => sum + item.interactions, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GPT Usage by Type</CardTitle>
            <CardDescription>Breakdown of interaction types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.gptUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
            <CardDescription>Monthly recurring revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.revenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, value }) => `${tier}: $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {analyticsData.revenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Types</CardTitle>
            <CardDescription>Distribution of user account types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.accountTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.accountTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Activity</CardTitle>
          <CardDescription>Platform interactions and token usage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analyticsData.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="interactions" fill="#3b82f6" />
              <Line yAxisId="right" type="monotone" dataKey="tokens" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};