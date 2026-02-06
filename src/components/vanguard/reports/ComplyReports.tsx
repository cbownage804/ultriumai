/**
 * Ledger: Comply Reports - Pulls real data from compliance_frameworks, compliance_evidence_vault, compliance_vendors, compliance_training
 */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardCheck, Shield, FileText, Users, AlertTriangle, CheckCircle2,
  XCircle, Download, Sparkles, Loader2, Building2, TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#22d3ee', '#ec4899'];

export function ComplyReports() {
  const { user } = useAuth();
  const [frameworks, setFrameworks] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
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
      const [fw, ev, vd, tr] = await Promise.all([
        (supabase as any).from('compliance_frameworks').select('*').eq('user_id', user.id),
        (supabase as any).from('compliance_evidence_vault').select('*'),
        (supabase as any).from('compliance_vendors').select('*').eq('user_id', user.id),
        (supabase as any).from('compliance_training').select('*').eq('user_id', user.id),
      ]);
      setFrameworks(fw.data || []);
      setEvidence(ev.data || []);
      setVendors(vd.data || []);
      setTraining(tr.data || []);
    } catch (err) {
      console.error('Error fetching comply data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const frameworkStats = useMemo(() => {
    return frameworks.map(fw => {
      const totalControls = (fw.total_controls as number) || 0;
      const passedControls = (fw.passed_controls as number) || 0;
      const score = totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 0;
      return { name: fw.name || fw.framework_type, score, total: totalControls, passed: passedControls, failed: totalControls - passedControls, status: fw.status };
    });
  }, [frameworks]);

  const evidenceStats = useMemo(() => {
    const total = evidence.length;
    const approved = evidence.filter(e => e.status === 'approved').length;
    const pending = evidence.filter(e => e.status === 'pending').length;
    const expired = evidence.filter(e => e.status === 'expired').length;
    return { total, approved, pending, expired };
  }, [evidence]);

  const vendorRiskDistribution = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    vendors.forEach(v => {
      const risk = (v.risk_level || v.risk_tier || 'low').toLowerCase();
      if (counts[risk] !== undefined) counts[risk]++;
    });
    return [
      { name: 'Low', value: counts.low, color: '#10b981' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [vendors]);

  const trainingStats = useMemo(() => {
    const total = training.length;
    const completed = training.filter(t => t.status === 'completed').length;
    const inProgress = training.filter(t => t.status === 'in_progress').length;
    const overdue = training.filter(t => t.status === 'overdue').length;
    return { total, completed, inProgress, overdue, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [training]);

  const generateAIInsight = async () => {
    setLoadingAI(true);
    try {
      const context = {
        frameworks: frameworkStats.map(f => `${f.name}: ${f.score}% (${f.passed}/${f.total} controls)`).join(', '),
        evidence: `${evidenceStats.approved} approved, ${evidenceStats.pending} pending, ${evidenceStats.expired} expired`,
        vendors: `${vendors.length} vendors — ${vendorRiskDistribution.map(d => `${d.value} ${d.name} risk`).join(', ')}`,
        training: `${trainingStats.completed}/${trainingStats.total} completed (${trainingStats.rate}%), ${trainingStats.overdue} overdue`,
      };
      const { data } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: `Analyze this compliance posture and provide an executive summary with top 3 risks and recommendations:\n${JSON.stringify(context, null, 2)}`,
          model: 'gpt-4o-mini',
          systemPrompt: 'You are a compliance auditor AI. Provide concise, actionable executive summaries. Use bullet points. Be specific about risk areas and remediation priorities.',
        },
      });
      if (data?.response) setAiInsight(data.response);
    } catch (err) {
      toast.error('Failed to generate AI insight');
    } finally {
      setLoadingAI(false);
    }
  };

  const exportCSV = () => {
    const rows = frameworkStats.map(f => `"${f.name}","${f.score}%","${f.passed}","${f.failed}","${f.total}","${f.status}"`);
    const csv = ['Framework,Score,Passed,Failed,Total,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `comply-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-black/60 border-emerald-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-emerald-400">{frameworks.length}</p>
                <p className="text-xs text-muted-foreground">Frameworks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-blue-400">{evidenceStats.total}</p>
                <p className="text-xs text-muted-foreground">Evidence Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-amber-400">{vendors.length}</p>
                <p className="text-xs text-muted-foreground">Vendors Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/60 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-purple-400">{trainingStats.rate}%</p>
                <p className="text-xs text-muted-foreground">Training Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Cortex AI Compliance Insight
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
              </Button>
              <Button size="sm" onClick={generateAIInsight} disabled={loadingAI} className="bg-purple-600 hover:bg-purple-700">
                {loadingAI ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Generate AI Summary
              </Button>
            </div>
          </div>
        </CardHeader>
        {aiInsight && (
          <CardContent>
            <div className="text-sm whitespace-pre-wrap bg-muted/20 rounded-lg p-4">{aiInsight}</div>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="frameworks">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Vault</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Risk</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="mt-4 space-y-4">
          {frameworkStats.length === 0 && !isLoading ? (
            <Card className="bg-black/40"><CardContent className="p-8 text-center text-muted-foreground">No compliance frameworks configured. Set up frameworks in the Comply module.</CardContent></Card>
          ) : (
            <div className="grid gap-4">
              {frameworkStats.map((fw, i) => (
                <Card key={i} className="bg-black/60 border-slate-700/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium">{fw.name}</span>
                        <Badge variant="outline" className="text-[10px]">{fw.status || 'active'}</Badge>
                      </div>
                      <span className={`text-lg font-bold ${fw.score >= 85 ? 'text-emerald-400' : fw.score >= 70 ? 'text-amber-400' : 'text-red-400'}`}>{fw.score}%</span>
                    </div>
                    <Progress value={fw.score} className="h-2 mb-2" />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" />{fw.passed} passed</span>
                      <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" />{fw.failed} failed</span>
                      <span>{fw.total} total controls</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-emerald-400">{evidenceStats.approved}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
            <Card className="bg-amber-500/10 border-amber-500/30"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-amber-400">{evidenceStats.pending}</p><p className="text-xs text-muted-foreground">Pending Review</p></CardContent></Card>
            <Card className="bg-red-500/10 border-red-500/30"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-400">{evidenceStats.expired}</p><p className="text-xs text-muted-foreground">Expired</p></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader><CardTitle className="text-sm">Vendor Risk Distribution</CardTitle></CardHeader>
              <CardContent>
                {vendorRiskDistribution.length > 0 ? (
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={vendorRiskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                          {vendorRiskDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-center text-muted-foreground py-8">No vendor data</p>}
              </CardContent>
            </Card>
            <Card className="bg-black/60 border-slate-700/50">
              <CardHeader><CardTitle className="text-sm">Vendors ({vendors.length})</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px]">
                  {vendors.map((v, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm">{v.vendor_name || v.name || `Vendor ${i + 1}`}</span>
                      <Badge variant="outline" className="text-[10px]">{v.risk_level || v.risk_tier || 'N/A'}</Badge>
                    </div>
                  ))}
                  {vendors.length === 0 && <p className="text-center text-muted-foreground py-4">No vendors tracked</p>}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-black/60"><CardContent className="p-4 text-center"><p className="text-3xl font-bold">{trainingStats.total}</p><p className="text-xs text-muted-foreground">Total Assignments</p></CardContent></Card>
            <Card className="bg-emerald-500/10 border-emerald-500/30"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-emerald-400">{trainingStats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
            <Card className="bg-blue-500/10 border-blue-500/30"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-blue-400">{trainingStats.inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
            <Card className="bg-red-500/10 border-red-500/30"><CardContent className="p-4 text-center"><p className="text-3xl font-bold text-red-400">{trainingStats.overdue}</p><p className="text-xs text-muted-foreground">Overdue</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
