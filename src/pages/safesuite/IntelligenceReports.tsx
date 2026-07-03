/**
 * Intelligence → Board Reports.
 *
 * Cross-investigation executive digests. The user picks a reporting period
 * (7 / 30 / 90 days), Ray reads their completed investigations in that
 * window and produces a board-ready Markdown report. Reports are persisted
 * and exportable as PDF for leadership.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Sparkles, Coins, Presentation, Copy, Download, FileDown, Trash2, Brain, Clock,
} from 'lucide-react';
import { exportFollowupPdf } from '@/lib/wraythPdf';

type BoardReport = {
  id: string;
  period_days: number;
  title: string;
  status: 'running' | 'complete' | 'failed';
  content: string | null;
  investigation_ids: string[];
  totals: {
    total?: number;
    malicious?: number;
    suspicious?: number;
    benign?: number;
    inconclusive?: number;
  };
  cost_ray_compute: number;
  error: string | null;
  created_at: string;
};

const PERIODS: Array<{ days: number; label: string }> = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

export default function IntelligenceReports() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<BoardReport[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ray_board_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    setReports((data as BoardReport[] | null) ?? []);
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  const selected = reports.find(r => r.id === selectedId) ?? reports[0] ?? null;

  async function generate() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-board-report', {
        body: { period_days: period },
      });
      if (error) throw error;
      const r = (data as { report?: BoardReport })?.report;
      if (r) {
        setReports(prev => [r, ...prev.filter(p => p.id !== r.id)]);
        setSelectedId(r.id);
        toast.success(`Board report ready. ${r.cost_ray_compute} Ray Compute used.`);
      } else {
        toast.error('Ray could not generate the board report.');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Report failed.');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    const { error } = await supabase.from('ray_board_reports').delete().eq('id', id);
    if (error) { toast.error('Could not delete.'); return; }
    setReports(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" /> Wrayth Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold mt-1">Executive Reports</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Ray draws from the entire knowledge graph — investigations, attack paths, compliance posture,
            open recommendations, MITRE techniques, and resurfaced IOCs — and writes a leadership-ready
            report you can hand to the board.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 rounded-sm">
          <Coins className="h-3.5 w-3.5" /> 8 Ray Compute / report
        </Badge>
      </div>

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Reporting period</label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PERIODS.map(p => (
              <button
                key={p.days}
                type="button"
                onClick={() => setPeriod(p.days)}
                className={cn(
                  'px-3 py-1.5 rounded-sm text-xs border transition-colors',
                  period === p.days
                    ? 'bg-[hsl(262_60%_64%/0.12)] border-[hsl(262_60%_64%/0.4)] text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">Ray only reads your own investigations — no third parties involved.</p>
          <Button onClick={generate} disabled={loading} className="gap-2 min-h-[40px]">
            {loading ? <><Brain className="h-4 w-4 animate-pulse" /> Ray is writing…</>
              : <><Presentation className="h-4 w-4" /> Generate report (8 RC)</>}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="min-w-0">
          {selected ? <ReportView report={selected} onDelete={() => remove(selected.id)} />
            : <EmptyState />}
        </div>
        <aside className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Past reports</h2>
          {reports.length === 0 && (
            <p className="text-xs text-muted-foreground">Ray hasn't written any board reports yet.</p>
          )}
          <div className="space-y-2">
            {reports.map(r => {
              const isSel = (selected?.id ?? null) === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'w-full text-left rounded-sm border p-3 transition-colors',
                    isSel
                      ? 'border-[hsl(262_60%_64%/0.4)] bg-[hsl(262_60%_64%/0.06)]'
                      : 'border-border hover:border-border/80 bg-card',
                  )}
                >
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(r.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {r.totals?.total ?? 0} case{(r.totals?.total ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center border-dashed">
      <div className="mx-auto h-12 w-12 rounded-full bg-[hsl(262_60%_64%/0.1)] flex items-center justify-center mb-3">
        <Presentation className="h-6 w-6 text-[hsl(262_60%_70%)]" />
      </div>
      <h3 className="text-base font-medium">Generate your first executive report</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
        Pick a reporting period above and Ray will synthesise investigations, attack paths, compliance
        posture, MITRE observations, and open recommendations into a leadership-ready summary.
      </p>
    </Card>
  );
}

function ReportView({ report, onDelete }: { report: BoardReport; onDelete: () => void }) {
  if (report.status === 'failed') {
    return (
      <Card className="p-5 border-red-500/30 bg-red-500/5">
        <p className="text-sm text-red-400">Ray could not generate this report. {report.error}</p>
      </Card>
    );
  }
  const t = report.totals ?? {};
  const copy = () => {
    if (!report.content) return;
    navigator.clipboard.writeText(report.content);
    toast.success('Copied.');
  };
  const dl = () => {
    if (!report.content) return;
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const pdf = () => {
    if (!report.content) return;
    try {
      exportFollowupPdf(report.content, {
        title: report.title,
        subtitle: `${t.total ?? 0} investigation${(t.total ?? 0) === 1 ? '' : 's'} · generated ${new Date(report.created_at).toLocaleString()}`,
        kicker: 'EXECUTIVE REPORT',
      });
      toast.success('PDF exported.');
    } catch (e) {
      toast.error('Could not export PDF.');
      console.error(e);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Executive report</div>
          <div className="text-lg font-semibold mt-0.5 truncate">{report.title}</div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copy} aria-label="Copy">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dl} aria-label="Download Markdown">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={pdf} aria-label="Download PDF">
            <FileDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-border bg-muted/20 grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Stat label="Total" value={t.total ?? 0} />
        <Stat label="Malicious" value={t.malicious ?? 0} tone="red" />
        <Stat label="Suspicious" value={t.suspicious ?? 0} tone="amber" />
        <Stat label="Benign" value={t.benign ?? 0} tone="emerald" />
        <Stat label="Inconclusive" value={t.inconclusive ?? 0} />
      </div>
      <div className="p-5">
        <MarkdownLite text={report.content ?? ''} />
      </div>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'red' | 'amber' | 'emerald' }) {
  const colour = tone === 'red' ? 'text-red-400'
    : tone === 'amber' ? 'text-amber-400'
    : tone === 'emerald' ? 'text-emerald-400' : 'text-foreground';
  return (
    <div className="rounded-sm border border-border px-3 py-2 bg-card">
      <div className={cn('text-lg font-medium leading-none', colour)}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// Same lightweight renderer as in the Investigations workspace.
function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 text-sm">
        {listBuffer.map((li, i) => <li key={i}>{renderInline(li)}</li>)}
      </ul>,
    );
    listBuffer = [];
  };
  const flushPara = () => {
    if (paraBuffer.length === 0) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-relaxed">
        {renderInline(paraBuffer.join(' '))}
      </p>,
    );
    paraBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^###\s+/.test(line)) {
      flushList(); flushPara();
      blocks.push(<h4 key={blocks.length} className="text-sm font-semibold mt-3">{line.replace(/^###\s+/, '')}</h4>);
    } else if (/^##\s+/.test(line)) {
      flushList(); flushPara();
      blocks.push(<h3 key={blocks.length} className="text-base font-semibold mt-4">{line.replace(/^##\s+/, '')}</h3>);
    } else if (/^#\s+/.test(line)) {
      flushList(); flushPara();
      blocks.push(<h2 key={blocks.length} className="text-lg font-semibold mt-4">{line.replace(/^#\s+/, '')}</h2>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flushList(); flushPara();
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushList(); flushPara();
  return <div className="space-y-2">{blocks}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}
