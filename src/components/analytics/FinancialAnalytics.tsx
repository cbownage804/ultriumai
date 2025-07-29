import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard,
  PieChart,
  BarChart3,
  Calendar,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface FinancialAnalyticsProps {
  timeRange: string;
}

export const FinancialAnalytics = ({ timeRange }: FinancialAnalyticsProps) => {
  // Mock financial data
  const revenueBreakdown = [
    { category: 'MSP Services', amount: 450000, percentage: 65 },
    { category: 'Direct IT Support', amount: 180000, percentage: 26 },
    { category: 'Software Licenses', amount: 45000, percentage: 6.5 },
    { category: 'Hardware Sales', amount: 17500, percentage: 2.5 }
  ];

  const monthlyTrends = [
    { month: 'Jan', revenue: 85000, expenses: 62000, profit: 23000, margin: 27.1 },
    { month: 'Feb', revenue: 92000, expenses: 65000, profit: 27000, margin: 29.3 },
    { month: 'Mar', revenue: 88000, expenses: 64000, profit: 24000, margin: 27.3 },
    { month: 'Apr', revenue: 105000, expenses: 70000, profit: 35000, margin: 33.3 },
    { month: 'May', revenue: 118000, expenses: 78000, profit: 40000, margin: 33.9 },
    { month: 'Jun', revenue: 125000, expenses: 82000, profit: 43000, margin: 34.4 }
  ];

  const expenseCategories = [
    { name: 'Personnel', value: 320000, color: '#8884d8' },
    { name: 'Software & Tools', value: 85000, color: '#82ca9d' },
    { name: 'Infrastructure', value: 45000, color: '#ffc658' },
    { name: 'Marketing', value: 25000, color: '#ff7300' },
    { name: 'Other', value: 15000, color: '#8dd1e1' }
  ];

  const cashFlow = [
    { week: 'W1', inflow: 85000, outflow: 65000, net: 20000 },
    { week: 'W2', inflow: 92000, outflow: 70000, net: 22000 },
    { week: 'W3', inflow: 78000, outflow: 68000, net: 10000 },
    { week: 'W4', inflow: 105000, outflow: 72000, net: 33000 }
  ];

  const financialMetrics = [
    {
      title: 'Gross Revenue',
      value: '$692,500',
      change: '+15.2%',
      trend: 'up',
      description: 'Total revenue this period'
    },
    {
      title: 'Net Profit Margin',
      value: '31.8%',
      change: '+2.1%',
      trend: 'up',
      description: 'Profit margin trend'
    },
    {
      title: 'Operating Expenses',
      value: '$490,000',
      change: '+8.5%',
      trend: 'up',
      description: 'Total operational costs'
    },
    {
      title: 'EBITDA',
      value: '$202,500',
      change: '+18.7%',
      trend: 'up',
      description: 'Earnings before tax'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialMetrics.map((metric, index) => (
          <Card key={index} className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className={`flex items-center text-sm ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {metric.change}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Profit Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue & Profit Trends
            </CardTitle>
            <CardDescription>Monthly revenue, expenses, and profit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString()}`, 
                      typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" name="revenue" />
                  <Bar dataKey="expenses" fill="#ef4444" name="expenses" />
                  <Bar dataKey="profit" fill="#10b981" name="profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>Operating expense distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${(value/1000).toFixed(0)}K`}
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Analysis */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cash Flow Analysis
            </CardTitle>
            <CardDescription>Weekly cash inflow vs outflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString()}`, 
                      name === 'inflow' ? 'Cash Inflow' : 
                      name === 'outflow' ? 'Cash Outflow' : 'Net Cash Flow'
                    ]}
                  />
                  <Bar dataKey="inflow" fill="#10b981" />
                  <Bar dataKey="outflow" fill="#ef4444" />
                  <Line dataKey="net" stroke="#3b82f6" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>Revenue by service category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.category}</span>
                    <div className="text-right">
                      <div className="font-bold">${item.amount.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Actions */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Financial Planning
          </CardTitle>
          <CardDescription>Quick actions for financial management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="h-6 w-6 mb-2" />
              Budget Planning
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              Forecast Model
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <DollarSign className="h-6 w-6 mb-2" />
              Cost Analysis
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              Growth Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};