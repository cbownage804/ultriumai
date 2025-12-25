import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  AlertTriangle,
  Target,
  Server,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useVanguardAgents } from '@/hooks/useVanguardAgents';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface AnalyticsData {
  threatsOverTime: { date: string; critical: number; high: number; medium: number; low: number }[];
  scanHistory: { date: string; scans: number; findings: number }[];
  severityDistribution: { name: string; value: number; color: string }[];
  agentActivity: { name: string; online: number; offline: number }[];
  complianceScores: { framework: string; score: number }[];
  weeklyTrends: { 
    threats: { current: number; previous: number; trend: number };
    scans: { current: number; previous: number; trend: number };
    resolved: { current: number; previous: number; trend: number };
    uptime: { current: number; previous: number; trend: number };
  };
}

export const VanguardAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    threatsOverTime: [],
    scanHistory: [],
    severityDistribution: [],
    agentActivity: [],
    complianceScores: [],
    weeklyTrends: {
      threats: { current: 0, previous: 0, trend: 0 },
      scans: { current: 0, previous: 0, trend: 0 },
      resolved: { current: 0, previous: 0, trend: 0 },
      uptime: { current: 99, previous: 98, trend: 1 }
    }
  });
  const { agents } = useVanguardAgents();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load security incidents
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('severity, created_at, status')
        .gte('created_at', startDate.toISOString());

      // Load security scans
      const { data: scans } = await supabase
        .from('security_scans')
        .select('*')
        .gte('started_at', startDate.toISOString());

      // Process threats over time
      const threatsByDate = new Map<string, { critical: number; high: number; medium: number; low: number }>();
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        threatsByDate.set(dateStr, { critical: 0, high: 0, medium: 0, low: 0 });
      }

      (incidents || []).forEach(incident => {
        const dateStr = incident.created_at.split('T')[0];
        const existing = threatsByDate.get(dateStr);
        if (existing) {
          const severity = incident.severity as 'critical' | 'high' | 'medium' | 'low';
          existing[severity] = (existing[severity] || 0) + 1;
        }
      });

      const threatsOverTime = Array.from(threatsByDate.entries())
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Process scan history
      const scansByDate = new Map<string, { scans: number; findings: number }>();
      
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        scansByDate.set(dateStr, { scans: 0, findings: 0 });
      }

      (scans || []).forEach(scan => {
        const dateStr = scan.started_at.split('T')[0];
        const existing = scansByDate.get(dateStr);
        if (existing) {
          existing.scans += 1;
          existing.findings += (scan.critical_count || 0) + (scan.high_count || 0) + (scan.medium_count || 0);
        }
      });

      const scanHistory = Array.from(scansByDate.entries())
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Severity distribution
      const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
      (incidents || []).forEach(incident => {
        const severity = incident.severity as keyof typeof severityCounts;
        if (severityCounts[severity] !== undefined) {
          severityCounts[severity]++;
        }
      });

      const severityDistribution = [
        { name: 'Critical', value: severityCounts.critical, color: '#ef4444' },
        { name: 'High', value: severityCounts.high, color: '#f97316' },
        { name: 'Medium', value: severityCounts.medium, color: '#eab308' },
        { name: 'Low', value: severityCounts.low, color: '#3b82f6' }
      ];

      // Calculate trends (current week vs previous week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const currentWeekThreats = (incidents || []).filter(i => new Date(i.created_at) >= oneWeekAgo).length;
      const previousWeekThreats = (incidents || []).filter(i => {
        const date = new Date(i.created_at);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }).length;

      const currentWeekScans = (scans || []).filter(s => new Date(s.started_at) >= oneWeekAgo).length;
      const previousWeekScans = (scans || []).filter(s => {
        const date = new Date(s.started_at);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }).length;

      const currentWeekResolved = (incidents || []).filter(i => i.status === 'resolved' && new Date(i.created_at) >= oneWeekAgo).length;
      const previousWeekResolved = (incidents || []).filter(i => {
        const date = new Date(i.created_at);
        return i.status === 'resolved' && date >= twoWeeksAgo && date < oneWeekAgo;
      }).length;

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      setAnalytics({
        threatsOverTime,
        scanHistory,
        severityDistribution,
        agentActivity: [],
        complianceScores: [
          { framework: 'CIS', score: 78 },
          { framework: 'NIST', score: 82 },
          { framework: 'PCI-DSS', score: 71 },
          { framework: 'HIPAA', score: 85 }
        ],
        weeklyTrends: {
          threats: { 
            current: currentWeekThreats, 
            previous: previousWeekThreats, 
            trend: calculateTrend(currentWeekThreats, previousWeekThreats)
          },
          scans: { 
            current: currentWeekScans, 
            previous: previousWeekScans, 
            trend: calculateTrend(currentWeekScans, previousWeekScans)
          },
          resolved: { 
            current: currentWeekResolved, 
            previous: previousWeekResolved, 
            trend: calculateTrend(currentWeekResolved, previousWeekResolved)
          },
          uptime: { current: 99.2, previous: 98.8, trend: 0.4 }
        }
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const TrendBadge = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
    const isPositive = inverted ? value < 0 : value > 0;
    const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
    return (
      <Badge 
        variant="outline" 
        className={`${isPositive ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {Math.abs(value)}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time Range:</span>
          <div className="flex gap-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Threats This Week</p>
                <p className="text-2xl font-bold">{analytics.weeklyTrends.threats.current}</p>
              </div>
              <TrendBadge value={analytics.weeklyTrends.threats.trend} inverted />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs {analytics.weeklyTrends.threats.previous} last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scans Completed</p>
                <p className="text-2xl font-bold">{analytics.weeklyTrends.scans.current}</p>
              </div>
              <TrendBadge value={analytics.weeklyTrends.scans.trend} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs {analytics.weeklyTrends.scans.previous} last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Issues Resolved</p>
                <p className="text-2xl font-bold">{analytics.weeklyTrends.resolved.current}</p>
              </div>
              <TrendBadge value={analytics.weeklyTrends.resolved.trend} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              vs {analytics.weeklyTrends.resolved.previous} last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold">{analytics.weeklyTrends.uptime.current}%</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-300">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                {analytics.weeklyTrends.uptime.trend}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Agent availability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threats Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Threats Over Time
            </CardTitle>
            <CardDescription>Security incidents by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.threatsOverTime.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Scan Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Scan Activity
            </CardTitle>
            <CardDescription>Scans completed and findings detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.scanHistory.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="findings" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Severity Distribution
            </CardTitle>
            <CardDescription>Breakdown of incidents by severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              {analytics.severityDistribution.every(d => d.value === 0) ? (
                <div className="text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No incidents in this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.severityDistribution.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analytics.severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Compliance Scores
            </CardTitle>
            <CardDescription>Current compliance by framework</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.complianceScores.map((framework) => (
                <div key={framework.framework} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{framework.framework}</span>
                    <span className="font-medium">{framework.score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        framework.score >= 80 ? 'bg-green-500' :
                        framework.score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${framework.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Fleet Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Agent Fleet Status
          </CardTitle>
          <CardDescription>Overview of deployed agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-2xl font-bold text-green-600">
                {agents.filter(a => {
                  if (!a.last_heartbeat) return false;
                  return new Date(a.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Online</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-2xl font-bold text-red-600">
                {agents.filter(a => {
                  if (!a.last_heartbeat) return true;
                  return new Date(a.last_heartbeat).getTime() <= Date.now() - 5 * 60 * 1000;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Offline</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-sm text-muted-foreground">Total Agents</p>
            </div>
            <div className="p-4 rounded-lg bg-muted border">
              <p className="text-2xl font-bold">
                {agents.length > 0 ? Math.round((agents.filter(a => {
                  if (!a.last_heartbeat) return false;
                  return new Date(a.last_heartbeat).getTime() > Date.now() - 5 * 60 * 1000;
                }).length / agents.length) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Fleet Health</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
