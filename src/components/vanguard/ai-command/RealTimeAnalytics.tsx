import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle,
  ThumbsUp, ThumbsDown, Bot, Brain, DollarSign, Users, Ticket,
  Zap, Activity, Target, Sparkles
} from 'lucide-react';

const resolutionData = [
  { time: '00:00', auto: 45, manual: 12, escalated: 3 },
  { time: '04:00', auto: 23, manual: 8, escalated: 2 },
  { time: '08:00', auto: 78, manual: 25, escalated: 8 },
  { time: '12:00', auto: 92, manual: 31, escalated: 5 },
  { time: '16:00', auto: 85, manual: 28, escalated: 6 },
  { time: '20:00', auto: 56, manual: 15, escalated: 4 }
];

const categoryPerformance = [
  { category: 'Password Reset', accuracy: 96, volume: 234, autoRate: 92 },
  { category: 'Software Install', accuracy: 89, volume: 156, autoRate: 78 },
  { category: 'Network Issues', accuracy: 78, volume: 98, autoRate: 45 },
  { category: 'Email Problems', accuracy: 85, volume: 187, autoRate: 82 },
  { category: 'Hardware', accuracy: 62, volume: 67, autoRate: 28 },
  { category: 'Billing', accuracy: 91, volume: 89, autoRate: 85 }
];

const sentimentTrend = [
  { day: 'Mon', positive: 68, neutral: 24, negative: 8 },
  { day: 'Tue', positive: 72, neutral: 20, negative: 8 },
  { day: 'Wed', positive: 65, neutral: 25, negative: 10 },
  { day: 'Thu', positive: 78, neutral: 18, negative: 4 },
  { day: 'Fri', positive: 75, neutral: 20, negative: 5 },
  { day: 'Sat', positive: 82, neutral: 15, negative: 3 },
  { day: 'Sun', positive: 80, neutral: 16, negative: 4 }
];

const costSavings = [
  { month: 'Jan', savings: 4200, manual: 8500 },
  { month: 'Feb', savings: 5100, manual: 8200 },
  { month: 'Mar', savings: 6800, manual: 7800 },
  { month: 'Apr', savings: 8200, manual: 7200 },
  { month: 'May', savings: 9500, manual: 6800 },
  { month: 'Jun', savings: 11200, manual: 6200 }
];

const COLORS = ['#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6'];

export function RealTimeAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [liveMetrics, setLiveMetrics] = useState({
    ticketsProcessed: 1247,
    autoResolved: 892,
    avgResponseTime: 28,
    satisfactionRate: 94,
    costSaved: 47500
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        ticketsProcessed: prev.ticketsProcessed + Math.floor(Math.random() * 3),
        autoResolved: prev.autoResolved + Math.floor(Math.random() * 2),
        avgResponseTime: 25 + Math.floor(Math.random() * 10),
        satisfactionRate: 92 + Math.floor(Math.random() * 5),
        costSaved: prev.costSaved + Math.floor(Math.random() * 50)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const autoResolvedPercent = Math.round((liveMetrics.autoResolved / liveMetrics.ticketsProcessed) * 100);

  return (
    <div className="space-y-6">
      {/* Live Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Tickets Today</p>
                <motion.p
                  key={liveMetrics.ticketsProcessed}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-white"
                >
                  {liveMetrics.ticketsProcessed.toLocaleString()}
                </motion.p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <Ticket className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <TrendingUp className="h-3 w-3" />
              +12% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Auto-Resolved</p>
                <p className="text-2xl font-bold text-green-400">{autoResolvedPercent}%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <Bot className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <Progress value={autoResolvedPercent} className="mt-2 h-1.5 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Avg Response</p>
                <motion.p
                  key={liveMetrics.avgResponseTime}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-purple-400"
                >
                  {liveMetrics.avgResponseTime}s
                </motion.p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-400">
              <TrendingDown className="h-3 w-3" />
              -8s from last week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Satisfaction</p>
                <motion.p
                  key={liveMetrics.satisfactionRate}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-amber-400"
                >
                  {liveMetrics.satisfactionRate}%
                </motion.p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/20">
                <ThumbsUp className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/80 border-cyan-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Cost Saved</p>
                <motion.p
                  key={liveMetrics.costSaved}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                >
                  ${liveMetrics.costSaved.toLocaleString()}
                </motion.p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/60 border border-cyan-500/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            Overview
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            Categories
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="roi" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            ROI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Resolution Timeline (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={resolutionData}>
                    <defs>
                      <linearGradient id="autoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="manualGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #06b6d4', borderRadius: '8px' }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Area type="monotone" dataKey="auto" stroke="#22c55e" fill="url(#autoGradient)" name="Auto-Resolved" />
                    <Area type="monotone" dataKey="manual" stroke="#06b6d4" fill="url(#manualGradient)" name="Manual" />
                    <Area type="monotone" dataKey="escalated" stroke="#ef4444" fill="transparent" name="Escalated" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryPerformance}
                      dataKey="volume"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={2}
                    >
                      {categoryPerformance.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #8b5cf6', borderRadius: '8px' }}
                    />
                    <Legend
                      formatter={(value) => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Category Performance</CardTitle>
              <CardDescription className="text-slate-400">AI accuracy and automation rate by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPerformance.map((cat) => (
                  <div key={cat.category} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{cat.category}</h4>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="border-cyan-500/40 text-cyan-400">
                          {cat.volume} tickets
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">AI Accuracy</span>
                          <span className={cat.accuracy >= 85 ? 'text-green-400' : cat.accuracy >= 70 ? 'text-amber-400' : 'text-red-400'}>
                            {cat.accuracy}%
                          </span>
                        </div>
                        <Progress value={cat.accuracy} className="h-2 bg-slate-800" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Auto-Resolution</span>
                          <span className="text-purple-400">{cat.autoRate}%</span>
                        </div>
                        <Progress value={cat.autoRate} className="h-2 bg-slate-800" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="mt-4">
          <Card className="bg-black/80 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-amber-400 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Sentiment Trends (7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={sentimentTrend} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #f59e0b', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="positive" fill="#22c55e" name="Positive" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="neutral" fill="#64748b" name="Neutral" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="negative" fill="#ef4444" name="Negative" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Savings Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costSavings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22c55e', borderRadius: '8px' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} name="AI Savings" />
                    <Line type="monotone" dataKey="manual" stroke="#64748b" strokeWidth={2} dot={{ fill: '#64748b' }} name="Manual Cost" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-black/80 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400">ROI Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Savings (6 months)</span>
                    <span className="text-2xl font-bold text-green-400">$45,000</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-500">Hours Saved</p>
                    <p className="text-xl font-bold text-cyan-400">1,247</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-500">FTE Equivalent</p>
                    <p className="text-xl font-bold text-purple-400">2.3</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-500">Avg Cost/Ticket (Before)</p>
                    <p className="text-xl font-bold text-red-400">$18.50</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                    <p className="text-xs text-slate-500">Avg Cost/Ticket (After)</p>
                    <p className="text-xl font-bold text-green-400">$4.20</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ROI</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      340%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
