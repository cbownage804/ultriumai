import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Users, Calendar, RefreshCw, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface RevenueData {
  id: string;
  period_start: string;
  period_end: string;
  mrr: number;
  arr: number;
  new_customers: number;
  churned_customers: number;
  churn_rate: number;
  ltv: number;
  conversion_rate: number;
  total_revenue: number;
  created_at: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const RevenueAnalyticsDashboard = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30days');
  const [currentMetrics, setCurrentMetrics] = useState({
    mrr: 0,
    arr: 0,
    totalRevenue: 0,
    churnRate: 0,
    ltv: 0,
    conversionRate: 0
  });
  const { toast } = useToast();

  const timeRanges = [
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '1year', label: 'Last Year' }
  ];

  const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7days':
        return { start: subDays(now, 7), end: now };
      case '30days':
        return { start: subDays(now, 30), end: now };
      case '3months':
        return { start: subDays(now, 90), end: now };
      case '6months':
        return { start: subDays(now, 180), end: now };
      case '1year':
        return { start: subDays(now, 365), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange(timeRange);

      const { data, error } = await supabase
        .from('revenue_analytics')
        .select('*')
        .gte('period_start', format(start, 'yyyy-MM-dd'))
        .lte('period_end', format(end, 'yyyy-MM-dd'))
        .order('period_start', { ascending: true });

      if (error) throw error;

      setRevenueData(data || []);

      // Calculate current metrics from latest data
      if (data && data.length > 0) {
        const latest = data[data.length - 1];
        setCurrentMetrics({
          mrr: latest.mrr,
          arr: latest.arr,
          totalRevenue: data.reduce((sum, item) => sum + item.total_revenue, 0),
          churnRate: latest.churn_rate,
          ltv: latest.ltv,
          conversionRate: latest.conversion_rate
        });
      }

    } catch (error: any) {
      toast({
        title: "Error fetching revenue data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = async () => {
    try {
      const sampleData = [];
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = subDays(now, i);
        const periodStart = format(date, 'yyyy-MM-dd');
        const periodEnd = format(date, 'yyyy-MM-dd');
        
        const baseRevenue = 10000 + Math.random() * 5000;
        const newCustomers = Math.floor(Math.random() * 50) + 10;
        const churnedCustomers = Math.floor(Math.random() * 10) + 1;
        
        sampleData.push({
          period_start: periodStart,
          period_end: periodEnd,
          mrr: baseRevenue,
          arr: baseRevenue * 12,
          new_customers: newCustomers,
          churned_customers: churnedCustomers,
          churn_rate: (churnedCustomers / (newCustomers + churnedCustomers)) * 100,
          ltv: baseRevenue * 3.5,
          conversion_rate: Math.random() * 10 + 5,
          total_revenue: baseRevenue + (Math.random() * 2000)
        });
      }

      const { error } = await supabase
        .from('revenue_analytics')
        .insert(sampleData);

      if (error) throw error;

      toast({
        title: "Sample data generated",
        description: "Revenue analytics sample data has been created",
      });

      fetchRevenueData();
    } catch (error: any) {
      toast({
        title: "Error generating sample data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportData = async () => {
    try {
      const csv = [
        ['Date', 'MRR', 'ARR', 'Total Revenue', 'New Customers', 'Churned Customers', 'Churn Rate', 'LTV', 'Conversion Rate'].join(','),
        ...revenueData.map(item => [
          item.period_start,
          item.mrr,
          item.arr,
          item.total_revenue,
          item.new_customers,
          item.churned_customers,
          item.churn_rate,
          item.ltv,
          item.conversion_rate
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Revenue analytics exported to CSV",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Revenue Analytics</h2>
          <p className="text-muted-foreground">Track MRR, churn, LTV and revenue metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={fetchRevenueData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {revenueData.length === 0 && (
            <Button
              onClick={generateSampleData}
              variant="outline"
              size="sm"
            >
              Generate Sample Data
            </Button>
          )}
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
            disabled={revenueData.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMetrics.mrr)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMetrics.arr)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMetrics.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churn Rate</p>
                <p className="text-2xl font-bold">{currentMetrics.churnRate.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">LTV</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMetrics.ltv)}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversion</p>
                <p className="text-2xl font-bold">{currentMetrics.conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly Recurring Revenue and Total Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period_start" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Area 
                  type="monotone" 
                  dataKey="mrr" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="MRR"
                />
                <Area 
                  type="monotone" 
                  dataKey="total_revenue" 
                  stackId="1" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.6}
                  name="Total Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Metrics</CardTitle>
            <CardDescription>New customers vs. Churned customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period_start" 
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Bar dataKey="new_customers" fill="#10b981" name="New Customers" />
                <Bar dataKey="churned_customers" fill="#ef4444" name="Churned Customers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {loading && revenueData.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && revenueData.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No revenue data available</h3>
            <p className="text-muted-foreground mb-4">
              Start by generating sample data or integrate with your payment system
            </p>
            <Button onClick={generateSampleData}>
              Generate Sample Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};