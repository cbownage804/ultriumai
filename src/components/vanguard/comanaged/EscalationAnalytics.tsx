/**
 * Escalation Analytics Dashboard
 * Time-to-escalate metrics, resolution by tier, escalation patterns
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowUpRight, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Layers,
  Users,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";

// Mock data
const escalationByTier = [
  { tier: 'Tier 1 → 2', count: 145, avgTime: 42, resolved: 89 },
  { tier: 'Tier 2 → 3', count: 56, avgTime: 128, resolved: 45 },
  { tier: 'Tier 3 → Vendor', count: 12, avgTime: 240, resolved: 8 },
  { tier: 'Internal → MSP', count: 78, avgTime: 65, resolved: 71 },
];

const escalationReasons = [
  { name: 'Skill Gap', value: 35, color: '#22d3ee' },
  { name: 'SLA Breach', value: 28, color: '#f59e0b' },
  { name: 'Customer Request', value: 22, color: '#8b5cf6' },
  { name: 'Complexity', value: 15, color: '#ef4444' },
];

const weeklyTrend = [
  { week: 'Week 1', escalations: 45, resolved: 38, avgTime: 58 },
  { week: 'Week 2', escalations: 52, resolved: 44, avgTime: 62 },
  { week: 'Week 3', escalations: 38, resolved: 35, avgTime: 48 },
  { week: 'Week 4', escalations: 41, resolved: 39, avgTime: 52 },
];

const topEscalators = [
  { name: 'Mike Johnson', escalations: 22, rate: 18.3, trend: 'up' },
  { name: 'Sarah Martinez', escalations: 15, rate: 11.1, trend: 'stable' },
  { name: 'Alex Chen', escalations: 8, rate: 5.5, trend: 'down' },
];

export const EscalationAnalytics = () => {
  const [period, setPeriod] = useState('30_days');

  const totalEscalations = escalationByTier.reduce((sum, t) => sum + t.count, 0);
  const avgEscalationTime = Math.round(
    escalationByTier.reduce((sum, t) => sum + (t.avgTime * t.count), 0) / totalEscalations
  );
  const resolutionRate = Math.round(
    (escalationByTier.reduce((sum, t) => sum + t.resolved, 0) / totalEscalations) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Escalation Analytics</h2>
          <p className="text-white/60">Track escalation patterns and resolution by tier</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7_days">Last 7 Days</SelectItem>
            <SelectItem value="30_days">Last 30 Days</SelectItem>
            <SelectItem value="90_days">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Escalations</p>
                <p className="text-2xl font-bold text-white">{totalEscalations}</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/20">
                <ArrowUpRight className="h-5 w-5 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingDown className="h-4 w-4 text-green-400" />
              <span className="text-green-400">12% lower</span>
              <span className="text-white/40">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg Time to Escalate</p>
                <p className="text-2xl font-bold text-white">{avgEscalationTime}m</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <TrendingUp className="h-4 w-4 text-red-400" />
              <span className="text-red-400">8% higher</span>
              <span className="text-white/40">vs target</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Resolution After Esc.</p>
                <p className="text-2xl font-bold text-green-400">{resolutionRate}%</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-white/40">Target: 85%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Escalation Rate</p>
                <p className="text-2xl font-bold text-white">12.4%</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Layers className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              <span className="text-white/40">of all tickets</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escalation by Tier */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Escalations by Tier
            </CardTitle>
            <CardDescription className="text-white/60">
              Volume and resolution time per escalation path
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={escalationByTier} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <YAxis type="category" dataKey="tier" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="count" fill="#22d3ee" name="Count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Escalation Reasons */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              Escalation Reasons
            </CardTitle>
            <CardDescription className="text-white/60">
              Why tickets are escalated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={escalationReasons}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {escalationReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '8px', color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {escalationReasons.map((reason) => (
                  <div key={reason.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: reason.color }} />
                    <span className="text-sm text-white/80">{reason.name}</span>
                    <span className="text-sm text-white/60 ml-auto">{reason.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Weekly Trend
            </CardTitle>
            <CardDescription className="text-white/60">
              Escalation volume and resolution over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="week" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: '8px', color: 'white' }} />
                  <Legend />
                  <Line type="monotone" dataKey="escalations" stroke="#f59e0b" strokeWidth={2} name="Escalations" dot={false} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} name="Resolved" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Escalators */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Technician Escalation Rates
            </CardTitle>
            <CardDescription className="text-white/60">
              Who escalates most frequently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topEscalators.map((tech, i) => (
                <div key={tech.name} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-sm font-medium">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{tech.name}</p>
                    <p className="text-sm text-white/60">{tech.escalations} escalations</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{tech.rate}%</p>
                    <div className="flex items-center gap-1 text-xs">
                      {tech.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-400" />}
                      {tech.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-400" />}
                      <span className={tech.trend === 'up' ? 'text-red-400' : tech.trend === 'down' ? 'text-green-400' : 'text-white/40'}>
                        {tech.trend === 'stable' ? 'Stable' : tech.trend === 'up' ? 'Rising' : 'Improving'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EscalationAnalytics;
