import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  Target,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  LineChart,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KPIMetric {
  name: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit?: string;
}

const COLORS = ['#22d3ee', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function AdvancedAnalyticsDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('kpis');
  const [tickets, setTickets] = useState<any[]>([]);
  const [prevTickets, setPrevTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const now = new Date();
      const weekAgo = subDays(now, 7);
      const twoWeeksAgo = subDays(now, 14);

      const [ticketRes, prevTicketRes, clientRes] = await Promise.all([
        supabase.from('tickets').select('*').eq('user_id', user.id).gte('created_at', weekAgo.toISOString()),
        supabase.from('tickets').select('*').eq('user_id', user.id).gte('created_at', twoWeeksAgo.toISOString()).lt('created_at', weekAgo.toISOString()),
        supabase.from('tickets').select('client_name, status, priority, created_at, resolved_at, sla_deadline').eq('user_id', user.id),
      ]);

      setTickets(ticketRes.data || []);
      setPrevTickets(prevTicketRes.data || []);
      setClients(clientRes.data || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis: KPIMetric[] = useMemo(() => {
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const prevResolved = prevTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const resolvedChange = prevResolved > 0 ? Math.round(((resolved - prevResolved) / prevResolved) * 100) : 0;

    // Avg resolution time (hours)
    const resolvedTickets = tickets.filter(t => t.resolved_at && t.created_at);
    const avgResMs = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => sum + (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()), 0) / resolvedTickets.length
      : 0;
    const avgResHours = avgResMs / (1000 * 60 * 60);

    const prevResolvedTickets = prevTickets.filter(t => t.resolved_at && t.created_at);
    const prevAvgMs = prevResolvedTickets.length > 0
      ? prevResolvedTickets.reduce((sum, t) => sum + (new Date(t.resolved_at).getTime() - new Date(t.created_at).getTime()), 0) / prevResolvedTickets.length
      : 0;
    const prevAvgH = prevAvgMs / (1000 * 60 * 60);
    const avgChange = prevAvgH > 0 ? Math.round(((avgResHours - prevAvgH) / prevAvgH) * 100) : 0;

    // SLA compliance
    const slaTickets = tickets.filter(t => t.sla_deadline);
    const slaMet = slaTickets.filter(t => {
      const resolvedAt = t.resolved_at ? new Date(t.resolved_at) : new Date();
      return resolvedAt <= new Date(t.sla_deadline);
    }).length;
    const slaRate = slaTickets.length > 0 ? Math.round((slaMet / slaTickets.length) * 100) : 100;

    const backlog = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const prevBacklog = prevTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const backlogChange = prevBacklog > 0 ? Math.round(((backlog - prevBacklog) / prevBacklog) * 100) : 0;

    return [
      { name: 'Tickets Resolved', value: resolved, change: Math.abs(resolvedChange), trend: resolvedChange >= 0 ? 'up' : 'down', target: Math.max(resolved, prevResolved) },
      { name: 'Avg Resolution Time', value: avgResHours > 0 ? `${avgResHours.toFixed(1)}h` : 'N/A', change: Math.abs(avgChange), trend: avgChange <= 0 ? 'down' : 'up' },
      { name: 'Total Tickets', value: tickets.length, change: prevTickets.length > 0 ? Math.abs(Math.round(((tickets.length - prevTickets.length) / prevTickets.length) * 100)) : 0, trend: 'stable' },
      { name: 'SLA Compliance', value: `${slaRate}%`, change: 0, trend: slaRate >= 90 ? 'up' : 'down', target: 95 },
      { name: 'Open Tickets', value: tickets.filter(t => t.status === 'open').length, change: 0, trend: 'stable' },
      { name: 'Ticket Backlog', value: backlog, change: Math.abs(backlogChange), trend: backlogChange <= 0 ? 'down' : 'up' },
    ];
  }, [tickets, prevTickets]);

  const weeklyTrend = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map(date => {
      const dayStr = format(date, 'yyyy-MM-dd');
      const dayTickets = clients.filter(t => t.created_at && format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr);
      const dayResolved = clients.filter(t => t.resolved_at && format(new Date(t.resolved_at), 'yyyy-MM-dd') === dayStr);
      return {
        date: format(date, 'EEE'),
        opened: dayTickets.length,
        resolved: dayResolved.length,
      };
    });
  }, [clients]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(t => {
      const cat = t.priority || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[i % COLORS.length],
    }));
  }, [clients]);

  const clientMetrics = useMemo(() => {
    const byClient: Record<string, any[]> = {};
    clients.forEach(t => {
      const name = t.client_name || 'Unassigned';
      if (!byClient[name]) byClient[name] = [];
      byClient[name].push(t);
    });
    return Object.entries(byClient)
      .map(([name, tix]) => {
        const resolved = tix.filter(t => t.status === 'resolved' || t.status === 'closed').length;
        const slaTickets = tix.filter(t => t.sla_deadline);
        const slaMet = slaTickets.filter(t => {
          const resolvedAt = t.resolved_at ? new Date(t.resolved_at) : new Date();
          return resolvedAt <= new Date(t.sla_deadline);
        }).length;
        return {
          name,
          tickets: tix.length,
          resolved,
          slaCompliance: slaTickets.length > 0 ? Math.round((slaMet / slaTickets.length) * 100) : 100,
        };
      })
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 10);
  }, [clients]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositive: boolean = true) => {
    if (trend === 'stable') return 'text-slate-400';
    if ((trend === 'up' && isPositive) || (trend === 'down' && !isPositive)) return 'text-green-500';
    return 'text-red-500';
  };

  const exportCSV = () => {
    const rows = clientMetrics.map(c => `"${c.name}","${c.tickets}","${c.resolved}","${c.slaCompliance}%"`);
    const csv = ['Client,Tickets,Resolved,SLA Compliance', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.name} className="bg-black/60 border-slate-700/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{kpi.name}</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white">{kpi.value}</span>
                {kpi.unit && <span className="text-muted-foreground">{kpi.unit}</span>}
              </div>
              <div className="flex items-center gap-1 mt-2">
                {getTrendIcon(kpi.trend)}
                <span className={cn("text-xs font-medium", getTrendColor(kpi.trend, kpi.name !== 'Ticket Backlog'))}>
                  {kpi.change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
              {kpi.target && (
                <Progress 
                  value={Math.min((parseFloat(String(kpi.value).replace(/[^0-9.]/g, '')) / kpi.target) * 100, 100)} 
                  className="h-1 mt-2" 
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="kpis">Trend Analysis</TabsTrigger>
            <TabsTrigger value="clients">Client Analytics</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <TabsContent value="kpis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-cyan-400" />
                  Weekly Ticket Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: '#fff' }} />
                      <Legend />
                      <Area type="monotone" dataKey="opened" stackId="1" stroke="#22d3ee" fill="#22d3ee40" name="Opened" />
                      <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b98140" name="Resolved" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Tickets by Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {categoryDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No ticket data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="mt-6">
          <Card className="bg-black/60 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-green-400" />
                Client Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientMetrics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientMetrics.map((client) => (
                    <Card key={client.name} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <p className="font-medium text-white mb-3">{client.name}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tickets</p>
                            <p className="text-lg font-bold text-white">{client.tickets}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Resolved</p>
                            <p className="text-lg font-bold text-green-400">{client.resolved}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">SLA Compliance</p>
                            <p className={cn("text-lg font-bold", client.slaCompliance >= 95 ? 'text-green-400' : client.slaCompliance >= 90 ? 'text-amber-400' : 'text-red-400')}>
                              {client.slaCompliance}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Resolution Rate</p>
                            <p className="text-lg font-bold text-cyan-400">
                              {client.tickets > 0 ? Math.round((client.resolved / client.tickets) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No client ticket data found. Create tickets with client names to see analytics here.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
