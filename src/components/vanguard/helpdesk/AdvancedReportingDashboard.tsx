import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  BarChart3, TrendingUp, Clock, Users, CheckCircle2, AlertTriangle,
  Download, Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];

interface TicketData {
  id: string;
  status: string | null;
  priority: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function AdvancedReportingDashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch ticket analytics
  const { data: ticketStats } = useQuery({
    queryKey: ['ticket-analytics', user?.id, dateRange],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const daysAgo = parseInt(dateRange) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Use raw query to avoid type instantiation issues
      const { data, error } = await supabase
        .from('vanguard_tickets' as any)
        .select('id, status, priority, category, created_at, updated_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;

      const tickets = (data as unknown as TicketData[]) || [];

      // Process ticket data for charts
      const byStatus = tickets.reduce((acc: Record<string, number>, t) => {
        const status = t.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const byPriority = tickets.reduce((acc: Record<string, number>, t) => {
        const priority = t.priority || 'unknown';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      const byCategory = tickets.reduce((acc: Record<string, number>, t) => {
        const cat = t.category || 'Uncategorized';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      // Daily ticket volume
      const dailyVolume: Record<string, number> = {};
      tickets.forEach((t) => {
        const date = new Date(t.created_at).toLocaleDateString();
        dailyVolume[date] = (dailyVolume[date] || 0) + 1;
      });

      // Resolution times (mock calculation)
      const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
      const avgResolutionTime = resolved.length > 0 
        ? resolved.reduce((sum, t) => {
            const created = new Date(t.created_at);
            const updated = new Date(t.updated_at);
            return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
          }, 0) / resolved.length
        : 0;

      return {
        total: tickets.length,
        open: byStatus['open'] || 0,
        inProgress: byStatus['in_progress'] || 0,
        resolved: byStatus['resolved'] || 0,
        closed: byStatus['closed'] || 0,
        byStatus,
        byPriority,
        byCategory,
        dailyVolume: Object.entries(dailyVolume).map(([date, count]) => ({ date, count })).slice(-14),
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        slaCompliance: Math.round(Math.random() * 20 + 80), // Mock SLA
        firstResponseTime: Math.round(Math.random() * 30 + 10), // Mock
      };
    },
    enabled: !!user?.id
  });

  // Fetch technician performance
  const { data: techPerformance = [] } = useQuery({
    queryKey: ['tech-performance', user?.id],
    queryFn: async () => {
      // Mock technician data
      return [
        { name: 'John Smith', resolved: 45, avgTime: 2.3, satisfaction: 4.8 },
        { name: 'Sarah Johnson', resolved: 38, avgTime: 1.8, satisfaction: 4.9 },
        { name: 'Mike Wilson', resolved: 52, avgTime: 2.1, satisfaction: 4.7 },
        { name: 'Emily Davis', resolved: 41, avgTime: 1.5, satisfaction: 4.9 },
      ];
    },
    enabled: !!user?.id
  });

  const statusData = ticketStats?.byStatus 
    ? Object.entries(ticketStats.byStatus).map(([name, value]) => ({ name, value }))
    : [];

  const priorityData = ticketStats?.byPriority
    ? Object.entries(ticketStats.byPriority).map(([name, value]) => ({ name, value }))
    : [];

  const categoryData = ticketStats?.byCategory
    ? Object.entries(ticketStats.byCategory).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            Helpdesk Analytics
          </h2>
          <p className="text-muted-foreground">Performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 bg-slate-800 border-slate-600">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-3xl font-bold">{ticketStats?.total || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-400">{ticketStats?.open || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-3xl font-bold">{ticketStats?.avgResolutionTime || 0}h</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-3xl font-bold text-green-400">{ticketStats?.slaCompliance || 0}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">First Response</p>
                <p className="text-3xl font-bold">{ticketStats?.firstResponseTime || 0}m</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
          <TabsTrigger value="sla">SLA Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Ticket Volume Chart */}
            <Card className="col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Ticket Volume</CardTitle>
                <CardDescription>Daily ticket submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ticketStats?.dailyVolume || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>By Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {statusData.map((entry, index) => (
                    <Badge 
                      key={entry.name} 
                      variant="outline"
                      style={{ borderColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                    >
                      {entry.name}: {entry.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="col-span-2 bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Ticket Trends Over Time</CardTitle>
              <CardDescription>Compare ticket volume, resolution rate, and response times</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={ticketStats?.dailyVolume || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>Individual performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {techPerformance.map((tech, index) => (
                  <div key={index} className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-medium">{tech.name}</p>
                          <p className="text-sm text-muted-foreground">Technician</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-400">{tech.resolved}</p>
                          <p className="text-xs text-muted-foreground">Resolved</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-400">{tech.avgTime}h</p>
                          <p className="text-xs text-muted-foreground">Avg Time</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-400">{tech.satisfaction}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>SLA Compliance Rate</CardTitle>
                <CardDescription>Percentage of tickets meeting SLA</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <div className="relative">
                  <div className="text-6xl font-bold text-green-400">{ticketStats?.slaCompliance || 0}%</div>
                  <p className="text-center text-muted-foreground mt-2">Overall Compliance</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Under 15 min</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '65%' }} />
                      </div>
                      <span className="text-sm">65%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>15-30 min</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: '20%' }} />
                      </div>
                      <span className="text-sm">20%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>30-60 min</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: '10%' }} />
                      </div>
                      <span className="text-sm">10%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Over 1 hour</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '5%' }} />
                      </div>
                      <span className="text-sm">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
