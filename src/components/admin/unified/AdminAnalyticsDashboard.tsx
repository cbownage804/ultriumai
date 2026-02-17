import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Users, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Monitor, Smartphone, Globe, DollarSign, UserMinus, UserPlus, CreditCard, Flame, Clock, RefreshCw, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

// Generate realistic mock data
const generateDauData = (days: number) => Array.from({ length: days }, (_, i) => ({
  date: `${['Jan','Feb'][Math.floor(i/28)]} ${(i % 28) + 1}`,
  dau: Math.floor(120 + Math.sin(i * 0.3) * 40 + Math.random() * 30),
  wau: Math.floor(300 + Math.sin(i * 0.15) * 60 + Math.random() * 40),
}));

const revenueData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  mrr: Math.floor(8000 + i * 1200 + Math.random() * 500),
  newRevenue: Math.floor(1000 + Math.random() * 800),
  churnRevenue: Math.floor(200 + Math.random() * 400),
  expansion: Math.floor(300 + Math.random() * 600),
}));

const productAdoptionData = [
  { name: 'AI Studio', users7d: 142, users30d: 389, newActivations: 34, retention: 78, color: 'hsl(var(--primary))' },
  { name: 'Vanguard', users7d: 98, users30d: 267, newActivations: 21, retention: 82, color: 'hsl(180, 80%, 50%)' },
  { name: 'SafeSuite', users7d: 76, users30d: 198, newActivations: 15, retention: 71, color: 'hsl(280, 70%, 55%)' },
];

const pageTrafficData = [
  { page: '/hub', views: 4821, uniqueUsers: 312 },
  { page: '/ai-studio', views: 3204, uniqueUsers: 245 },
  { page: '/vanguard/app/dashboard', views: 2187, uniqueUsers: 198 },
  { page: '/safesuite', views: 1543, uniqueUsers: 156 },
  { page: '/settings', views: 987, uniqueUsers: 134 },
  { page: '/profile', views: 756, uniqueUsers: 112 },
  { page: '/credits', views: 543, uniqueUsers: 89 },
  { page: '/billing', views: 421, uniqueUsers: 76 },
];

const funnelData = [
  { stage: 'Signed Up', count: 500, pct: 100 },
  { stage: 'Email Verified', count: 420, pct: 84 },
  { stage: 'Onboarding Done', count: 310, pct: 62 },
  { stage: 'First Product Used', count: 245, pct: 49 },
  { stage: 'Active (7d)', count: 180, pct: 36 },
  { stage: 'Subscribed', count: 92, pct: 18 },
];

const deviceData = [
  { name: 'Desktop', value: 68, color: 'hsl(var(--primary))' },
  { name: 'Mobile', value: 24, color: 'hsl(180, 80%, 50%)' },
  { name: 'Tablet', value: 8, color: 'hsl(280, 70%, 55%)' },
];

const churnData = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  churnRate: +(2.5 + Math.sin(i * 0.5) * 1.2 + Math.random() * 0.5).toFixed(1),
  newUsers: Math.floor(40 + Math.random() * 30),
  lostUsers: Math.floor(8 + Math.random() * 12),
}));

const cohortData = [
  { cohort: 'Jan', m0: 100, m1: 72, m2: 58, m3: 49, m4: 42, m5: 38 },
  { cohort: 'Feb', m0: 100, m1: 75, m2: 61, m3: 52, m4: 45 },
  { cohort: 'Mar', m0: 100, m1: 78, m2: 64, m3: 55 },
  { cohort: 'Apr', m0: 100, m1: 80, m2: 67 },
  { cohort: 'May', m0: 100, m1: 76 },
  { cohort: 'Jun', m0: 100 },
];

export function AdminAnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [realTimeUsers, setRealTimeUsers] = useState(23);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  // Fetch real user count
  useEffect(() => {
    const fetchUserCount = async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      if (count !== null) setTotalUsers(count);
    };
    fetchUserCount();
  }, []);

  // Simulate real-time user fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUsers(prev => Math.max(5, prev + Math.floor(Math.random() * 7) - 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const dauData = generateDauData(period === '7d' ? 7 : period === '30d' ? 30 : 90);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Platform Analytics
          </h2>
          <p className="text-muted-foreground">Usage metrics, revenue, and user engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-500">{realTimeUsers} online</span>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards — 2 rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Users" value={totalUsers?.toLocaleString() ?? '—'} change="+14%" positive icon={Users} />
        <KPICard title="Daily Active Users" value="184" change="+12%" positive icon={Activity} />
        <KPICard title="Monthly Revenue (MRR)" value="$18,400" change="+22%" positive icon={DollarSign} accent="text-green-500" />
        <KPICard title="Churn Rate" value="3.2%" change="-0.4%" positive icon={UserMinus} accent="text-destructive" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Activation Rate" value="49%" change="+3%" positive icon={Zap} />
        <KPICard title="Avg Session" value="14m 32s" change="+5%" positive icon={Clock} />
        <KPICard title="New Subscriptions" value="38" change="+18%" positive icon={CreditCard} accent="text-green-500" />
        <KPICard title="Net Revenue Retention" value="112%" change="+4%" positive icon={TrendingUp} accent="text-green-500" />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="churn">Churn & Retention</TabsTrigger>
          <TabsTrigger value="adoption">Product Adoption</TabsTrigger>
          <TabsTrigger value="traffic">Page Traffic</TabsTrigger>
          <TabsTrigger value="funnel">Activation Funnel</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" /> Monthly Recurring Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={revenueData}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Area type="monotone" dataKey="mrr" stroke="hsl(142, 71%, 45%)" fill="url(#mrrGrad)" strokeWidth={2} />
                    <Bar dataKey="newRevenue" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} barSize={12} name="New" />
                    <Bar dataKey="expansion" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} barSize={12} name="Expansion" />
                    <Bar dataKey="churnRevenue" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} barSize={12} name="Churned" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current MRR</span>
                    <span className="text-xl font-bold text-foreground">$18,400</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ARR</span>
                    <span className="text-lg font-semibold text-foreground">$220,800</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ARPU</span>
                    <span className="text-sm font-medium text-foreground">$39.40</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">LTV</span>
                    <span className="text-sm font-medium text-foreground">$1,231</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Revenue by Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Vanguard', revenue: 9200, pct: 50, color: 'hsl(180, 80%, 50%)' },
                    { name: 'AI Studio', revenue: 5520, pct: 30, color: 'hsl(var(--primary))' },
                    { name: 'SafeSuite', revenue: 3680, pct: 20, color: 'hsl(280, 70%, 55%)' },
                  ].map(p => (
                    <div key={p.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="font-medium text-foreground">${p.revenue.toLocaleString()}/mo</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Engagement */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader><CardTitle className="text-lg">Daily Active Users</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={dauData}>
                  <defs>
                    <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                  <Area type="monotone" dataKey="dau" stroke="hsl(var(--primary))" fill="url(#dauGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="wau" stroke="hsl(180, 80%, 50%)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg">Device Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {deviceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {deviceData.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      {d.name === 'Desktop' ? <Monitor className="h-4 w-4 text-muted-foreground" /> :
                       d.name === 'Mobile' ? <Smartphone className="h-4 w-4 text-muted-foreground" /> :
                       <Globe className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm text-foreground w-16">{d.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full w-32">
                        <div className="h-2 rounded-full" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                      </div>
                      <span className="text-sm font-medium text-foreground">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn & Retention — NEW */}
        <TabsContent value="churn">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserMinus className="h-4 w-4 text-destructive" /> Churn Rate Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                    <Line type="monotone" dataKey="churnRate" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserPlus className="h-4 w-4 text-green-500" /> Net User Growth</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                    <Bar dataKey="newUsers" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="New Users" />
                    <Bar dataKey="lostUsers" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Lost Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cohort Retention Table */}
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Cohort Retention (%)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Cohort</th>
                      {['Month 0','Month 1','Month 2','Month 3','Month 4','Month 5'].map(m => (
                        <th key={m} className="text-center py-2 px-3 font-medium text-muted-foreground">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map(row => (
                      <tr key={row.cohort} className="border-b border-border/50">
                        <td className="py-2 px-3 font-medium text-foreground">{row.cohort}</td>
                        {[row.m0, row.m1, row.m2, row.m3, row.m4, row.m5].map((val, i) => (
                          <td key={i} className="py-2 px-3 text-center">
                            {val !== undefined ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: `hsl(var(--primary) / ${(val / 100) * 0.5})`,
                                  color: val > 60 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                                }}
                              >
                                {val}%
                              </span>
                            ) : <span className="text-muted-foreground/30">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Adoption */}
        <TabsContent value="adoption">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {productAdoptionData.map((product) => (
              <Card key={product.name}>
                <CardHeader className="pb-3"><CardTitle className="text-base">{product.name}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">7-day users</span>
                    <span className="font-semibold text-foreground">{product.users7d}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">30-day users</span>
                    <span className="font-semibold text-foreground">{product.users30d}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New activations</span>
                    <Badge variant="secondary" className="text-xs">{product.newActivations}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Retention</span>
                    <span className="font-semibold text-green-500">{product.retention}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${(product.users7d / product.users30d) * 100}%`, backgroundColor: product.color }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{Math.round((product.users7d / product.users30d) * 100)}% weekly retention</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Page Traffic */}
        <TabsContent value="traffic">
          <Card>
            <CardHeader><CardTitle className="text-lg">Top Pages by Traffic</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={pageTrafficData} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="page" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--popover-foreground))' }} />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="uniqueUsers" fill="hsl(180, 80%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activation Funnel */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader><CardTitle className="text-lg">Signup → Subscription Funnel</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funnelData.map((step, i) => (
                  <div key={step.stage} className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-40 shrink-0">{step.stage}</span>
                    <div className="flex-1 h-8 bg-muted rounded relative overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500 flex items-center px-3"
                        style={{
                          width: `${step.pct}%`,
                          backgroundColor: `hsl(var(--primary) / ${0.3 + (step.pct / 100) * 0.7})`,
                        }}
                      >
                        <span className="text-xs font-medium text-foreground">{step.count}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground w-12 text-right">{step.pct}%</span>
                    {i > 0 && (
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {Math.round((step.count / funnelData[i - 1].count) * 100)}% conv
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({ title, value, change, positive, icon: Icon, accent }: { title: string; value: string; change: string; positive: boolean; icon: React.ElementType; accent?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${accent || 'text-foreground'}`}>{value}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {positive ? <ArrowUpRight className="h-3 w-3 text-green-500" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
          <span className={`text-xs font-medium ${positive ? 'text-green-500' : 'text-destructive'}`}>{change}</span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminAnalyticsDashboard;
