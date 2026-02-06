/**
 * Ledger: Sentinel SaaS Security Reports - Pulls from realtime_alerts
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, Shield, Activity, TrendingUp, Sparkles, Loader2, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays, differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22d3ee', '#10b981', '#a855f7'];

export function SentinelReports() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase.from('realtime_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1000);
      setAlerts(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const stats = useMemo(() => {
    const total = alerts.length;
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const high = alerts.filter(a => a.severity === 'high').length;
    const medium = alerts.filter(a => a.severity === 'medium').length;
    const resolved = alerts.filter(a => a.status === 'resolved' || a.status === 'acknowledged').length;

    // By severity
    const bySeverity = [
      { name: 'Critical', value: critical, color: '#ef4444' },
      { name: 'High', value: high, color: '#f97316' },
      { name: 'Medium', value: medium, color: '#f59e0b' },
      { name: 'Low', value: total - critical - high - medium, color: '#22d3ee' },
    ].filter(d => d.value > 0);

    // By type
    const byType: Record<string, number> = {};
    alerts.forEach(a => { const t = a.alert_type || a.type || 'unknown'; byType[t] = (byType[t] || 0) + 1; });
    const typeData = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }));

    // Trend (last 30 days)
    const trend: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) { trend[format(subDays(new Date(), i), 'MMM dd')] = 0; }
    alerts.forEach(a => {
      const d = format(new Date(a.created_at), 'MMM dd');
      if (trend[d] !== undefined) trend[d]++;
    });
    const trendData = Object.entries(trend).map(([date, count]) => ({ date, alerts: count }));

    return { total, critical, high, resolved, bySeverity, typeData, trendData };
  }, [alerts]);

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const context = {
        total: stats.total, critical: stats.critical, high: stats.high, resolved: stats.resolved,
        topTypes: stats.typeData.slice(0, 5).map(t => `${t.name}: ${t.value}`).join(', '),
      };
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Analyze this SaaS security alert data and provide an executive summary with top threats and recommendations:\n${JSON.stringify(context, null, 2)}`,
          model: 'gpt-4o-mini',
          systemPrompt: 'You are a SaaS security analyst specializing in M365 and Google Workspace threat detection. Provide concise executive summaries.',
        },
      });
      if (data?.response) setAiInsight(data.response);
    } catch { toast.error('Failed to generate AI insight'); }
    finally { setLoadingAI(false); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-amber-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><div><p className="text-2xl font-bold text-amber-400">{stats.total}</p><p className="text-xs text-muted-foreground">Total Alerts</p></div></div></CardContent></Card>
        <Card className="bg-black/60 border-red-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-red-400" /><div><p className="text-2xl font-bold text-red-400">{stats.critical}</p><p className="text-xs text-muted-foreground">Critical</p></div></div></CardContent></Card>
        <Card className="bg-black/60 border-orange-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-orange-400" /><div><p className="text-2xl font-bold text-orange-400">{stats.high}</p><p className="text-xs text-muted-foreground">High</p></div></div></CardContent></Card>
        <Card className="bg-black/60 border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-emerald-400" /><div><p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p><p className="text-xs text-muted-foreground">Resolved</p></div></div></CardContent></Card>
      </div>

      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-400" />Cortex AI Security Insight</CardTitle>
            <Button size="sm" onClick={generateAIInsight} disabled={loadingAI} className="bg-purple-600 hover:bg-purple-700">
              {loadingAI ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generate AI Summary
            </Button>
          </div>
        </CardHeader>
        {aiInsight && <CardContent><div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-4">{aiInsight}</div></CardContent>}
      </Card>

      <Tabs defaultValue="trend">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="trend">Alert Trend</TabsTrigger>
          <TabsTrigger value="severity">By Severity</TabsTrigger>
          <TabsTrigger value="types">By Type</TabsTrigger>
        </TabsList>
        <TabsContent value="trend" className="mt-4">
          <Card className="bg-black/60 border-slate-700/50">
            <CardHeader><CardTitle className="text-sm">Alert Trend (30 days)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Area type="monotone" dataKey="alerts" stroke="#f59e0b" fill="#f59e0b40" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="severity" className="mt-4">
          <Card className="bg-black/60 border-slate-700/50">
            <CardContent className="p-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={stats.bySeverity} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {stats.bySeverity.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} /><Legend /></PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="types" className="mt-4">
          <Card className="bg-black/60 border-slate-700/50">
            <CardContent className="p-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.typeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
