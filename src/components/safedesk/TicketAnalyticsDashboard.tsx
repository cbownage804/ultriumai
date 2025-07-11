import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, TrendingDown, Clock, Target, Users, Zap, 
  AlertCircle, CheckCircle, Calendar, Download, RefreshCw,
  BarChart3, Activity, Award, Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  slaCompliance: number;
  aiResolvedPercentage: number;
  customerSatisfaction: number;
  activeAgents: number;
  trendData: any[];
  priorityDistribution: any[];
  categoryPerformance: any[];
  agentPerformance: any[];
  hourlyVolume: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const TicketAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const daysBack = parseInt(dateRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Fetch tickets data
      const { data: tickets, error } = await supabase
        .from('support_tickets')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process analytics data
      const totalTickets = tickets?.length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;
      const aiResolvedTickets = tickets?.filter(t => t.auto_resolved).length || 0;
      
      // Calculate average resolution time
      const resolvedWithTime = tickets?.filter(t => 
        (t.status === 'resolved' || t.status === 'closed') && t.resolution_time_minutes
      ) || [];
      const avgResolutionTime = resolvedWithTime.length > 0 
        ? resolvedWithTime.reduce((sum, t) => sum + (t.resolution_time_minutes || 0), 0) / resolvedWithTime.length
        : 0;

      // Generate trend data (simulated for demo)
      const trendData = Array.from({ length: daysBack }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (daysBack - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          tickets: Math.floor(Math.random() * 20) + 5,
          resolved: Math.floor(Math.random() * 15) + 3,
          aiResolved: Math.floor(Math.random() * 8) + 1
        };
      });

      // Priority distribution
      const priorityCount = { low: 0, medium: 0, high: 0, urgent: 0 };
      tickets?.forEach(ticket => {
        priorityCount[ticket.priority as keyof typeof priorityCount]++;
      });
      
      const priorityDistribution = Object.entries(priorityCount).map(([priority, count]) => ({
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        value: count,
        percentage: totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0
      }));

      // Category performance (simulated)
      const categoryPerformance = [
        { category: 'Hardware', tickets: 45, resolved: 42, avgTime: 180 },
        { category: 'Software', tickets: 67, resolved: 61, avgTime: 120 },
        { category: 'Network', tickets: 34, resolved: 30, avgTime: 240 },
        { category: 'Email', tickets: 23, resolved: 22, avgTime: 90 },
        { category: 'Security', tickets: 12, resolved: 11, avgTime: 300 }
      ];

      // Agent performance (simulated)
      const agentPerformance = [
        { agent: 'John Smith', tickets: 34, resolved: 32, satisfaction: 4.8, avgTime: 145 },
        { agent: 'Sarah Johnson', tickets: 28, resolved: 26, satisfaction: 4.9, avgTime: 132 },
        { agent: 'Mike Davis', tickets: 42, resolved: 39, satisfaction: 4.7, avgTime: 167 },
        { agent: 'Lisa Wang', tickets: 31, resolved: 29, satisfaction: 4.6, avgTime: 156 }
      ];

      // Hourly volume (simulated)
      const hourlyVolume = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        tickets: Math.floor(Math.random() * 15) + 2
      }));

      setAnalytics({
        totalTickets,
        resolvedTickets,
        avgResolutionTime: Math.round(avgResolutionTime),
        slaCompliance: 94, // Simulated
        aiResolvedPercentage: totalTickets > 0 ? Math.round((aiResolvedTickets / totalTickets) * 100) : 0,
        customerSatisfaction: 4.7, // Simulated
        activeAgents: 8, // Simulated
        trendData,
        priorityDistribution,
        categoryPerformance,
        agentPerformance,
        hourlyVolume
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    toast({
      title: "Exporting Report",
      description: `Generating ${format.toUpperCase()} report...`,
    });
    
    // Simulate export
    setTimeout(() => {
      toast({
        title: "Report Ready",
        description: `SafeDesk analytics report has been downloaded as ${format.toUpperCase()}`,
      });
    }, 2000);
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const resolutionRate = analytics.totalTickets > 0 
    ? Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            SafeDesk Analytics
          </h2>
          <p className="text-muted-foreground">
            Performance insights and operational metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last period
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.resolvedTickets} of {analytics.totalTickets} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Timer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.avgResolutionTime}m</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -8% improvement
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Resolution Rate</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.aiResolvedPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              AI-powered automation success
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.slaCompliance}%</div>
            <p className="text-xs text-muted-foreground">Meeting service level agreements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics.customerSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">Average rating from feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">Currently handling tickets</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="volume">Volume Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="tickets" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Total Tickets"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="resolved" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Resolved"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="aiResolved" 
                    stackId="3"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                    name="AI Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.priorityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.priorityDistribution.map((entry, index) => (
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
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tickets" fill="#3b82f6" name="Total Tickets" />
                    <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.agentPerformance.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{agent.agent}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{agent.tickets} tickets</span>
                        <span>{agent.resolved} resolved</span>
                        <span>{agent.avgTime}m avg</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {Math.round((agent.resolved / agent.tickets) * 100)}% resolved
                        </Badge>
                        <Badge variant="secondary">
                          ⭐ {agent.satisfaction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Ticket Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.hourlyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="tickets" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Tickets Created"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};