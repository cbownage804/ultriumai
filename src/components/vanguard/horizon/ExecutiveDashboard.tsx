import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Monitor,
  Ticket, Shield, DollarSign, Clock, CheckCircle2, AlertTriangle,
  Download, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { useHorizonStats } from '@/hooks/useHorizonStats';
import { useSLAMetrics } from '@/hooks/useHorizon';
import { useMSPDashboard } from '@/hooks/useMSPDashboard';

export const ExecutiveDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const { stats, devices, isLoading: statsLoading, refetch } = useHorizonStats();
  const { metrics: slaMetrics, isLoading: slaLoading } = useSLAMetrics();
  const { clients, loading: clientsLoading } = useMSPDashboard();

  const isLoading = statsLoading || slaLoading || clientsLoading;

  // Compute real KPIs from live data
  const kpiData = useMemo(() => {
    const totalTickets = slaMetrics.reduce((sum, m) => sum + m.total_tickets, 0);
    const avgResponseMin = slaMetrics.length > 0
      ? slaMetrics.reduce((sum, m) => sum + (m.avg_response_time_minutes || 0), 0) / slaMetrics.length
      : 0;
    const avgResolutionMin = slaMetrics.length > 0
      ? slaMetrics.reduce((sum, m) => sum + (m.avg_resolution_time_minutes || 0), 0) / slaMetrics.length
      : 0;
    const avgUptime = slaMetrics.length > 0
      ? slaMetrics.reduce((sum, m) => sum + (m.uptime_percent || 0), 0) / slaMetrics.length
      : 0;
    const totalRevenue = clients.reduce((sum, c) => sum + c.monthlyRevenue, 0);

    return {
      totalDevices: stats.totalDevices,
      activeTickets: stats.openTickets,
      mttResolve: Math.round(avgResolutionMin / 60 * 10) / 10 || 0,
      threatsBlocked: stats.activeAlerts,
      monthlyRevenue: totalRevenue,
      uptime: Math.round(avgUptime * 10) / 10,
    };
  }, [stats, slaMetrics, clients]);

  // Build device health from live stats
  const deviceHealth = useMemo(() => [
    { name: 'Healthy', value: stats.onlineDevices, color: '#22c55e' },
    { name: 'Warning', value: stats.warningDevices, color: '#eab308' },
    { name: 'Critical', value: stats.criticalDevices + stats.offlineDevices, color: '#ef4444' },
  ], [stats]);

  // Build revenue by client from live MSP data
  const revenueByClient = useMemo(() => 
    clients
      .filter(c => c.monthlyRevenue > 0)
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
      .slice(0, 5)
      .map(c => ({ service: c.name, revenue: c.monthlyRevenue })),
  [clients]);

  // Build top clients from live data
  const topClients = useMemo(() =>
    clients
      .sort((a, b) => b.assets - a.assets)
      .slice(0, 5)
      .map(c => ({
        name: c.name,
        devices: c.assets,
        threats: c.threats,
        revenue: c.monthlyRevenue,
        health: c.status === 'active' ? (100 - Math.min(c.threats * 5, 50)) : 50,
      })),
  [clients]);

  // Build ticket trend from SLA metrics (last 6 periods)
  const ticketTrend = useMemo(() => {
    if (slaMetrics.length === 0) return [];
    const sorted = [...slaMetrics].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
    return sorted.slice(-6).map(m => ({
      date: new Date(m.metric_date).toLocaleDateString('en', { month: 'short' }),
      opened: m.total_tickets,
      resolved: m.tickets_within_resolution_sla,
    }));
  }, [slaMetrics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Executive Dashboard
          </h2>
          <p className="text-muted-foreground">Live KPIs across your managed environment</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Monitor className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{kpiData.totalDevices}</p>
            <p className="text-xs text-muted-foreground">Total Devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Ticket className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{kpiData.activeTickets}</p>
            <p className="text-xs text-muted-foreground">Open Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{kpiData.mttResolve}h</p>
            <p className="text-xs text-muted-foreground">MTT Resolve</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{kpiData.uptime > 0 ? `${kpiData.uptime}%` : '—'}</p>
            <p className="text-xs text-muted-foreground">Avg Uptime</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{kpiData.threatsBlocked}</p>
            <p className="text-xs text-muted-foreground">Active Alerts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {kpiData.monthlyRevenue > 0 ? `$${(kpiData.monthlyRevenue / 1000).toFixed(1)}k` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume Trend</CardTitle>
            <CardDescription>
              {ticketTrend.length > 0 ? 'Opened vs resolved tickets from SLA data' : 'No SLA metric data available yet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {ticketTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ticketTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Area type="monotone" dataKey="opened" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Opened" />
                    <Area type="monotone" dataKey="resolved" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} name="Resolved" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  SLA metrics will appear here once tickets are tracked
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Health */}
        <Card>
          <CardHeader>
            <CardTitle>Device Health Distribution</CardTitle>
            <CardDescription>Live health status of all managed devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {stats.totalDevices > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceHealth}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {deviceHealth.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Deploy agents to see device health distribution
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Client */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Client</CardTitle>
            <CardDescription>Monthly revenue from managed clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {revenueByClient.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByClient} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="service" type="category" className="text-xs" width={120} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Add clients with monthly rates to see revenue breakdown
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Performance metrics by client</CardDescription>
          </CardHeader>
          <CardContent>
            {topClients.length > 0 ? (
              <div className="space-y-4">
                {topClients.map((client) => (
                  <div key={client.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                        <span>{client.devices} assets</span>
                        <span>{client.threats} threats</span>
                        {client.revenue > 0 && <span>${client.revenue.toLocaleString()}/mo</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Progress value={client.health} className="w-24 h-2" />
                        <span className="text-sm font-medium">{client.health}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Health Score</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                Add MSP clients to see performance metrics
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
