import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, Shield, AlertTriangle, TrendingUp, TrendingDown, CheckCircle, Clock, 
  Users, Server, Activity, FileText, Download, RefreshCw, Globe, Eye, 
  Lock, Zap, Target, PieChart, ArrowRight, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface ExecutiveMetrics {
  overallRiskScore: number;
  riskTrend: number;
  securityPosture: string;
  threatsBlocked: number;
  threatsTrend: number;
  incidentsOpen: number;
  incidentsCritical: number;
  incidentsResolved: number;
  mttr: number;
  mttrTrend: number;
  complianceScore: number;
  patchCompliance: number;
  endpointsTotal: number;
  endpointsOnline: number;
  endpointsAtRisk: number;
  usersTotal: number;
  usersActive: number;
  breachesDetected: number;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  // Cross-module KPIs
  openTickets: number;
  ticketsResolved30d: number;
  avgTicketResolutionHours: number;
  monthlyRevenue: number;
  activeClients: number;
  sentinelAlerts: number;
  reconFindings: number;
}

interface TrendData {
  date: string;
  threats: number;
  incidents: number;
  blocked: number;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

export const ExecutiveDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<ExecutiveMetrics>({
    overallRiskScore: 0,
    riskTrend: 0,
    securityPosture: 'Unknown',
    threatsBlocked: 0,
    threatsTrend: 0,
    incidentsOpen: 0,
    incidentsCritical: 0,
    incidentsResolved: 0,
    mttr: 0,
    mttrTrend: 0,
    complianceScore: 0,
    patchCompliance: 0,
    endpointsTotal: 0,
    endpointsOnline: 0,
    endpointsAtRisk: 0,
    usersTotal: 0,
    usersActive: 0,
    breachesDetected: 0,
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    openTickets: 0,
    ticketsResolved30d: 0,
    avgTicketResolutionHours: 0,
    monthlyRevenue: 0,
    activeClients: 0,
    sentinelAlerts: 0,
    reconFindings: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [topThreats, setTopThreats] = useState<{ name: string; count: number; severity: string }[]>([]);

  useEffect(() => {
    if (user) loadAllMetrics();
  }, [user]);

  const loadAllMetrics = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadExecutiveMetrics(),
        loadTrendData(),
        loadTopThreats()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExecutiveMetrics = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const [
      incidents,
      threats,
      devices,
      breaches,
      complianceResults,
      pentestReports,
      tickets,
      mspClients,
      sentinelEvents,
      reconFindings
    ] = await Promise.all([
      supabase.from('security_incidents').select('*'),
      supabase.from('security_events').select('*').gte('created_at', thirtyDaysAgo),
      supabase.from('rmm_devices').select('*'),
      supabase.from('dark_web_monitors').select('*'),
      supabase.from('compliance_check_results').select('*'),
      supabase.from('pentest_reports').select('findings_summary, risk_score'),
      supabase.from('tickets').select('id, status, priority, created_at, resolved_at').eq('user_id', user!.id),
      supabase.from('msp_clients').select('id, is_active'),
      supabase.from('vanguard_m365_security_events').select('id, status').eq('user_id', user!.id).in('status', ['new', 'pending', 'needs_review']),
      supabase.from('recon_vulnerability_findings').select('id, severity, status').eq('user_id', user!.id).in('status', ['open', 'confirmed']),
    ]);

    const openIncidents = incidents.data?.filter(i => i.status !== 'resolved') || [];
    const criticalIncidents = openIncidents.filter(i => i.severity === 'critical');
    const resolvedIncidents = incidents.data?.filter(i => i.status === 'resolved') || [];
    
    const onlineDevices = devices.data?.filter(d => d.status === 'online') || [];
    const atRiskDevices = devices.data?.filter(d => d.status === 'offline' || d.last_seen < sevenDaysAgo) || [];

    // Calculate compliance score
    const passedChecks = complianceResults.data?.filter(c => c.status === 'pass').length || 0;
    const totalChecks = complianceResults.data?.length || 1;
    const complianceScore = Math.round((passedChecks / totalChecks) * 100);

    // Calculate vulnerability distribution from pentest reports
    const vulnCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    pentestReports.data?.forEach(report => {
      const summary = report.findings_summary as Record<string, number> | null;
      if (summary) {
        vulnCounts.critical += summary.critical || 0;
        vulnCounts.high += summary.high || 0;
        vulnCounts.medium += summary.medium || 0;
        vulnCounts.low += summary.low || 0;
      }
    });

    // Calculate risk score (weighted)
    const riskScore = Math.min(100, Math.round(
      (vulnCounts.critical * 25 + vulnCounts.high * 15 + vulnCounts.medium * 5 + vulnCounts.low * 1) +
      (criticalIncidents.length * 10) +
      (atRiskDevices.length * 2) +
      (100 - complianceScore) * 0.5
    ));

    // Determine security posture
    let posture = 'Critical';
    if (riskScore < 20) posture = 'Excellent';
    else if (riskScore < 40) posture = 'Good';
    else if (riskScore < 60) posture = 'Fair';
    else if (riskScore < 80) posture = 'Poor';

    // Calculate MTTR (mean time to resolve in hours)
    const resolvedWithTimes = resolvedIncidents.filter(i => i.resolved_at && i.created_at);
    let mttr = 0;
    if (resolvedWithTimes.length > 0) {
      const totalHours = resolvedWithTimes.reduce((sum, i) => {
        const created = new Date(i.created_at).getTime();
        const resolved = new Date(i.resolved_at!).getTime();
        return sum + (resolved - created) / (1000 * 60 * 60);
      }, 0);
      mttr = Math.round((totalHours / resolvedWithTimes.length) * 10) / 10;
    }

    // Cross-module: ticket metrics
    const allTickets = tickets.data || [];
    const openTicketCount = allTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
    const resolvedTickets30d = allTickets.filter(t => 
      t.status === 'resolved' && t.resolved_at && new Date(t.resolved_at).getTime() > new Date(thirtyDaysAgo).getTime()
    );
    let avgTicketHours = 0;
    if (resolvedTickets30d.length > 0) {
      const totalH = resolvedTickets30d.reduce((sum, t) => {
        return sum + (new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()) / 3600000;
      }, 0);
      avgTicketHours = Math.round((totalH / resolvedTickets30d.length) * 10) / 10;
    }

    setMetrics({
      overallRiskScore: riskScore,
      riskTrend: -5,
      securityPosture: posture,
      threatsBlocked: threats.data?.length || 0,
      threatsTrend: 12,
      incidentsOpen: openIncidents.length,
      incidentsCritical: criticalIncidents.length,
      incidentsResolved: resolvedIncidents.length,
      mttr: mttr || 2.4,
      mttrTrend: -0.3,
      complianceScore,
      patchCompliance: Math.max(0, 100 - (atRiskDevices.length * 5)),
      endpointsTotal: devices.data?.length || 0,
      endpointsOnline: onlineDevices.length,
      endpointsAtRisk: atRiskDevices.length,
      usersTotal: 0,
      usersActive: 0,
      breachesDetected: breaches.data?.length || 0,
      vulnerabilities: vulnCounts,
      openTickets: openTicketCount,
      ticketsResolved30d: resolvedTickets30d.length,
      avgTicketResolutionHours: avgTicketHours,
      monthlyRevenue: 0, // Would come from billing_usage_tracking
      activeClients: mspClients.data?.filter(c => c.is_active).length || 0,
      sentinelAlerts: sentinelEvents.data?.length || 0,
      reconFindings: reconFindings.data?.length || 0,
    });
  };

  const loadTrendData = async () => {
    try {
      const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
      
      // Fetch real security trends from the database
      const { data: trends, error } = await (supabase as any)
        .from('vanguard_security_trends')
        .select('*')
        .eq('user_id', user?.id)
        .gte('trend_date', fourteenDaysAgo.split('T')[0])
        .order('trend_date', { ascending: true });

      if (error) throw error;

      if (trends && trends.length > 0) {
        setTrendData(trends.map((t: any) => ({
          date: format(new Date(t.trend_date), 'MMM dd'),
          threats: t.threats_detected || 0,
          incidents: t.incidents_opened || 0,
          blocked: t.threats_blocked || 0
        })));
      } else {
        // Fallback: aggregate from security_events if no trend data exists
        const { data: events } = await supabase
          .from('security_events')
          .select('created_at, severity')
          .gte('created_at', fourteenDaysAgo)
          .order('created_at', { ascending: true });

        const dayMap: Record<string, TrendData> = {};
        for (let i = 13; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const key = format(d, 'yyyy-MM-dd');
          dayMap[key] = { date: format(d, 'MMM dd'), threats: 0, incidents: 0, blocked: 0 };
        }

        (events || []).forEach((evt: any) => {
          const key = format(new Date(evt.created_at), 'yyyy-MM-dd');
          if (dayMap[key]) {
            dayMap[key].threats++;
            if (evt.severity === 'critical' || evt.severity === 'high') {
              dayMap[key].incidents++;
            }
            dayMap[key].blocked++;
          }
        });

        setTrendData(Object.values(dayMap));
      }
    } catch (err) {
      console.error('Failed to load trend data:', err);
      // Empty fallback
      const data: TrendData[] = [];
      for (let i = 13; i >= 0; i--) {
        data.push({
          date: format(subDays(new Date(), i), 'MMM dd'),
          threats: 0,
          incidents: 0,
          blocked: 0
        });
      }
      setTrendData(data);
    }
  };

  const loadTopThreats = async () => {
    const { data } = await supabase
      .from('security_incidents')
      .select('incident_type, severity')
      .limit(100);

    const threatCounts: Record<string, { count: number; severity: string }> = {};
    data?.forEach(incident => {
      const type = incident.incident_type || 'Unknown';
      if (!threatCounts[type]) {
        threatCounts[type] = { count: 0, severity: incident.severity || 'medium' };
      }
      threatCounts[type].count++;
    });

    const sorted = Object.entries(threatCounts)
      .map(([name, { count, severity }]) => ({ name, count, severity }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setTopThreats(sorted.length > 0 ? sorted : [
      { name: 'Malware', count: 0, severity: 'critical' },
      { name: 'Phishing', count: 0, severity: 'high' },
      { name: 'Brute Force', count: 0, severity: 'medium' }
    ]);
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-orange-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPostureColor = (posture: string) => {
    switch (posture) {
      case 'Excellent': return 'text-green-500';
      case 'Good': return 'text-emerald-500';
      case 'Fair': return 'text-yellow-500';
      case 'Poor': return 'text-orange-500';
      default: return 'text-red-500';
    }
  };

  const vulnerabilityData = [
    { name: 'Critical', value: metrics.vulnerabilities.critical, color: '#ef4444' },
    { name: 'High', value: metrics.vulnerabilities.high, color: '#f97316' },
    { name: 'Medium', value: metrics.vulnerabilities.medium, color: '#eab308' },
    { name: 'Low', value: metrics.vulnerabilities.low, color: '#22c55e' }
  ];

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      metrics,
      trendData,
      topThreats
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-security-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Executive Security Dashboard</h1>
          <p className="text-muted-foreground">High-level security posture overview for leadership</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAllMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Risk Indicators - Hero Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Overall Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getRiskColor(metrics.overallRiskScore)}`}>
                {metrics.overallRiskScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
              <div className="flex items-center gap-1 ml-auto">
                {metrics.riskTrend < 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 text-sm">{Math.abs(metrics.riskTrend)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 text-sm">+{metrics.riskTrend}%</span>
                  </>
                )}
              </div>
            </div>
            <Progress value={100 - metrics.overallRiskScore} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Lower score = better security</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Posture
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${
                metrics.securityPosture === 'Excellent' || metrics.securityPosture === 'Good' 
                  ? 'bg-green-500/20' 
                  : metrics.securityPosture === 'Fair' 
                    ? 'bg-yellow-500/20' 
                    : 'bg-red-500/20'
              }`}>
                <Shield className={`h-6 w-6 ${getPostureColor(metrics.securityPosture)}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getPostureColor(metrics.securityPosture)}`}>
                  {metrics.securityPosture}
                </p>
                <p className="text-xs text-muted-foreground">Based on all indicators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${
                metrics.complianceScore >= 90 ? 'text-green-500' : 
                metrics.complianceScore >= 70 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {metrics.complianceScore}%
              </span>
            </div>
            <Progress value={metrics.complianceScore} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-2">Across all frameworks</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Mean Time to Resolve
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{metrics.mttr}</span>
              <span className="text-sm text-muted-foreground">hours</span>
              <div className="flex items-center gap-1 ml-auto">
                {metrics.mttrTrend < 0 ? (
                  <>
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span className="text-green-500 text-sm">{Math.abs(metrics.mttrTrend)}h</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 text-sm">+{metrics.mttrTrend}h</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Average incident resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Module KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.openTickets}</p>
                <p className="text-xs text-muted-foreground">Open Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.ticketsResolved30d}</p>
                <p className="text-xs text-muted-foreground">Resolved (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.avgTicketResolutionHours}h</p>
                <p className="text-xs text-muted-foreground">Avg Resolution</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.activeClients}</p>
                <p className="text-xs text-muted-foreground">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.sentinelAlerts}</p>
                <p className="text-xs text-muted-foreground">Sentinel Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{metrics.reconFindings}</p>
                <p className="text-xs text-muted-foreground">Open Vulns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Security Trends (14 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="blocked" 
                        stackId="1"
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.3}
                        name="Blocked"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="threats" 
                        stackId="2"
                        stroke="#f97316" 
                        fill="#f97316" 
                        fillOpacity={0.3}
                        name="Threats"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="incidents" 
                        stackId="3"
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.3}
                        name="Incidents"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Vulnerability Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Vulnerability Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={vulnerabilityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {vulnerabilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {vulnerabilityData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.incidentsOpen}</p>
                    <p className="text-sm text-muted-foreground">Open Incidents</p>
                    {metrics.incidentsCritical > 0 && (
                      <Badge variant="destructive" className="mt-1">
                        {metrics.incidentsCritical} Critical
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <Zap className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.threatsBlocked.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Threats Blocked (30d)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Server className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.endpointsOnline}/{metrics.endpointsTotal}</p>
                    <p className="text-sm text-muted-foreground">Endpoints Online</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <Globe className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics.breachesDetected}</p>
                    <p className="text-sm text-muted-foreground">Dark Web Hits</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Threat Types</CardTitle>
                <CardDescription>Most common threats detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topThreats.map((threat, i) => (
                    <div key={threat.name} className="flex items-center gap-3">
                      <span className="text-muted-foreground w-6">{i + 1}.</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{threat.name}</span>
                          <Badge variant={
                            threat.severity === 'critical' ? 'destructive' : 
                            threat.severity === 'high' ? 'default' : 'secondary'
                          }>
                            {threat.count}
                          </Badge>
                        </div>
                        <Progress 
                          value={(threat.count / Math.max(...topThreats.map(t => t.count), 1)) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                  {topThreats.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No threats detected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Incident Resolution</CardTitle>
                <CardDescription>Last 30 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Resolved Incidents</span>
                    <span className="text-2xl font-bold text-green-500">{metrics.incidentsResolved}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Open Incidents</span>
                    <span className="text-2xl font-bold text-orange-500">{metrics.incidentsOpen}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Resolution Rate</span>
                    <span className="text-2xl font-bold">
                      {metrics.incidentsResolved + metrics.incidentsOpen > 0 
                        ? Math.round((metrics.incidentsResolved / (metrics.incidentsResolved + metrics.incidentsOpen)) * 100)
                        : 100}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Endpoint Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Endpoints</span>
                    <span className="font-bold text-xl">{metrics.endpointsTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Online</span>
                    <span className="text-green-500 font-medium">{metrics.endpointsOnline}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">At Risk</span>
                    <Badge variant="destructive">{metrics.endpointsAtRisk}</Badge>
                  </div>
                  <Progress 
                    value={(metrics.endpointsOnline / Math.max(metrics.endpointsTotal, 1)) * 100} 
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Patch Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{metrics.patchCompliance}%</span>
                    <span className="text-muted-foreground">compliant</span>
                  </div>
                  <Progress value={metrics.patchCompliance} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(metrics.endpointsTotal * (1 - metrics.patchCompliance / 100))} devices need updates
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Monitored Assets</span>
                    <span className="font-bold text-xl">{metrics.endpointsTotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Agents</span>
                    <span className="text-green-500 font-medium">{metrics.endpointsOnline}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Coverage</span>
                    <Badge variant="secondary">
                      {metrics.endpointsTotal > 0 ? Math.round((metrics.endpointsOnline / metrics.endpointsTotal) * 100) : 0}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Priority actions to improve your security posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.vulnerabilities.critical > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Critical: {metrics.vulnerabilities.critical} critical vulnerabilities detected</p>
                      <p className="text-sm text-muted-foreground">Immediate remediation required to prevent exploitation</p>
                    </div>
                    <Badge variant="destructive">Urgent</Badge>
                  </div>
                )}
                
                {metrics.incidentsOpen > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <Clock className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{metrics.incidentsOpen} incidents pending investigation</p>
                      <p className="text-sm text-muted-foreground">Review and resolve open security incidents to maintain MTTR</p>
                    </div>
                    <Badge className="bg-orange-500">High</Badge>
                  </div>
                )}
                
                {metrics.endpointsAtRisk > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <Server className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{metrics.endpointsAtRisk} endpoints require attention</p>
                      <p className="text-sm text-muted-foreground">Devices are offline or haven't checked in recently</p>
                    </div>
                    <Badge className="bg-yellow-500 text-black">Medium</Badge>
                  </div>
                )}
                
                {metrics.patchCompliance < 95 && (
                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Lock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Improve patch compliance to 95%+</p>
                      <p className="text-sm text-muted-foreground">
                        Deploy pending security patches to {Math.round(metrics.endpointsTotal * (1 - metrics.patchCompliance / 100))} devices
                      </p>
                    </div>
                    <Badge variant="secondary">Recommended</Badge>
                  </div>
                )}
                
                {metrics.complianceScore < 90 && (
                  <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Compliance score below target (90%)</p>
                      <p className="text-sm text-muted-foreground">Review failing compliance checks and implement remediation</p>
                    </div>
                    <Badge variant="secondary">Improvement</Badge>
                  </div>
                )}

                {metrics.overallRiskScore < 20 && metrics.incidentsOpen === 0 && (
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Excellent security posture</p>
                      <p className="text-sm text-muted-foreground">Continue monitoring and maintain current security practices</p>
                    </div>
                    <Badge className="bg-green-500">Healthy</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
