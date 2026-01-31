import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Filter,
  LineChart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState('kpis');
  
  // Sample data - in production would come from database
  const kpis: KPIMetric[] = [
    { name: 'Tickets Resolved', value: 156, change: 12, trend: 'up', target: 150 },
    { name: 'Avg Resolution Time', value: '4.2h', change: -15, trend: 'down' },
    { name: 'First Response Time', value: '22m', change: -8, trend: 'down' },
    { name: 'SLA Compliance', value: '94%', change: 3, trend: 'up', target: 95 },
    { name: 'Customer Satisfaction', value: 4.6, change: 5, trend: 'up', target: 4.5, unit: '/5' },
    { name: 'Ticket Backlog', value: 23, change: -18, trend: 'down' },
  ];

  const weeklyTrend = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  }).map(date => ({
    date: format(date, 'EEE'),
    opened: Math.floor(Math.random() * 30) + 10,
    resolved: Math.floor(Math.random() * 35) + 8,
    escalated: Math.floor(Math.random() * 5),
  }));

  const technicianPerformance = [
    { name: 'Sarah J.', resolved: 42, avgTime: 3.2, satisfaction: 4.8, utilization: 85 },
    { name: 'Mike T.', resolved: 38, avgTime: 4.1, satisfaction: 4.5, utilization: 78 },
    { name: 'Lisa K.', resolved: 35, avgTime: 3.8, satisfaction: 4.7, utilization: 82 },
    { name: 'John D.', resolved: 28, avgTime: 5.2, satisfaction: 4.3, utilization: 65 },
    { name: 'Amy R.', resolved: 13, avgTime: 2.9, satisfaction: 4.9, utilization: 45 },
  ];

  const categoryDistribution = [
    { name: 'Hardware', value: 85, color: '#22d3ee' },
    { name: 'Software', value: 120, color: '#a855f7' },
    { name: 'Network', value: 45, color: '#3b82f6' },
    { name: 'Security', value: 30, color: '#ef4444' },
    { name: 'Other', value: 25, color: '#10b981' },
  ];

  const clientMetrics = [
    { name: 'Acme Corp', tickets: 45, resolved: 42, slaCompliance: 96, satisfaction: 4.7 },
    { name: 'TechFlow Inc', tickets: 32, resolved: 30, slaCompliance: 94, satisfaction: 4.5 },
    { name: 'GlobalData', tickets: 28, resolved: 25, slaCompliance: 89, satisfaction: 4.2 },
    { name: 'StartupXYZ', tickets: 18, resolved: 18, slaCompliance: 100, satisfaction: 4.9 },
    { name: 'Enterprise Ltd', tickets: 52, resolved: 48, slaCompliance: 92, satisfaction: 4.4 },
  ];

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

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
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
                  {Math.abs(kpi.change)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
              {kpi.target && (
                <Progress 
                  value={(parseFloat(String(kpi.value).replace(/[^0-9.]/g, '')) / kpi.target) * 100} 
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
            <TabsTrigger value="technicians">Technician Performance</TabsTrigger>
            <TabsTrigger value="clients">Client Analytics</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-400">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <TabsContent value="kpis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Ticket Trend */}
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
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="opened" stackId="1" stroke="#22d3ee" fill="#22d3ee40" name="Opened" />
                      <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b98140" name="Resolved" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Tickets by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technicians" className="mt-6">
          <Card className="bg-black/60 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Technician Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {technicianPerformance.map((tech, i) => (
                  <div key={tech.name} className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {tech.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{tech.name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-muted-foreground">
                          <Ticket className="h-3 w-3 inline mr-1" />
                          {tech.resolved} resolved
                        </span>
                        <span className="text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {tech.avgTime}h avg
                        </span>
                        <span className="text-amber-400">★ {tech.satisfaction}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{tech.utilization}%</p>
                      <p className="text-xs text-muted-foreground">Utilization</p>
                    </div>
                    <Progress value={tech.utilization} className="w-24 h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                          <p className="text-muted-foreground">Satisfaction</p>
                          <p className="text-lg font-bold text-amber-400">★ {client.satisfaction}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
