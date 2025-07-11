import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Lightbulb } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProfitAnalytics {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  revenue: number;
  costs: number;
  profit_margin: number;
  industry_benchmark: number;
  cost_breakdown: Record<string, number>;
  optimization_suggestions: string[];
}

interface MSPProfitAnalyticsProps {
  mspId: string;
}

export const MSPProfitAnalytics = ({ mspId }: MSPProfitAnalyticsProps) => {
  const [analytics, setAnalytics] = useState<ProfitAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load real analytics data from database when available
    setTimeout(() => {
      setAnalytics([]);
      setIsLoading(false);
    }, 1000);
  }, [mspId]);

  const totalRevenue = analytics.reduce((sum, item) => sum + item.revenue, 0);
  const totalCosts = analytics.reduce((sum, item) => sum + item.costs, 0);
  const avgProfitMargin = analytics.length > 0 ? 
    analytics.reduce((sum, item) => sum + item.profit_margin, 0) / analytics.length : 0;

  const marginTrendData = analytics.map((item, index) => ({
    period: `Period ${index + 1}`,
    margin: item.profit_margin,
    benchmark: item.industry_benchmark
  }));

  const costBreakdownData = analytics.length > 0 ? 
    Object.entries(analytics[0].cost_breakdown).map(([name, value]) => ({
      name,
      value,
      percentage: (value / analytics[0].costs * 100).toFixed(1)
    })) : [];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Profit Margin Analytics</h2>
          <p className="text-muted-foreground">
            Analyze profitability and optimize costs across all clients
          </p>
        </div>
        <Button>
          <Target className="w-4 h-4 mr-2" />
          Set Targets
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.length > 0 ? 'Based on client data' : 'No data available'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCosts.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {analytics.length > 0 ? 'Based on client data' : 'No data available'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgProfitMargin.toFixed(1)}%</div>
            <Progress value={avgProfitMargin} className="mt-2" />
            <div className="text-xs text-muted-foreground mt-1">
              Industry benchmark: 25%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.length > 0 ? '85/100' : 'N/A'}</div>
            <Badge variant="secondary" className="mt-2">
              {analytics.length > 0 ? 'Good' : 'No Data'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Margin Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Margin Trends</CardTitle>
              <CardDescription>
                Track your profit margins vs industry benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={marginTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Your Margin"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmark" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Industry Benchmark"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
                <CardDescription>
                  Breakdown of operational costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Categories</CardTitle>
                <CardDescription>
                  Detailed cost analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {costBreakdownData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">${item.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {analytics.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Client Optimization</span>
                    <Badge variant={item.profit_margin > item.industry_benchmark ? "default" : "secondary"}>
                      {item.profit_margin.toFixed(1)}% margin
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Revenue: ${item.revenue.toLocaleString()} | Costs: ${item.costs.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Optimization Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {item.optimization_suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className="w-full">
                      Implement Optimizations
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};