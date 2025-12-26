import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, TrendingUp, TrendingDown, Shield, AlertTriangle,
  CheckCircle, XCircle, Clock, Target, Download, Calendar,
  PieChart, Activity, FileText, Users
} from "lucide-react";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

export function ExecutiveSecurityDashboard() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [timeRange, setTimeRange] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);
  
  // Real data state
  const [metrics, setMetrics] = useState({
    riskScore: 0,
    complianceScore: 0,
    incidentsResolved: 0,
    totalIncidents: 0
  });
  const [threatDistribution, setThreatDistribution] = useState<{name: string; value: number; color: string}[]>([]);
  const [incidentTrend, setIncidentTrend] = useState<{date: string; count: number}[]>([]);

  useEffect(() => {
    if (user) loadRealData();
  }, [user, timeRange]);

  const loadRealData = async () => {
    setIsLoading(true);
    try {
      // Get incidents from security_incidents table
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      // Get compliance results
      const { data: complianceResults } = await supabase
        .from('compliance_check_results')
        .select('status')
        .limit(500);

      // Calculate metrics from real data
      const totalIncidents = incidents?.length || 0;
      const resolvedIncidents = incidents?.filter(i => i.status === 'resolved' || i.status === 'closed').length || 0;
      
      // Calculate compliance score
      const passedChecks = complianceResults?.filter(c => c.status === 'pass').length || 0;
      const totalChecks = complianceResults?.length || 1;
      const complianceScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

      // Calculate risk score based on open critical/high incidents
      const criticalOpen = incidents?.filter(i => i.severity === 'critical' && i.status !== 'resolved').length || 0;
      const highOpen = incidents?.filter(i => i.severity === 'high' && i.status !== 'resolved').length || 0;
      const riskScore = Math.min(100, criticalOpen * 20 + highOpen * 10);

      setMetrics({
        riskScore,
        complianceScore,
        incidentsResolved: resolvedIncidents,
        totalIncidents
      });

      // Build threat distribution from incident types
      const typeCounts: Record<string, number> = {};
      incidents?.forEach(inc => {
        const type = inc.incident_type || 'Other';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#6b7280', '#10b981'];
      const distribution = Object.entries(typeCounts)
        .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setThreatDistribution(distribution);

      // Build incident trend (group by date)
      const dateCounts: Record<string, number> = {};
      incidents?.forEach(inc => {
        const date = new Date(inc.created_at).toLocaleDateString();
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });
      const trend = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .slice(-7);
      setIncidentTrend(trend);

    } catch (error) {
      console.error('Error loading executive data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500' };
    if (score >= 50) return { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500' };
    if (score >= 30) return { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'Low', color: 'text-green-500', bg: 'bg-green-500' };
  };

  const risk = getRiskLevel(metrics.riskScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Executive Security Dashboard
          </h2>
          <p className="text-muted-foreground">High-level security posture and KPIs for leadership</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Overall Risk Score</p>
              <Shield className={`h-5 w-5 ${risk.color}`} />
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-bold ${risk.color}`}>{metrics.riskScore}</span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
            <Badge className={`${risk.bg} text-white mt-2`}>{risk.label} Risk</Badge>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
              <TrendingDown className="h-4 w-4" />
              <span>-23% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Compliance Score</p>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-green-500">{metrics.complianceScore}%</span>
            </div>
            <Progress value={metrics.complianceScore} className="h-2 mt-3" />
            <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Total Incidents</p>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{metrics.totalIncidents}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{metrics.incidentsResolved} resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Active Agents</p>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{agents.filter(a => a.status === 'online').length}</span>
              <span className="text-sm text-muted-foreground mb-1">/ {agents.length}</span>
            </div>
            <Progress value={agents.length > 0 ? (agents.filter(a => a.status === 'online').length / agents.length) * 100 : 0} className="h-2 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Trend</CardTitle>
            <CardDescription>Recent incidents by date</CardDescription>
          </CardHeader>
          <CardContent>
            {incidentTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={incidentTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.2}
                    name="Incidents"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No incident data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Threat Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
            <CardDescription>Breakdown by threat category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPie>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Agent Overview</CardTitle>
            <CardDescription>Vanguard agent deployment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Online Agents</span>
                  <span className="text-sm text-green-500">{agents.filter(a => a.status === 'online').length}</span>
                </div>
                <Progress value={agents.length > 0 ? (agents.filter(a => a.status === 'online').length / agents.length) * 100 : 0} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Offline Agents</span>
                  <span className="text-sm text-red-500">{agents.filter(a => a.status === 'offline').length}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Total Deployed</span>
                  <span className="text-sm">{agents.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
            <CardDescription>Breakdown by incident type</CardDescription>
          </CardHeader>
          <CardContent>
            {threatDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={threatDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No threat data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security Summary</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{metrics.totalIncidents}</p>
              <p className="text-xs text-muted-foreground">Total Incidents</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-500">{metrics.incidentsResolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground">Agents Deployed</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{metrics.complianceScore}%</p>
              <p className="text-xs text-muted-foreground">Compliance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary opacity-50" />
              <div>
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-xs text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-xs text-muted-foreground">Open Vulnerabilities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-500 opacity-50" />
              <div>
                <p className="text-2xl font-bold">99.8%</p>
                <p className="text-xs text-muted-foreground">Agent Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500 opacity-50" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Reports Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
