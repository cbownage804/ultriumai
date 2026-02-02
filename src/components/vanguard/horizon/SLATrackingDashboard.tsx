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

interface SLAMetric {
  id: string;
  name: string;
  target: number;
  actual: number;
  unit: string;
  trend: "up" | "down" | "stable";
  status: "met" | "at_risk" | "breached";
}

interface ClientSLA {
  id: string;
  clientName: string;
  slaType: string;
  responseTarget: number;
  responseActual: number;
  resolutionTarget: number;
  resolutionActual: number;
  uptimeTarget: number;
  uptimeActual: number;
  ticketsTotal: number;
  ticketsMet: number;
  ticketsBreached: number;
  trend: "improving" | "declining" | "stable";
}

export function SLATrackingDashboard() {
  const { metrics: dbMetrics, isLoading, refetch } = useSLAMetrics();
  const [timeRange, setTimeRange] = useState("month");
  const [selectedClient, setSelectedClient] = useState("all");

  // Calculate aggregate metrics from DB data
  const aggregateMetrics = useMemo(() => {
    if (dbMetrics.length === 0) return null;
    
    const totalTickets = dbMetrics.reduce((sum, m) => sum + m.total_tickets, 0);
    const ticketsWithinResponseSLA = dbMetrics.reduce((sum, m) => sum + m.tickets_within_response_sla, 0);
    const ticketsWithinResolutionSLA = dbMetrics.reduce((sum, m) => sum + m.tickets_within_resolution_sla, 0);
    const avgResponseTime = dbMetrics.reduce((sum, m) => sum + (m.avg_response_time_minutes || 0), 0) / dbMetrics.length;
    const avgResolutionTime = dbMetrics.reduce((sum, m) => sum + (m.avg_resolution_time_minutes || 0), 0) / dbMetrics.length;
    const avgUptime = dbMetrics.reduce((sum, m) => sum + (m.uptime_percent || 0), 0) / dbMetrics.length;

    return {
      totalTickets,
      responseCompliance: totalTickets > 0 ? (ticketsWithinResponseSLA / totalTickets * 100) : 0,
      resolutionCompliance: totalTickets > 0 ? (ticketsWithinResolutionSLA / totalTickets * 100) : 0,
      avgResponseTime,
      avgResolutionTime,
      avgUptime
    };
  }, [dbMetrics]);

  const overallMetrics: SLAMetric[] = [
    {
      id: "1",
      name: "First Response Time",
      target: 15,
      actual: 12.4,
      unit: "min",
      trend: "down",
      status: "met",
    },
    {
      id: "2",
      name: "Resolution Time",
      target: 240,
      actual: 198,
      unit: "min",
      trend: "down",
      status: "met",
    },
    {
      id: "3",
      name: "System Uptime",
      target: 99.9,
      actual: 99.87,
      unit: "%",
      trend: "up",
      status: "at_risk",
    },
    {
      id: "4",
      name: "Customer Satisfaction",
      target: 90,
      actual: 94.2,
      unit: "%",
      trend: "up",
      status: "met",
    },
  ];

  const clientSLAs: ClientSLA[] = [
    {
      id: "1",
      clientName: "Acme Corporation",
      slaType: "Premium",
      responseTarget: 15,
      responseActual: 11,
      resolutionTarget: 120,
      resolutionActual: 95,
      uptimeTarget: 99.99,
      uptimeActual: 99.98,
      ticketsTotal: 47,
      ticketsMet: 45,
      ticketsBreached: 2,
      trend: "improving",
    },
    {
      id: "2",
      clientName: "TechStart Inc",
      slaType: "Standard",
      responseTarget: 30,
      responseActual: 22,
      resolutionTarget: 240,
      resolutionActual: 180,
      uptimeTarget: 99.9,
      uptimeActual: 99.95,
      ticketsTotal: 23,
      ticketsMet: 22,
      ticketsBreached: 1,
      trend: "stable",
    },
    {
      id: "3",
      clientName: "Global Finance Ltd",
      slaType: "Enterprise",
      responseTarget: 5,
      responseActual: 4,
      resolutionTarget: 60,
      resolutionActual: 52,
      uptimeTarget: 99.999,
      uptimeActual: 99.998,
      ticketsTotal: 156,
      ticketsMet: 152,
      ticketsBreached: 4,
      trend: "improving",
    },
    {
      id: "4",
      clientName: "Retail Plus",
      slaType: "Standard",
      responseTarget: 30,
      responseActual: 35,
      resolutionTarget: 240,
      resolutionActual: 280,
      uptimeTarget: 99.9,
      uptimeActual: 99.7,
      ticketsTotal: 34,
      ticketsMet: 28,
      ticketsBreached: 6,
      trend: "declining",
    },
  ];

  const breachedTickets = [
    {
      id: "TKT-1234",
      client: "Retail Plus",
      subject: "Email server down",
      priority: "Critical",
      responseTime: 45,
      responseTarget: 30,
      resolutionTime: 320,
      resolutionTarget: 240,
    },
    {
      id: "TKT-1289",
      client: "Acme Corporation",
      subject: "VPN connectivity issues",
      priority: "High",
      responseTime: 18,
      responseTarget: 15,
      resolutionTime: 145,
      resolutionTarget: 120,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "met":
        return "text-green-500";
      case "at_risk":
        return "text-yellow-500";
      case "breached":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "met":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Met</Badge>;
      case "at_risk":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">At Risk</Badge>;
      case "breached":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Breached</Badge>;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const calculateCompliance = (met: number, total: number) => {
    return total > 0 ? Math.round((met / total) * 100) : 100;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SLA Tracking Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Monitor service level agreement compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clientSLAs.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.clientName}
                </SelectItem>
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
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {overallMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground">{metric.name}</p>
                {getStatusBadge(metric.status)}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                    {metric.actual}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {metric.unit}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Target: {metric.target}
                    {metric.unit}
                  </p>
                </div>
                {getTrendIcon(metric.trend)}
              </div>
              <Progress
                value={(metric.actual / metric.target) * 100}
                className="h-1 mt-2"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/20">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">94.2%</p>
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
              <p className="text-2xl font-bold text-cyan-500">260</p>
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
              <p className="text-2xl font-bold text-yellow-500">13</p>
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
              <p className="text-2xl font-bold text-purple-500">12.4m</p>
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
          <TabsTrigger value="breaches" className="gap-2">
            <XCircle className="h-4 w-4" />
            Breaches
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 text-xs font-medium text-muted-foreground">
                        Client
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-muted-foreground">
                        SLA Type
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-muted-foreground">
                        Response Time
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-muted-foreground">
                        Resolution Time
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-muted-foreground">
                        Uptime
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-muted-foreground">
                        Compliance
                      </th>
                      <th className="text-center p-4 text-xs font-medium text-muted-foreground">
                        Trend
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientSLAs.map((client) => {
                      const compliance = calculateCompliance(
                        client.ticketsMet,
                        client.ticketsTotal
                      );
                      return (
                        <tr key={client.id} className="border-b hover:bg-muted/30">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{client.clientName}</p>
                              <p className="text-xs text-muted-foreground">
                                {client.ticketsTotal} tickets
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <Badge variant="outline">{client.slaType}</Badge>
                          </td>
                          <td className="p-4 text-center">
                            <div>
                              <p
                                className={
                                  client.responseActual <= client.responseTarget
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {client.responseActual}m
                              </p>
                              <p className="text-xs text-muted-foreground">
                                / {client.responseTarget}m
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div>
                              <p
                                className={
                                  client.resolutionActual <= client.resolutionTarget
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {client.resolutionActual}m
                              </p>
                              <p className="text-xs text-muted-foreground">
                                / {client.resolutionTarget}m
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div>
                              <p
                                className={
                                  client.uptimeActual >= client.uptimeTarget
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {client.uptimeActual}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                / {client.uptimeTarget}%
                              </p>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={
                                  compliance >= 95
                                    ? "text-green-500"
                                    : compliance >= 85
                                    ? "text-yellow-500"
                                    : "text-red-500"
                                }
                              >
                                {compliance}%
                              </span>
                              <Progress value={compliance} className="h-1 w-16" />
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {getTrendIcon(client.trend)}
                              <span className="text-xs capitalize">{client.trend}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Recent SLA Breaches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {breachedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-lg bg-red-500/5 border border-red-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{ticket.id}</span>
                          <Badge variant="destructive">{ticket.priority}</Badge>
                        </div>
                        <p className="font-medium mt-1">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">{ticket.client}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <div>
                          <p className="text-xs text-muted-foreground">Response</p>
                          <p className="text-sm">
                            <span className="text-red-500">{ticket.responseTime}m</span>
                            <span className="text-muted-foreground"> / {ticket.responseTarget}m</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Resolution</p>
                          <p className="text-sm">
                            <span className="text-red-500">{ticket.resolutionTime}m</span>
                            <span className="text-muted-foreground"> / {ticket.resolutionTarget}m</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SLA Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Trend charts will be displayed here</p>
                  <p className="text-xs">Showing historical SLA performance data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
