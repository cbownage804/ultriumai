import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  DollarSign, Users, Shield, TrendingUp, AlertTriangle, 
  FileText, Download, Calendar, Target, Activity 
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ReportMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  activeClients: number;
  securityScore: number;
  resolvedTickets: number;
  avgResponseTime: number;
}

interface ChartData {
  name: string;
  revenue: number;
  clients: number;
  tickets: number;
  security: number;
}

const MSPReportingDashboard = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalRevenue: 245000,
    monthlyGrowth: 12.5,
    activeClients: 28,
    securityScore: 87,
    resolvedTickets: 156,
    avgResponseTime: 2.4
  });

  const [revenueData] = useState<ChartData[]>([
    { name: 'Jan', revenue: 185000, clients: 22, tickets: 89, security: 82 },
    { name: 'Feb', revenue: 195000, clients: 24, tickets: 104, security: 84 },
    { name: 'Mar', revenue: 210000, clients: 25, tickets: 118, security: 85 },
    { name: 'Apr', revenue: 225000, clients: 26, tickets: 132, security: 86 },
    { name: 'May', revenue: 235000, clients: 27, tickets: 145, security: 87 },
    { name: 'Jun', revenue: 245000, clients: 28, tickets: 156, security: 87 }
  ]);

  const [clientData] = useState([
    { name: 'Enterprise', value: 45, count: 5 },
    { name: 'Mid-Market', value: 35, count: 8 },
    { name: 'Small Business', value: 20, count: 15 }
  ]);

  const [securityData] = useState([
    { name: 'Critical', value: 5, color: '#ef4444' },
    { name: 'High', value: 12, color: '#f97316' },
    { name: 'Medium', value: 23, color: '#eab308' },
    { name: 'Low', value: 35, color: '#22c55e' },
    { name: 'Resolved', value: 25, color: '#3b82f6' }
  ]);

  const exportReport = (type: 'pdf' | 'excel') => {
    toast({
      title: "Report Export",
      description: `${type.toUpperCase()} report is being generated and will be available for download shortly.`,
    });
  };

  const generateCustomReport = () => {
    toast({
      title: "Custom Report",
      description: "Custom report generation started. You'll receive an email when it's ready.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reporting Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for your MSP business
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={generateCustomReport}>
            <Download className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{metrics.monthlyGrowth}%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                <p className="text-2xl font-bold">{metrics.activeClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">85% retention rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Security Score</p>
                <p className="text-2xl font-bold">{metrics.securityScore}/100</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Badge variant="default" className="text-xs">Excellent</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved Tickets</p>
                <p className="text-2xl font-bold">{metrics.resolvedTickets}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600">96%</span>
              <span className="text-muted-foreground ml-1">satisfaction</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}h</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">Under SLA</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">3 Critical</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="client">Client Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Distribution by Tier</CardTitle>
                <CardDescription>Revenue breakdown by client type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={clientData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {clientData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 120}, 70%, 50%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Resolution Trends</CardTitle>
                <CardDescription>Monthly ticket resolution performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tickets" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Growth</CardTitle>
                <CardDescription>Active client count over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="clients" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Posture</CardTitle>
                <CardDescription>Overall security score trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[75, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="security" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Threat Distribution</CardTitle>
                <CardDescription>Breakdown of security threats by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={securityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {securityData.map((entry, index) => (
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

        <TabsContent value="client" className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Performance Matrix</CardTitle>
                <CardDescription>Individual client metrics and performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'TechCorp Solutions', revenue: '$45,000', growth: '+15%', satisfaction: '98%', tickets: 12, risk: 'Low' },
                    { name: 'Digital Dynamics', revenue: '$32,000', growth: '+8%', satisfaction: '95%', tickets: 18, risk: 'Low' },
                    { name: 'Cloud Innovations', revenue: '$28,500', growth: '-2%', satisfaction: '89%', tickets: 25, risk: 'Medium' },
                    { name: 'Data Systems Inc', revenue: '$41,000', growth: '+22%', satisfaction: '97%', tickets: 8, risk: 'Low' },
                    { name: 'Global Networks', revenue: '$38,750', growth: '+11%', satisfaction: '93%', tickets: 15, risk: 'Low' },
                  ].map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold">{client.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Revenue: {client.revenue}</span>
                          <span>Growth: <span className={client.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}>{client.growth}</span></span>
                          <span>Satisfaction: {client.satisfaction}</span>
                          <span>Open Tickets: {client.tickets}</span>
                        </div>
                      </div>
                      <Badge variant={client.risk === 'Low' ? 'default' : client.risk === 'Medium' ? 'secondary' : 'destructive'}>
                        {client.risk} Risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MSPReportingDashboard;