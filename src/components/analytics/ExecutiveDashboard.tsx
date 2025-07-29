import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ExecutiveDashboardProps {
  timeRange: string;
}

export const ExecutiveDashboard = ({ timeRange }: ExecutiveDashboardProps) => {
  // Mock data - would come from API based on timeRange
  const revenueData = [
    { month: 'Jan', revenue: 85000, target: 80000 },
    { month: 'Feb', revenue: 92000, target: 85000 },
    { month: 'Mar', revenue: 88000, target: 90000 },
    { month: 'Apr', revenue: 105000, target: 95000 },
    { month: 'May', revenue: 118000, target: 100000 },
    { month: 'Jun', revenue: 125000, target: 110000 }
  ];

  const clientSegmentData = [
    { name: 'MSP Clients', value: 45, color: '#8884d8' },
    { name: 'Direct SMBs', value: 30, color: '#82ca9d' },
    { name: 'Enterprise', value: 20, color: '#ffc658' },
    { name: 'Internal Depts', value: 5, color: '#ff7300' }
  ];

  const kpiData = [
    {
      title: 'Monthly Recurring Revenue',
      value: '$125,400',
      change: '+12.5%',
      trend: 'up',
      target: '$130,000',
      progress: 96.5
    },
    {
      title: 'Client Retention Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      target: '95%',
      progress: 99.2
    },
    {
      title: 'Average Deal Size',
      value: '$4,850',
      change: '-3.2%',
      trend: 'down',
      target: '$5,000',
      progress: 97.0
    },
    {
      title: 'Customer Satisfaction',
      value: '4.7/5',
      change: '+0.3',
      trend: 'up',
      target: '4.8/5',
      progress: 97.9
    }
  ];

  const alerts = [
    {
      type: 'warning',
      title: 'High Churn Risk',
      message: '3 clients showing increased support tickets',
      action: 'Review accounts'
    },
    {
      type: 'success',
      title: 'Revenue Target',
      message: 'Q2 target achieved 2 weeks early',
      action: 'View details'
    },
    {
      type: 'info',
      title: 'New Opportunities',
      message: '12 prospects in pipeline worth $240K',
      action: 'Review pipeline'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="animate-fade-in">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  <div className={`flex items-center text-sm ${
                    kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Target: {kpi.target}</span>
                    <span>{kpi.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={kpi.progress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue vs Target
            </CardTitle>
            <CardDescription>Monthly performance against targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString()}`, 
                      name === 'revenue' ? 'Revenue' : 'Target'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#94a3b8" 
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    dot={{ fill: '#94a3b8', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Client Segment Distribution */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Client Segment Distribution
            </CardTitle>
            <CardDescription>Revenue breakdown by customer type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientSegmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {clientSegmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Alerts */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Executive Alerts
          </CardTitle>
          <CardDescription>Key items requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-1">
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {alert.type === 'info' && <Clock className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.title}</h4>
                    <Badge variant={
                      alert.type === 'warning' ? 'destructive' :
                      alert.type === 'success' ? 'default' : 'secondary'
                    }>
                      {alert.action}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};