/**
 * Ledger: Fleet & RMM Reports - Pulls real data from vanguard_agents, patches, asset_risk_scores
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor, Shield, HardDrive, Wifi, WifiOff, CheckCircle2, XCircle,
  Download, Sparkles, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#22d3ee', '#f59e0b', '#ef4444', '#a855f7', '#6366f1'];

export function FleetReports() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [patches, setPatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [ag, pa] = await Promise.all([
        supabase.from('vanguard_agents').select('*').eq('user_id', user.id),
        (supabase as any).from('patches').select('*').eq('user_id', user.id).limit(500),
      ]);
      setAgents(ag.data || []);
      setPatches(pa.data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = agents.length;
    const online = agents.filter(a => a.status === 'online' || a.is_online).length;
    const offline = total - online;
    const byOS: Record<string, number> = {};
    agents.forEach(a => { const os = a.os_type || a.operating_system || 'Unknown'; byOS[os] = (byOS[os] || 0) + 1; });
    const osData = Object.entries(byOS).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

    const totalPatches = patches.length;
    const installed = patches.filter(p => p.status === 'installed' || p.status === 'completed').length;
    const pending = patches.filter(p => p.status === 'pending' || p.status === 'available').length;
    const failed = patches.filter(p => p.status === 'failed').length;
    const patchRate = totalPatches > 0 ? Math.round((installed / totalPatches) * 100) : 100;

    return { total, online, offline, osData, totalPatches, installed, pending, failed, patchRate };
  }, [agents, patches]);

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const context = {
        fleet: `${stats.total} devices (${stats.online} online, ${stats.offline} offline)`,
        os: stats.osData.map(o => `${o.name}: ${o.value}`).join(', '),
        patches: `${stats.installed}/${stats.totalPatches} installed (${stats.patchRate}%), ${stats.pending} pending, ${stats.failed} failed`,
      };
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Analyze this fleet/RMM posture and provide an executive summary with risks and recommendations:\n${JSON.stringify(context, null, 2)}`,
          model: 'gpt-4o-mini',
          systemPrompt: 'You are an IT fleet management expert. Provide concise executive summaries with actionable recommendations for MSP fleet health.',
        },
      });
      if (data?.response) setAiInsight(data.response);
    } catch { toast.error('Failed to generate AI insight'); }
    finally { setLoadingAI(false); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-cyan-500/30">
          <CardContent className="p-4"><div className="flex items-center gap-3"><Monitor className="h-5 w-5 text-cyan-400" /><div><p className="text-2xl font-bold text-cyan-400">{stats.total}</p><p className="text-xs text-muted-foreground">Total Devices</p></div></div></CardContent>
        </Card>
        <Card className="bg-black/60 border-emerald-500/30">
          <CardContent className="p-4"><div className="flex items-center gap-3"><Wifi className="h-5 w-5 text-emerald-400" /><div><p className="text-2xl font-bold text-emerald-400">{stats.online}</p><p className="text-xs text-muted-foreground">Online</p></div></div></CardContent>
        </Card>
        <Card className="bg-black/60 border-red-500/30">
          <CardContent className="p-4"><div className="flex items-center gap-3"><WifiOff className="h-5 w-5 text-red-400" /><div><p className="text-2xl font-bold text-red-400">{stats.offline}</p><p className="text-xs text-muted-foreground">Offline</p></div></div></CardContent>
        </Card>
        <Card className="bg-black/60 border-amber-500/30">
          <CardContent className="p-4"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-amber-400" /><div><p className="text-2xl font-bold text-amber-400">{stats.patchRate}%</p><p className="text-xs text-muted-foreground">Patch Compliance</p></div></div></CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-400" />Cortex AI Fleet Insight</CardTitle>
            <Button size="sm" onClick={generateAIInsight} disabled={loadingAI} className="bg-purple-600 hover:bg-purple-700">
              {loadingAI ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generate AI Summary
            </Button>
          </div>
        </CardHeader>
        {aiInsight && <CardContent><div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-4">{aiInsight}</div></CardContent>}
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
          <TabsTrigger value="patches">Patch Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader><CardTitle className="text-sm">OS Distribution</CardTitle></CardHeader>
              <CardContent>
                {stats.osData.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={stats.osData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {stats.osData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie><Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} /><Legend /></PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-center text-muted-foreground py-8">No device data</p>}
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader><CardTitle className="text-sm">Device Status</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{ name: 'Online', value: stats.online, fill: '#10b981' }, { name: 'Offline', value: stats.offline, fill: '#ef4444' }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Bar dataKey="value" fill="#22d3ee" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patches" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30"><CardContent className="p-4 text-center"><CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" /><p className="text-3xl font-bold text-emerald-400">{stats.installed}</p><p className="text-xs text-muted-foreground">Installed</p></CardContent></Card>
            <Card className="bg-amber-500/10 border-amber-500/30"><CardContent className="p-4 text-center"><AlertTriangle className="h-6 w-6 text-amber-400 mx-auto mb-1" /><p className="text-3xl font-bold text-amber-400">{stats.pending}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
            <Card className="bg-red-500/10 border-red-500/30"><CardContent className="p-4 text-center"><XCircle className="h-6 w-6 text-red-400 mx-auto mb-1" /><p className="text-3xl font-bold text-red-400">{stats.failed}</p><p className="text-xs text-muted-foreground">Failed</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
