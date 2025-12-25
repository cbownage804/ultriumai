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

  // Simulated executive metrics
  const riskScore = 42;
  const complianceScore = 87;
  const mttr = 4.2; // Mean time to remediate (hours)
  const incidentsResolved = 156;

  const riskTrendData = [
    { date: 'Week 1', risk: 65, incidents: 12 },
    { date: 'Week 2', risk: 58, incidents: 8 },
    { date: 'Week 3', risk: 52, incidents: 15 },
    { date: 'Week 4', risk: 42, incidents: 6 },
  ];

  const threatDistribution = [
    { name: 'Malware', value: 35, color: '#ef4444' },
    { name: 'Phishing', value: 25, color: '#f97316' },
    { name: 'Vulnerabilities', value: 20, color: '#eab308' },
    { name: 'Misconfigurations', value: 12, color: '#3b82f6' },
    { name: 'Other', value: 8, color: '#6b7280' },
  ];

  const complianceData = [
    { framework: 'SOC 2', score: 92, target: 95 },
    { framework: 'HIPAA', score: 88, target: 90 },
    { framework: 'PCI DSS', score: 85, target: 90 },
    { framework: 'NIST', score: 78, target: 85 },
    { framework: 'ISO 27001', score: 82, target: 90 },
  ];

  const assetCoverage = [
    { category: 'Endpoints', covered: 245, total: 260 },
    { category: 'Servers', covered: 48, total: 52 },
    { category: 'Network Devices', covered: 32, total: 35 },
    { category: 'Cloud Assets', covered: 89, total: 95 },
  ];

  const monthlyIncidents = [
    { month: 'Jul', critical: 2, high: 8, medium: 15, low: 25 },
    { month: 'Aug', critical: 1, high: 12, medium: 18, low: 22 },
    { month: 'Sep', critical: 3, high: 6, medium: 12, low: 28 },
    { month: 'Oct', critical: 0, high: 5, medium: 10, low: 20 },
    { month: 'Nov', critical: 1, high: 4, medium: 8, low: 18 },
    { month: 'Dec', critical: 0, high: 3, medium: 6, low: 15 },
  ];

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500' };
    if (score >= 50) return { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500' };
    if (score >= 30) return { label: 'Medium', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'Low', color: 'text-green-500', bg: 'bg-green-500' };
  };

  const risk = getRiskLevel(riskScore);

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
              <span className={`text-4xl font-bold ${risk.color}`}>{riskScore}</span>
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
              <span className="text-4xl font-bold text-green-500">{complianceScore}%</span>
            </div>
            <Progress value={complianceScore} className="h-2 mt-3" />
            <div className="flex items-center gap-1 mt-2 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Mean Time to Remediate</p>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{mttr}</span>
              <span className="text-sm text-muted-foreground mb-1">hours</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Target: 4 hours</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-orange-500">
              <TrendingUp className="h-4 w-4" />
              <span>+0.2h from target</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Incidents Resolved</p>
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{incidentsResolved}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-green-500">
              <TrendingUp className="h-4 w-4" />
              <span>+12% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Score Trend</CardTitle>
            <CardDescription>Weekly risk score and incident correlation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={riskTrendData}>
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
                  dataKey="risk" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.2}
                  name="Risk Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="incidents" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={false}
                  name="Incidents"
                />
              </AreaChart>
            </ResponsiveContainer>
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

      {/* Compliance & Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance by Framework */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance by Framework</CardTitle>
            <CardDescription>Current scores vs targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {complianceData.map((item) => (
                <div key={item.framework}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.framework}</span>
                    <span className="text-sm">
                      <span className={item.score >= item.target ? 'text-green-500' : 'text-orange-500'}>
                        {item.score}%
                      </span>
                      <span className="text-muted-foreground"> / {item.target}%</span>
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={item.score} className="h-2" />
                    <div 
                      className="absolute top-0 h-2 w-0.5 bg-foreground"
                      style={{ left: `${item.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Asset Coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Security Coverage</CardTitle>
            <CardDescription>Assets protected by Vanguard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assetCoverage.map((item) => {
                const percentage = Math.round((item.covered / item.total) * 100);
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.category}</span>
                      <span className="text-sm">
                        <span className="text-foreground">{item.covered}</span>
                        <span className="text-muted-foreground"> / {item.total}</span>
                        <span className={`ml-2 ${percentage >= 90 ? 'text-green-500' : 'text-orange-500'}`}>
                          ({percentage}%)
                        </span>
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Coverage</span>
                <span className="text-lg font-bold text-green-500">
                  {Math.round(
                    (assetCoverage.reduce((s, a) => s + a.covered, 0) / 
                     assetCoverage.reduce((s, a) => s + a.total, 0)) * 100
                  )}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Incident Trend</CardTitle>
          <CardDescription>Incidents by severity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyIncidents}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))' 
                }} 
              />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
              <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
              <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
              <Bar dataKey="low" stackId="a" fill="#3b82f6" name="Low" />
            </BarChart>
          </ResponsiveContainer>
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
