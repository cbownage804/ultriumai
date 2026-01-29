import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, TrendingUp, CheckCircle2, XCircle, DollarSign,
  Clock, Zap, BarChart3, PieChart as PieIcon, Target
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const RESOLUTION_TREND = [
  { date: '01/22', aiResolved: 65, humanResolved: 35 },
  { date: '01/23', aiResolved: 68, humanResolved: 32 },
  { date: '01/24', aiResolved: 71, humanResolved: 29 },
  { date: '01/25', aiResolved: 69, humanResolved: 31 },
  { date: '01/26', aiResolved: 74, humanResolved: 26 },
  { date: '01/27', aiResolved: 72, humanResolved: 28 },
  { date: '01/28', aiResolved: 76, humanResolved: 24 },
  { date: '01/29', aiResolved: 78, humanResolved: 22 }
];

const CONFIDENCE_DISTRIBUTION = [
  { range: '90-100%', count: 456, color: '#22d3ee' },
  { range: '80-89%', count: 312, color: '#a78bfa' },
  { range: '70-79%', count: 189, color: '#f59e0b' },
  { range: '60-69%', count: 87, color: '#f87171' },
  { range: '<60%', count: 23, color: '#64748b' }
];

const OVERRIDE_REASONS = [
  { reason: 'Incorrect Category', count: 45 },
  { reason: 'Wrong Priority', count: 32 },
  { reason: 'Better Solution Found', count: 28 },
  { reason: 'Customer Preference', count: 19 },
  { reason: 'Complex Edge Case', count: 12 }
];

export function CortexAnalyticsDashboard() {
  const totalTickets = 1247;
  const aiResolved = 972;
  const humanOverrides = 136;
  const avgConfidence = 87;
  const costSavings = 45200;
  const hoursSaved = 312;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Cortex AI Analytics</h2>
            <p className="text-sm text-slate-400">Performance metrics and ROI tracking</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 text-white px-3 py-1">
          <Zap className="h-3.5 w-3.5 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-500">AI Resolution Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-400">
              {Math.round((aiResolved / totalTickets) * 100)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">{aiResolved.toLocaleString()} tickets</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-500">Avg Confidence</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{avgConfidence}%</p>
            <Progress value={avgConfidence} className="mt-2 h-1 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-slate-500">Human Overrides</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {Math.round((humanOverrides / totalTickets) * 100)}%
            </p>
            <p className="text-xs text-slate-500 mt-1">{humanOverrides} corrections</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Hours Saved</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{hoursSaved}</p>
            <p className="text-xs text-slate-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-500">Cost Savings</span>
            </div>
            <p className="text-2xl font-bold text-green-400">${(costSavings / 1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-500 mt-1">Estimated this month</p>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-500">Improvement</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">+12%</p>
            <p className="text-xs text-slate-500 mt-1">vs last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Resolution Trend */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              AI vs Human Resolution Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RESOLUTION_TREND}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="aiResolved"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ fill: '#22d3ee', strokeWidth: 0 }}
                    name="AI Resolved %"
                  />
                  <Line
                    type="monotone"
                    dataKey="humanResolved"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ fill: '#a78bfa', strokeWidth: 0 }}
                    name="Human Resolved %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400" />
                <span className="text-xs text-slate-400">AI Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-400" />
                <span className="text-xs text-slate-400">Human Resolved</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card className="bg-black/80 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-sm flex items-center gap-2">
              <PieIcon className="h-4 w-4" />
              Confidence Score Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CONFIDENCE_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {CONFIDENCE_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #22d3ee40',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value} tickets`,
                      props.payload.range
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {CONFIDENCE_DISTRIBUTION.map((item) => (
                <div key={item.range} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.range}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Override Reasons */}
      <Card className="bg-black/80 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Human Override Reasons
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OVERRIDE_REASONS} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="reason"
                  stroke="#64748b"
                  fontSize={12}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #22d3ee40',
                    borderRadius: '8px'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ROI Summary */}
      <Card className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 border-cyan-500/30">
        <CardContent className="py-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white mb-2">Monthly ROI Summary</h3>
            <div className="grid md:grid-cols-4 gap-6 mt-4">
              <div>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-cyan-200 bg-clip-text text-transparent">
                  {hoursSaved}h
                </p>
                <p className="text-sm text-slate-400">Technician Hours Saved</p>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-green-200 bg-clip-text text-transparent">
                  ${costSavings.toLocaleString()}
                </p>
                <p className="text-sm text-slate-400">Estimated Cost Savings</p>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-purple-200 bg-clip-text text-transparent">
                  78%
                </p>
                <p className="text-sm text-slate-400">AI Resolution Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-b from-white to-amber-200 bg-clip-text text-transparent">
                  4.2x
                </p>
                <p className="text-sm text-slate-400">ROI Multiplier</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
