/**
 * Ledger: AI-Enhanced Executive Summary - Cross-module rollup with AI insights
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, Sparkles, Loader2, Download, Ticket, Shield, Monitor, 
  BookOpen, ClipboardCheck, AlertTriangle, TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

export function ExecutiveReport() {
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [aiReport, setAiReport] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const [tickets, agents, alerts, frameworks, documents, passwords] = await Promise.all([
        supabase.from('tickets').select('id,status,priority,created_at,resolved_at,sla_due_at,customer_satisfaction').eq('user_id', user.id).gte('created_at', thirtyDaysAgo),
        supabase.from('vanguard_agents').select('id,status').eq('user_id', user.id),
        (supabase as any).from('realtime_alerts').select('*').eq('user_id', user.id).gte('created_at', thirtyDaysAgo),
        (supabase as any).from('compliance_frameworks').select('*').eq('user_id', user.id),
        supabase.from('atlas_documents').select('id').eq('user_id', user.id),
        supabase.from('atlas_passwords').select('id').eq('user_id', user.id),
      ]);

      const t = tickets.data || [];
      const openTickets = t.filter(x => x.status === 'open' || x.status === 'in_progress').length;
      const resolvedTickets = t.filter(x => x.status === 'resolved' || x.status === 'closed').length;
      const withSLA = t.filter(x => x.sla_due_at && x.resolved_at);
      const slaCompliance = withSLA.length > 0 ? Math.round((withSLA.filter(x => new Date(x.resolved_at!) <= new Date(x.sla_due_at!)).length / withSLA.length) * 100) : 100;
      const csatScores = t.filter(x => x.customer_satisfaction).map(x => x.customer_satisfaction!);
      const avgCSAT = csatScores.length > 0 ? (csatScores.reduce((a, b) => a + b, 0) / csatScores.length).toFixed(1) : 'N/A';

      const ag = agents.data || [];
      const onlineDevices = ag.filter((a: any) => a.status === 'online').length;

      const al = alerts.data || [];
      const criticalAlerts = al.filter(a => a.severity === 'critical').length;

      const fw = frameworks.data || [];
      const avgCompliance = fw.length > 0 ? Math.round(fw.reduce((s, f) => s + ((f.passed_controls || 0) / Math.max(f.total_controls || 1, 1) * 100), 0) / fw.length) : 0;

      setModuleData({
        helpdesk: { total: t.length, open: openTickets, resolved: resolvedTickets, slaCompliance, avgCSAT },
        fleet: { total: ag.length, online: onlineDevices, offline: ag.length - onlineDevices },
        security: { total: al.length, critical: criticalAlerts, resolved: al.filter(a => a.status === 'resolved').length },
        compliance: { frameworks: fw.length, avgScore: avgCompliance },
        documentation: { documents: documents.data?.length || 0, passwords: passwords.data?.length || 0 },
      });
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const generateReport = async () => {
    setLoadingAI(true);
    try {
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Generate a comprehensive MSP executive report based on the last 30 days of data:\n${JSON.stringify(moduleData, null, 2)}`,
          model: 'gpt-4o-mini',
          systemPrompt: `You are a senior MSP business analyst. Generate a formal executive report with:
1. **Executive Summary** (2-3 sentences)
2. **Helpdesk Performance** — ticket metrics, SLA, CSAT
3. **Fleet Health** — device status, offline risks
4. **Security Posture** — alert trends, critical items
5. **Compliance Status** — framework scores
6. **Documentation Coverage** — asset counts
7. **Top 5 Risks & Recommendations**
8. **Strategic Recommendations**
Use markdown formatting. Be specific with numbers.`,
        },
      });
      if (data?.response) setAiReport(data.response);
    } catch { toast.error('Failed to generate report'); }
    finally { setLoadingAI(false); }
  };

  const downloadReport = () => {
    if (!aiReport) return;
    const blob = new Blob([`# Executive Report — ${format(new Date(), 'MMMM yyyy')}\n\n${aiReport}`], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `executive-report-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    toast.success('Report downloaded');
  };

  const h = moduleData.helpdesk || {};
  const f = moduleData.fleet || {};
  const s = moduleData.security || {};
  const c = moduleData.compliance || {};
  const d = moduleData.documentation || {};

  return (
    <div className="space-y-6">
      {/* Cross-module KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-black/60 border-indigo-500/30"><CardContent className="p-3 text-center"><Ticket className="h-4 w-4 text-indigo-400 mx-auto mb-1" /><p className="text-xl font-bold">{h.open || 0}</p><p className="text-[10px] text-muted-foreground">Open Tickets</p></CardContent></Card>
        <Card className="bg-black/60 border-emerald-500/30"><CardContent className="p-3 text-center"><TrendingUp className="h-4 w-4 text-emerald-400 mx-auto mb-1" /><p className="text-xl font-bold">{h.slaCompliance || 0}%</p><p className="text-[10px] text-muted-foreground">SLA Compliance</p></CardContent></Card>
        <Card className="bg-black/60 border-cyan-500/30"><CardContent className="p-3 text-center"><Monitor className="h-4 w-4 text-cyan-400 mx-auto mb-1" /><p className="text-xl font-bold">{f.online || 0}/{f.total || 0}</p><p className="text-[10px] text-muted-foreground">Devices Online</p></CardContent></Card>
        <Card className="bg-black/60 border-red-500/30"><CardContent className="p-3 text-center"><AlertTriangle className="h-4 w-4 text-red-400 mx-auto mb-1" /><p className="text-xl font-bold">{s.critical || 0}</p><p className="text-[10px] text-muted-foreground">Critical Alerts</p></CardContent></Card>
        <Card className="bg-black/60 border-emerald-500/30"><CardContent className="p-3 text-center"><ClipboardCheck className="h-4 w-4 text-emerald-400 mx-auto mb-1" /><p className="text-xl font-bold">{c.avgScore || 0}%</p><p className="text-[10px] text-muted-foreground">Avg Compliance</p></CardContent></Card>
        <Card className="bg-black/60 border-blue-500/30"><CardContent className="p-3 text-center"><BookOpen className="h-4 w-4 text-blue-400 mx-auto mb-1" /><p className="text-xl font-bold">{d.documents || 0}</p><p className="text-[10px] text-muted-foreground">Atlas Docs</p></CardContent></Card>
      </div>

      {/* Generate report */}
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-indigo-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-400" />AI Executive Report</CardTitle>
              <CardDescription>Cross-module analysis powered by Cortex AI</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {aiReport && (
                <Button variant="outline" size="sm" onClick={downloadReport}><Download className="h-3.5 w-3.5 mr-1" />Download</Button>
              )}
              <Button onClick={generateReport} disabled={loadingAI || isLoading} className="bg-purple-600 hover:bg-purple-700">
                {loadingAI ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Executive Report
              </Button>
            </div>
          </div>
        </CardHeader>
        {aiReport && (
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">{aiReport}</div>
            </ScrollArea>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
