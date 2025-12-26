import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, BarChart3, PieChartIcon, Activity, Clock } from "lucide-react";
import { format, subDays, startOfDay, differenceInDays } from "date-fns";

interface Vulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  description: string | null;
  severity: string;
  cve_id: string | null;
  cvss_score: number | null;
  affected_service: string | null;
  port: number | null;
  solution: string | null;
  status: string | null;
  discovered_at: string;
  patched_at: string | null;
  device_id: string | null;
}

interface VulnTrendingAnalyticsProps {
  vulnerabilities: Vulnerability[];
}

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#6b7280',
};

export function VulnTrendingAnalytics({ vulnerabilities }: VulnTrendingAnalyticsProps) {
  // Generate trend data for the last 30 days
  const trendData = useMemo(() => {
    const days = 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const discovered = vulnerabilities.filter(v => {
        const vDate = startOfDay(new Date(v.discovered_at));
        return format(vDate, 'yyyy-MM-dd') === dateStr;
      }).length;
      
      const patched = vulnerabilities.filter(v => {
        if (!v.patched_at) return false;
        const pDate = startOfDay(new Date(v.patched_at));
        return format(pDate, 'yyyy-MM-dd') === dateStr;
      }).length;
      
      // Calculate cumulative open vulns for this day
      const openAsOfDate = vulnerabilities.filter(v => {
        const vDate = new Date(v.discovered_at);
        const pDate = v.patched_at ? new Date(v.patched_at) : null;
        return vDate <= date && (!pDate || pDate > date);
      }).length;
      
      data.push({
        date: format(date, 'MMM d'),
        discovered,
        patched,
        open: openAsOfDate,
      });
    }
    
    return data;
  }, [vulnerabilities]);

  // Severity distribution
  const severityDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    
    vulnerabilities.forEach(v => {
      const sev = v.severity.toLowerCase();
      if (distribution[sev] !== undefined) {
        distribution[sev]++;
      }
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name as keyof typeof COLORS] || COLORS.info,
    }));
  }, [vulnerabilities]);

  // Top affected services
  const topServices = useMemo(() => {
    const services: Record<string, number> = {};
    
    vulnerabilities.forEach(v => {
      const service = v.affected_service || 'Unknown';
      services[service] = (services[service] || 0) + 1;
    });
    
    return Object.entries(services)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [vulnerabilities]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const open = vulnerabilities.filter(v => v.status !== 'patched');
    const patched = vulnerabilities.filter(v => v.status === 'patched');
    
    // Mean Time to Fix
    const mttf = patched.length > 0
      ? patched.reduce((acc, v) => {
          if (v.patched_at) {
            return acc + differenceInDays(new Date(v.patched_at), new Date(v.discovered_at));
          }
          return acc;
        }, 0) / patched.length
      : 0;
    
    // Trend (comparing last 7 days to previous 7 days)
    const last7Days = subDays(new Date(), 7);
    const prev7Days = subDays(new Date(), 14);
    
    const recentVulns = vulnerabilities.filter(v => new Date(v.discovered_at) >= last7Days);
    const prevVulns = vulnerabilities.filter(v => {
      const d = new Date(v.discovered_at);
      return d >= prev7Days && d < last7Days;
    });
    
    const trend = prevVulns.length > 0 
      ? ((recentVulns.length - prevVulns.length) / prevVulns.length) * 100
      : 0;
    
    // Critical/High ratio
    const criticalHigh = vulnerabilities.filter(
      v => v.severity.toLowerCase() === 'critical' || v.severity.toLowerCase() === 'high'
    ).length;
    const criticalHighRatio = vulnerabilities.length > 0 
      ? Math.round((criticalHigh / vulnerabilities.length) * 100)
      : 0;
    
    return {
      total: vulnerabilities.length,
      open: open.length,
      patched: patched.length,
      mttf: Math.round(mttf),
      trend: Math.round(trend),
      criticalHighRatio,
    };
  }, [vulnerabilities]);

  if (vulnerabilities.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No vulnerability data for analytics</p>
          <p className="text-sm">Run scans to generate trend data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{metrics.open}</p>
                <p className="text-xs text-muted-foreground">Open Vulnerabilities</p>
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                metrics.trend > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {metrics.trend > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(metrics.trend)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.mttf}d</p>
                <p className="text-xs text-muted-foreground">Mean Time to Fix</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.patched}</p>
                <p className="text-xs text-muted-foreground">Remediated (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <PieChartIcon className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.criticalHighRatio}%</p>
                <p className="text-xs text-muted-foreground">Critical/High Ratio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vulnerability Trend (30 Days)
          </CardTitle>
          <CardDescription>
            Discovered vs remediated vulnerabilities over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="open" 
                  name="Open" 
                  stroke="#f97316" 
                  fill="#f97316" 
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="discovered" 
                  name="Discovered" 
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="patched" 
                  name="Patched" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Affected Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Affected Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
