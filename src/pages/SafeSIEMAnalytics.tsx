import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Shield,
  AlertTriangle,
  Clock,
  Target,
  Users,
  ArrowLeft,
  Download,
  Calendar,
  Filter,
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsData {
  events_by_day: Array<{ date: string; count: number; severity_breakdown: Record<string, number> }>;
  events_by_app: Array<{ app: string; count: number; trend: number }>;
  threat_trends: Array<{ indicator_type: string; count: number; confidence_avg: number }>;
  incident_metrics: {
    total: number;
    resolved: number;
    avg_resolution_time: number;
    sla_compliance: number;
    by_priority: Record<string, number>;
  };
  security_posture: {
    score: number;
    trends: Array<{ metric: string; value: number; change: number }>;
  };
}

const SafeSIEMAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
    }
  }, [user, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Load security events
      const { data: events, error: eventsError } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Load incidents
      const { data: incidents, error: incidentsError } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString());

      if (incidentsError) throw incidentsError;

      // Load threat intelligence
      const { data: threats, error: threatsError } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('is_active', true)
        .gte('first_seen', startDate.toISOString());

      if (threatsError) throw threatsError;

      // Process data into analytics format
      const processedData = processAnalyticsData(events || [], incidents || [], threats || [], days);
      setAnalyticsData(processedData);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (events: any[], incidents: any[], threats: any[], days: number): AnalyticsData => {
    // Events by day
    const eventsByDay = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(e => e.created_at.startsWith(dateStr));
      const severityBreakdown = dayEvents.reduce((acc, e) => {
        acc[e.severity] = (acc[e.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        date: dateStr,
        count: dayEvents.length,
        severity_breakdown: severityBreakdown
      };
    });

    // Events by app
    const appCounts = events.reduce((acc, e) => {
      acc[e.source_app] = (acc[e.source_app] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByApp = Object.entries(appCounts).map(([app, count]) => ({
      app,
      count: count as number,
      trend: Math.random() * 20 - 10 // Placeholder trend calculation
    }));

    // Threat trends
    const threatCounts = threats.reduce((acc, t) => {
      if (!acc[t.indicator_type]) {
        acc[t.indicator_type] = { count: 0, confidence_sum: 0 };
      }
      acc[t.indicator_type].count += 1;
      acc[t.indicator_type].confidence_sum += t.confidence;
      return acc;
    }, {} as Record<string, { count: number; confidence_sum: number }>);

    const threatTrends = Object.entries(threatCounts).map(([type, data]) => {
      const typedData = data as { count: number; confidence_sum: number };
      return {
        indicator_type: type,
        count: typedData.count,
        confidence_avg: typedData.count > 0 ? Math.round(typedData.confidence_sum / typedData.count) : 0
      };
    });

    // Incident metrics
    const resolvedIncidents = incidents.filter(i => i.resolved_at);
    const priorityBreakdown = incidents.reduce((acc, i) => {
      acc[i.priority] = (acc[i.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgResolutionTime = resolvedIncidents.length > 0 
      ? resolvedIncidents.reduce((sum, i) => {
          const created = new Date(i.created_at).getTime();
          const resolved = new Date(i.resolved_at).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedIncidents.length / (1000 * 60 * 60) // hours
      : 0;

    const slaCompliant = resolvedIncidents.filter(i => {
      const deadline = new Date(i.sla_deadline);
      const resolved = new Date(i.resolved_at);
      return resolved <= deadline;
    }).length;

    const incidentMetrics = {
      total: incidents.length,
      resolved: resolvedIncidents.length,
      avg_resolution_time: Math.round(avgResolutionTime * 10) / 10,
      sla_compliance: resolvedIncidents.length > 0 ? Math.round((slaCompliant / resolvedIncidents.length) * 100) : 100,
      by_priority: priorityBreakdown
    };

    // Security posture calculation
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const openIncidents = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length;
    const securityScore = Math.max(0, 100 - (criticalEvents * 5) - (openIncidents * 3));

    const securityPosture = {
      score: Math.round(securityScore),
      trends: [
        { metric: 'Threat Detection', value: 85, change: 5 },
        { metric: 'Response Time', value: 92, change: -2 },
        { metric: 'Coverage', value: 94, change: 3 },
        { metric: 'Compliance', value: incidentMetrics.sla_compliance, change: 0 }
      ]
    };

    return {
      events_by_day: eventsByDay,
      events_by_app: eventsByApp,
      threat_trends: threatTrends,
      incident_metrics: incidentMetrics,
      security_posture: securityPosture
    };
  };

  const exportReport = () => {
    if (!analyticsData) return;
    
    const reportData = {
      generated_at: new Date().toISOString(),
      time_range: timeRange,
      summary: {
        total_events: analyticsData.events_by_day.reduce((sum, d) => sum + d.count, 0),
        total_incidents: analyticsData.incident_metrics.total,
        security_score: analyticsData.security_posture.score,
        sla_compliance: analyticsData.incident_metrics.sla_compliance
      },
      detailed_data: analyticsData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safesiem-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Exported",
      description: "Analytics report has been downloaded successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Security Analytics
            </h1>
            <p className="text-muted-foreground">
              Advanced security metrics and threat intelligence analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/safesiem')}
          >
            Back to SIEM
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {analyticsData?.security_posture.score}/100
            </div>
            <Progress value={analyticsData?.security_posture.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.events_by_day.reduce((sum, d) => sum + d.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Last {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {analyticsData?.incident_metrics.total - analyticsData?.incident_metrics.resolved}
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData?.incident_metrics.resolved} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {analyticsData?.incident_metrics.sla_compliance}%
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {analyticsData?.incident_metrics.avg_resolution_time}h resolution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Event Analysis</TabsTrigger>
          <TabsTrigger value="threats">Threat Intelligence</TabsTrigger>
          <TabsTrigger value="incidents">Incident Metrics</TabsTrigger>
          <TabsTrigger value="posture">Security Posture</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Timeline</CardTitle>
                <CardDescription>Security events over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.events_by_day.slice(-7).map((day, index) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (day.count / 50) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Security Sources</CardTitle>
                <CardDescription>Events by application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.events_by_app.slice(0, 5).map((app) => (
                    <div key={app.app} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{app.app}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{app.count}</span>
                        {app.trend > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="posture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Posture Trends</CardTitle>
              <CardDescription>Key security metrics and their trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData?.security_posture.trends.map((trend) => (
                  <div key={trend.metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{trend.metric}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{trend.value}%</span>
                        {trend.change !== 0 && (
                          <span className={`text-xs ${trend.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trend.change > 0 ? '+' : ''}{trend.change}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={trend.value} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional tabs content placeholder */}
        <TabsContent value="events">
          <Card>
            <CardContent className="py-8 text-center">
              <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Detailed event analysis charts and trending data
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats">
          <Card>
            <CardContent className="py-8 text-center">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Threat intelligence analysis and IOC tracking
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardContent className="py-8 text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Detailed incident response metrics and performance analysis
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SafeSIEMAnalytics;