/**
 * Ledger: Atlas Documentation Reports - Pulls from atlas_* tables
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText, Key, Shield, Server, BookOpen, Users, Sparkles, Loader2, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export function AtlasReports() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ documents: 0, passwords: 0, ssl: 0, configs: 0, runbooks: 0, contacts: 0, checklists: 0 });
  const [docs, setDocs] = useState<any[]>([]);
  const [sslCerts, setSSLCerts] = useState<any[]>([]);
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
      const [d, p, s, c, r, co, ch] = await Promise.all([
        supabase.from('atlas_documents').select('id,title,updated_at,category').eq('user_id', user.id),
        supabase.from('atlas_passwords').select('id').eq('user_id', user.id),
        supabase.from('atlas_ssl_certificates').select('id,domain,valid_until').eq('user_id', user.id),
        supabase.from('atlas_configurations').select('id').eq('user_id', user.id),
        supabase.from('atlas_runbooks').select('id').eq('user_id', user.id),
        supabase.from('atlas_contacts').select('id').eq('user_id', user.id),
        supabase.from('atlas_checklists').select('id').eq('user_id', user.id),
      ]);
      setStats({
        documents: d.data?.length || 0, passwords: p.data?.length || 0, ssl: s.data?.length || 0,
        configs: c.data?.length || 0, runbooks: r.data?.length || 0, contacts: co.data?.length || 0, checklists: ch.data?.length || 0,
      });
      setDocs(d.data || []);
      setSSLCerts(s.data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const staleDocs = useMemo(() => docs.filter(d => differenceInDays(new Date(), new Date(d.updated_at)) > 90), [docs]);
  const expiringSSL = useMemo(() => sslCerts.filter(s => s.valid_until && differenceInDays(new Date(s.valid_until), new Date()) < 30), [sslCerts]);

  const chartData = useMemo(() => [
    { name: 'Documents', count: stats.documents },
    { name: 'Passwords', count: stats.passwords },
    { name: 'SSL Certs', count: stats.ssl },
    { name: 'Configs', count: stats.configs },
    { name: 'Runbooks', count: stats.runbooks },
    { name: 'Contacts', count: stats.contacts },
    { name: 'Checklists', count: stats.checklists },
  ], [stats]);

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const context = {
        ...stats,
        staleDocs: staleDocs.length,
        expiringSSL: expiringSSL.length,
        staleDocNames: staleDocs.slice(0, 5).map(d => d.title).join(', '),
        expiringSSLDomains: expiringSSL.slice(0, 5).map(s => s.domain).join(', '),
      };
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Analyze this IT documentation coverage and provide an executive summary with gaps and recommendations:\n${JSON.stringify(context, null, 2)}`,
          model: 'gpt-4o-mini',
          systemPrompt: 'You are an IT documentation auditor. Identify documentation gaps, stale content risks, and provide actionable recommendations for MSPs.',
        },
      });
      if (data?.response) setAiInsight(data.response);
    } catch { toast.error('Failed to generate AI insight'); }
    finally { setLoadingAI(false); }
  };

  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-cyan-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-cyan-400" /><div><p className="text-2xl font-bold text-cyan-400">{totalItems}</p><p className="text-xs text-muted-foreground">Total Items</p></div></div></CardContent></Card>
        <Card className="bg-black/60 border-emerald-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-emerald-400" /><div><p className="text-2xl font-bold text-emerald-400">{stats.documents + stats.runbooks}</p><p className="text-xs text-muted-foreground">Docs & Runbooks</p></div></div></CardContent></Card>
        <Card className="bg-black/60 border-amber-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><div><p className="text-2xl font-bold text-amber-400">{staleDocs.length}</p><p className="text-xs text-muted-foreground">Stale Docs (90d+)</p></div></div></CardContent></Card>
        <Card className="bg-black/60 border-red-500/30"><CardContent className="p-4"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-red-400" /><div><p className="text-2xl font-bold text-red-400">{expiringSSL.length}</p><p className="text-xs text-muted-foreground">SSL Expiring &lt;30d</p></div></div></CardContent></Card>
      </div>

      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-400" />Cortex AI Documentation Audit</CardTitle>
            <Button size="sm" onClick={generateAIInsight} disabled={loadingAI} className="bg-purple-600 hover:bg-purple-700">
              {loadingAI ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generate AI Audit
            </Button>
          </div>
        </CardHeader>
        {aiInsight && <CardContent><div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-4">{aiInsight}</div></CardContent>}
      </Card>

      <Card className="bg-black/60 border-slate-700/50">
        <CardHeader><CardTitle className="text-sm">Documentation Coverage</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {staleDocs.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-400" />Stale Documentation (not updated in 90+ days)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staleDocs.slice(0, 10).map(d => (
                <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                  <span className="text-sm">{d.title}</span>
                  <Badge variant="outline" className="text-[10px] text-amber-400">{differenceInDays(new Date(), new Date(d.updated_at))}d ago</Badge>
                </div>
              ))}
              {staleDocs.length > 10 && <p className="text-xs text-muted-foreground">...and {staleDocs.length - 10} more</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
