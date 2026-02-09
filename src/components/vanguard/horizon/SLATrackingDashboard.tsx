import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Timer,
  BarChart3,
  Calendar,
  Users,
  Ticket,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useSLAMetrics } from "@/hooks/useHorizon";
import { useMSPDashboard } from "@/hooks/useMSPDashboard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SLATrackingDashboard() {
  const { metrics: dbMetrics, isLoading, refetch } = useSLAMetrics();
  const { clients } = useMSPDashboard();
  const [timeRange, setTimeRange] = useState("month");
  const [selectedClient, setSelectedClient] = useState("all");

  // Compute all stats from live DB data
  const liveStats = useMemo(() => {
    if (dbMetrics.length === 0) return null;

    const totalTickets = dbMetrics.reduce((sum, m) => sum + m.total_tickets, 0);
    const ticketsWithinResponseSLA = dbMetrics.reduce((sum, m) => sum + m.tickets_within_response_sla, 0);
    const ticketsWithinResolutionSLA = dbMetrics.reduce((sum, m) => sum + m.tickets_within_resolution_sla, 0);
    const avgResponseTime = dbMetrics.reduce((sum, m) => sum + (m.avg_response_time_minutes || 0), 0) / dbMetrics.length;
    const avgResolutionTime = dbMetrics.reduce((sum, m) => sum + (m.avg_resolution_time_minutes || 0), 0) / dbMetrics.length;
    const avgUptime = dbMetrics.reduce((sum, m) => sum + (m.uptime_percent || 0), 0) / dbMetrics.length;
    const breaches = totalTickets - ticketsWithinResolutionSLA;
    const responseCompliance = totalTickets > 0 ? (ticketsWithinResponseSLA / totalTickets * 100) : 0;
    const resolutionCompliance = totalTickets > 0 ? (ticketsWithinResolutionSLA / totalTickets * 100) : 0;
    const overallCompliance = (responseCompliance + resolutionCompliance) / 2;

    return {
      totalTickets,
      breaches,
      avgResponseTime: Math.round(avgResponseTime * 10) / 10,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      avgUptime: Math.round(avgUptime * 100) / 100,
      overallCompliance: Math.round(overallCompliance * 10) / 10,
      responseCompliance: Math.round(responseCompliance * 10) / 10,
      resolutionCompliance: Math.round(resolutionCompliance * 10) / 10,
    };
  }, [dbMetrics]);

  // Group SLA metrics by client_id for per-client view
  const clientSLAs = useMemo(() => {
    const byClient = new Map<string, typeof dbMetrics>();
    for (const m of dbMetrics) {
      const key = m.client_id || 'unknown';
      if (!byClient.has(key)) byClient.set(key, []);
      byClient.get(key)!.push(m);
    }

    return Array.from(byClient.entries()).map(([clientId, metrics]) => {
      const client = clients.find(c => c.id === clientId);
      const totalTickets = metrics.reduce((s, m) => s + m.total_tickets, 0);
      const metSLA = metrics.reduce((s, m) => s + m.tickets_within_resolution_sla, 0);
      const avgResponse = metrics.reduce((s, m) => s + (m.avg_response_time_minutes || 0), 0) / metrics.length;
      const avgResolution = metrics.reduce((s, m) => s + (m.avg_resolution_time_minutes || 0), 0) / metrics.length;
      const avgUptime = metrics.reduce((s, m) => s + (m.uptime_percent || 0), 0) / metrics.length;
      const compliance = totalTickets > 0 ? Math.round((metSLA / totalTickets) * 100) : 100;

      return {
        id: clientId,
        clientName: client?.name || clientId,
        totalTickets,
        metSLA,
        breaches: totalTickets - metSLA,
        avgResponseMin: Math.round(avgResponse),
        avgResolutionMin: Math.round(avgResolution),
        uptime: Math.round(avgUptime * 100) / 100,
        compliance,
      };
    });
  }, [dbMetrics, clients]);

  // Build trend data from SLA metrics over time
  const trendData = useMemo(() => {
    if (dbMetrics.length === 0) return [];
    const sorted = [...dbMetrics].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
    return sorted.slice(-12).map(m => ({
      date: new Date(m.metric_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      responseTime: m.avg_response_time_minutes || 0,
      resolutionTime: m.avg_resolution_time_minutes || 0,
      uptime: m.uptime_percent || 0,
    }));
  }, [dbMetrics]);

  const getComplianceColor = (val: number) =>
    val >= 95 ? "text-green-500" : val >= 85 ? "text-yellow-500" : "text-red-500";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const hasData = dbMetrics.length > 0 && liveStats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SLA Tracking Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            {hasData ? 'Live service level agreement compliance' : 'No SLA metric data available yet'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clientSLAs.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overall Metrics from live data */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted-foreground">Avg Response Time</p>
            </div>
            <p className="text-2xl font-bold">{hasData ? `${liveStats.avgResponseTime}m` : '—'}</p>
            <p className="text-xs text-muted-foreground">Target: 15m</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted-foreground">Avg Resolution Time</p>
            </div>
            <p className="text-2xl font-bold">{hasData ? `${liveStats.avgResolutionTime}m` : '—'}</p>
            <p className="text-xs text-muted-foreground">Target: 240m</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted-foreground">System Uptime</p>
            </div>
            <p className={`text-2xl font-bold ${hasData && liveStats.avgUptime >= 99.9 ? 'text-green-500' : hasData ? 'text-yellow-500' : ''}`}>
              {hasData ? `${liveStats.avgUptime}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Target: 99.9%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-muted-foreground">Response Compliance</p>
            </div>
            <p className={`text-2xl font-bold ${hasData ? getComplianceColor(liveStats.responseCompliance) : ''}`}>
              {hasData ? `${liveStats.responseCompliance}%` : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Tickets within SLA</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${hasData ? getComplianceColor(liveStats.overallCompliance) : 'text-muted-foreground'}`}>
                {hasData ? `${liveStats.overallCompliance}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Overall Compliance</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-cyan-500/20">
              <Ticket className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-500">{hasData ? liveStats.totalTickets : 0}</p>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/20">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{hasData ? liveStats.breaches : 0}</p>
              <p className="text-xs text-muted-foreground">SLA Breaches</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/20">
              <Timer className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-500">
                {hasData ? `${liveStats.avgResponseTime}m` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Avg Response Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="h-4 w-4" />
            By Client
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {clientSLAs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground">Client</th>
                        <th className="text-center p-4 text-xs font-medium text-muted-foreground">Tickets</th>
                        <th className="text-center p-4 text-xs font-medium text-muted-foreground">Avg Response</th>
                        <th className="text-center p-4 text-xs font-medium text-muted-foreground">Avg Resolution</th>
                        <th className="text-center p-4 text-xs font-medium text-muted-foreground">Uptime</th>
                        <th className="text-center p-4 text-xs font-medium text-muted-foreground">Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientSLAs.map((client) => (
                        <tr key={client.id} className="border-b hover:bg-muted/30">
                          <td className="p-4">
                            <p className="font-medium">{client.clientName}</p>
                            <p className="text-xs text-muted-foreground">{client.breaches} breaches</p>
                          </td>
                          <td className="p-4 text-center">{client.totalTickets}</td>
                          <td className="p-4 text-center">{client.avgResponseMin}m</td>
                          <td className="p-4 text-center">{client.avgResolutionMin}m</td>
                          <td className="p-4 text-center">
                            <span className={client.uptime >= 99.9 ? 'text-green-500' : 'text-yellow-500'}>
                              {client.uptime}%
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={getComplianceColor(client.compliance)}>{client.compliance}%</span>
                              <Progress value={client.compliance} className="h-1 w-16" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No SLA data by client yet. SLA metrics are recorded as tickets are resolved.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SLA Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Area type="monotone" dataKey="responseTime" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} name="Response (min)" />
                      <Area type="monotone" dataKey="resolutionTime" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} name="Resolution (min)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Trend data will appear as SLA metrics accumulate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
