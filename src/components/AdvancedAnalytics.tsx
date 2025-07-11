import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Shield, AlertTriangle, TrendingUp, TrendingDown, 
  Activity, Users, Globe, Clock, Download,
  CheckCircle, XCircle, Eye, Zap
} from 'lucide-react';

interface SecurityMetrics {
  period: string;
  threats_detected: number;
  threats_blocked: number;
  false_positives: number;
  response_time: number;
  uptime: number;
}

interface ThreatCategory {
  name: string;
  count: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  color: string;
}

const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedView, setSelectedView] = useState('overview');

  // Sample data - in a real app, this would come from your API
  const securityMetrics: SecurityMetrics[] = [
    { period: 'Mon', threats_detected: 45, threats_blocked: 43, false_positives: 2, response_time: 1.2, uptime: 99.9 },
    { period: 'Tue', threats_detected: 52, threats_blocked: 50, false_positives: 2, response_time: 1.1, uptime: 99.8 },
    { period: 'Wed', threats_detected: 38, threats_blocked: 37, false_positives: 1, response_time: 0.9, uptime: 100 },
    { period: 'Thu', threats_detected: 61, threats_blocked: 58, false_positives: 3, response_time: 1.4, uptime: 99.7 },
    { period: 'Fri', threats_detected: 74, threats_blocked: 71, false_positives: 3, response_time: 1.3, uptime: 99.9 },
    { period: 'Sat', threats_detected: 29, threats_blocked: 28, false_positives: 1, response_time: 0.8, uptime: 100 },
    { period: 'Sun', threats_detected: 33, threats_blocked: 32, false_positives: 1, response_time: 0.9, uptime: 99.9 }
  ];

  const threatCategories: ThreatCategory[] = [
    { name: 'Malware', count: 145, severity: 'critical', color: '#ef4444' },
    { name: 'Phishing', count: 89, severity: 'high', color: '#f97316' },
    { name: 'Suspicious Activity', count: 67, severity: 'medium', color: '#eab308' },
    { name: 'Policy Violations', count: 43, severity: 'low', color: '#22c55e' },
    { name: 'Unauthorized Access', count: 31, severity: 'high', color: '#a855f7' }
  ];

  const performanceData = [
    { name: 'Detection Rate', value: 96.8, target: 95, status: 'excellent' },
    { name: 'Response Time', value: 1.1, target: 2.0, status: 'excellent', unit: 'min' },
    { name: 'False Positive Rate', value: 2.1, target: 5.0, status: 'good', unit: '%' },
    { name: 'System Uptime', value: 99.9, target: 99.5, status: 'excellent', unit: '%' },
    { name: 'User Satisfaction', value: 4.8, target: 4.0, status: 'excellent', unit: '/5' }
  ];

  const networkData = [
    { time: '00:00', traffic: 2400, threats: 5, blocked: 5 },
    { time: '04:00', traffic: 1800, threats: 3, blocked: 3 },
    { time: '08:00', traffic: 4200, threats: 12, blocked: 11 },
    { time: '12:00', traffic: 5800, threats: 18, blocked: 17 },
    { time: '16:00', traffic: 6200, threats: 22, blocked: 20 },
    { time: '20:00', traffic: 4800, threats: 14, blocked: 14 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-success';
      case 'good': return 'text-warning';
      case 'poor': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'good': return <Activity className="h-4 w-4 text-warning" />;
      case 'poor': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Advanced Security Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your security posture and threat landscape
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">332</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-destructive" />
              +12% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">319</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">96.1% success rate</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.1<span className="text-sm font-normal">min</span></div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-success" />
              -18% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <Activity className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9<span className="text-sm font-normal">%</span></div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className="text-success">Excellent</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threat Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Threats Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Security Events Timeline</CardTitle>
                <CardDescription>Threats detected and blocked over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={securityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="threats_detected" 
                      stackId="1"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.6}
                      name="Detected"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="threats_blocked" 
                      stackId="2"
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.6}
                      name="Blocked"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Threat Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Threat Categories</CardTitle>
                <CardDescription>Distribution of detected threats by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={threatCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {threatCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Threat Detection Trends</CardTitle>
                <CardDescription>Daily threat detection patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={securityMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="threats_detected" fill="#ef4444" name="Detected" />
                    <Bar dataKey="threats_blocked" fill="#22c55e" name="Blocked" />
                    <Bar dataKey="false_positives" fill="#eab308" name="False Positives" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Threats</CardTitle>
                <CardDescription>Most common threat types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {threatCategories.map((threat, index) => (
                    <div key={threat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: threat.color }}
                        />
                        <div>
                          <p className="font-medium">{threat.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">{threat.severity}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{threat.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.map((metric, index) => (
              <Card key={metric.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  {getStatusIcon(metric.status)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {metric.value}{metric.unit && <span className="text-sm font-normal">{metric.unit}</span>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Target: {metric.target}{metric.unit}</span>
                    <span className={getStatusColor(metric.status)}>{metric.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>Average response time over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={securityMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="response_time" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Response Time (min)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Traffic & Threats</CardTitle>
              <CardDescription>Network activity and threat correlation throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="traffic" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                    name="Network Traffic"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="threats" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Threats Detected"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="blocked" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Threats Blocked"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;