/**
 * Wrayth Intelligence · Incident Response Workspace — /app/intelligence/cases
 *
 * A case is a durable container that ties investigations, attack paths,
 * board reports, IOCs, and freeform notes into one incident-response
 * artifact. It's how ad-hoc AI outputs become a defensible incident record.
 *
 * Tables: ray_cases, ray_case_items, ray_case_notes (all RLS-owner scoped).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Briefcase, Plus, ShieldAlert, AlertTriangle, CheckCircle2, HelpCircle,
  ScanSearch, GitBranch, FileText, Fingerprint, MessageSquare, X,
  ArrowLeft, User, Trash2, Link as LinkIcon,
} from 'lucide-react';

type Case = {
  id: string;
  title: string;
  summary: string | null;
  severity: string;
  status: string;
  assignee: string | null;
  tags: string[];
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
};

type CaseItem = {
  id: string;
  case_id: string;
  item_type: string;
  ref_id: string;
  label: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type CaseNote = {
  id: string;
  case_id: string;
  note_type: string;
  body: string;
  created_at: string;
};

const SEVERITY_TONE: Record<string, string> = {
  critical: 'text-[hsl(0_75%_65%)] border-[hsl(0_75%_45%/0.35)] bg-[hsl(0_75%_45%/0.08)]',
  high:     'text-[hsl(12_85%_65%)] border-[hsl(12_85%_50%/0.35)] bg-[hsl(12_85%_50%/0.08)]',
  medium:   'text-[hsl(38_90%_65%)] border-[hsl(38_90%_50%/0.35)] bg-[hsl(38_90%_50%/0.08)]',
  low:      'text-[hsl(200_60%_65%)] border-[hsl(200_60%_45%/0.35)] bg-[hsl(200_60%_45%/0.08)]',
  info:     'text-muted-foreground border-border bg-muted',
};

const STATUS_TONE: Record<string, string> = {
  open:       'text-[hsl(0_75%_65%)] border-[hsl(0_75%_45%/0.35)]',
  triaging:   'text-[hsl(38_90%_65%)] border-[hsl(38_90%_50%/0.35)]',
  containing: 'text-[hsl(262_60%_70%)] border-[hsl(262_60%_64%/0.35)]',
  monitoring: 'text-[hsl(200_60%_65%)] border-[hsl(200_60%_45%/0.35)]',
  resolved:   'text-[hsl(140_55%_65%)] border-[hsl(140_55%_45%/0.35)]',
  closed:     'text-muted-foreground border-border',
};

const ITEM_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  investigation: ScanSearch,
  attack_path:   GitBranch,
  report:        FileText,
  ioc:           Fingerprint,
  entity:        LinkIcon,
};

const ITEM_HREF: Record<string, (refId: string) => string> = {
  investigation: id => `/app/intelligence/investigations?id=${id}`,
  attack_path:   id => `/app/intelligence/attack-paths?id=${id}`,
  report:        id => `/app/intelligence/reports?id=${id}`,
  ioc:           v  => `/app/intelligence/memory?q=${encodeURIComponent(v)}`,
  entity:        id => `/app/intelligence/graph?entity=${id}`,
};

export default function IntelligenceCases() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get('id');

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadCases = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('ray_cases')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(200);
    setCases((data ?? []) as Case[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadCases(); }, [loadCases]);

  const createCase = async () => {
    if (!user || !newTitle.trim()) return;
    const { data, error } = await supabase
      .from('ray_cases')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        summary: newSummary.trim() || null,
        severity: newSeverity,
        status: 'open',
      })
      .select('*')
      .single();
    if (error) { toast.error(error.message); return; }
    toast.success('Case opened');
    setNewTitle(''); setNewSummary(''); setNewSeverity('medium'); setCreating(false);
    setCases(prev => [data as Case, ...prev]);
    setParams({ id: (data as Case).id });
  };

  const filtered = useMemo(
    () => statusFilter === 'all' ? cases : cases.filter(c => c.status === statusFilter),
    [cases, statusFilter],
  );

  const activeCase = useMemo(() => cases.find(c => c.id === activeId) ?? null, [cases, activeId]);

  if (activeCase) {
    return (
      <CaseDetail
        caseRow={activeCase}
        onBack={() => setParams({})}
        onUpdated={(updated) => setCases(prev => prev.map(c => c.id === updated.id ? updated : c))}
        onDeleted={() => { setCases(prev => prev.filter(c => c.id !== activeCase.id)); setParams({}); }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <Briefcase className="h-3.5 w-3.5" />
            Ray Intelligence · Incident Workspace
          </div>
          <h1 className="text-2xl font-semibold mt-1">Cases</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            One durable record per incident. Attach investigations, attack paths, IOCs, and reports;
            log every action; export a defensible timeline when it's done.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="triaging">Triaging</SelectItem>
              <SelectItem value="containing">Containing</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setCreating(v => !v)}>
            <Plus className="h-4 w-4 mr-1" /> New case
          </Button>
        </div>
      </div>

      {creating && (
        <Card className="border-[hsl(262_60%_64%/0.35)] bg-[hsl(262_60%_64%/0.04)]">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm">Open a new case</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreating(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Case title (e.g., Phishing wave targeting accounting)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Textarea placeholder="Short summary (optional)" rows={2} value={newSummary} onChange={e => setNewSummary(e.target.value)} />
            <div className="flex items-center gap-2">
              <Select value={newSeverity} onValueChange={setNewSeverity}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={createCase} disabled={!newTitle.trim()}>Open case</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center">
            <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No cases {statusFilter !== 'all' && `in "${statusFilter}"`}</p>
            <p className="text-xs text-muted-foreground mt-1">Open one to bundle investigations and evidence into a single record.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setParams({ id: c.id })}
              className="text-left"
            >
              <Card className="border-border bg-card hover:border-[hsl(262_60%_64%/0.5)] transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm ${SEVERITY_TONE[c.severity] ?? SEVERITY_TONE.info}`}>{c.severity}</span>
                        <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm ${STATUS_TONE[c.status] ?? STATUS_TONE.open}`}>{c.status}</span>
                        {c.assignee && (
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                            <User className="h-3 w-3" /> {c.assignee}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium truncate">{c.title}</div>
                      {c.summary && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.summary}</div>}
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap text-right">
                      <div>Updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</div>
                      <div className="opacity-70">Opened {formatDistanceToNow(new Date(c.opened_at), { addSuffix: true })}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Case detail ---------------- */

function CaseDetail({
  caseRow, onBack, onUpdated, onDeleted,
}: {
  caseRow: Case;
  onBack: () => void;
  onUpdated: (c: Case) => void;
  onDeleted: () => void;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<CaseItem[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteBody, setNoteBody] = useState('');
  const [attachOpen, setAttachOpen] = useState(false);
  const [investigations, setInvestigations] = useState<Array<{ id: string; input_label: string | null; input_type: string; verdict: string | null }>>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [it, nt] = await Promise.all([
      supabase.from('ray_case_items').select('*').eq('case_id', caseRow.id).order('created_at', { ascending: false }),
      supabase.from('ray_case_notes').select('*').eq('case_id', caseRow.id).order('created_at', { ascending: false }),
    ]);
    setItems((it.data ?? []) as CaseItem[]);
    setNotes((nt.data ?? []) as CaseNote[]);
    setLoading(false);
  }, [caseRow.id, user]);

  useEffect(() => { load(); }, [load]);

  const loadInvestigations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ray_investigations')
      .select('id, input_label, input_type, verdict')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setInvestigations((data ?? []) as typeof investigations);
  };

  const attach = async (item_type: string, ref_id: string, label: string) => {
    if (!user) return;
    const { error } = await supabase.from('ray_case_items').insert({
      case_id: caseRow.id, user_id: user.id, item_type, ref_id, label,
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from('ray_case_notes').insert({
      case_id: caseRow.id, user_id: user.id, note_type: 'action', body: `Attached ${item_type}: ${label}`,
    });
    toast.success('Attached');
    load();
  };

  const removeItem = async (id: string) => {
    await supabase.from('ray_case_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const addNote = async () => {
    if (!user || !noteBody.trim()) return;
    const { data, error } = await supabase.from('ray_case_notes').insert({
      case_id: caseRow.id, user_id: user.id, note_type: 'note', body: noteBody.trim(),
    }).select('*').single();
    if (error) { toast.error(error.message); return; }
    setNotes(prev => [data as CaseNote, ...prev]);
    setNoteBody('');
  };

  const updateStatus = async (status: string) => {
    const closed_at = (status === 'resolved' || status === 'closed') ? new Date().toISOString() : null;
    const { data, error } = await supabase.from('ray_cases')
      .update({ status, closed_at })
      .eq('id', caseRow.id)
      .select('*')
      .single();
    if (error) { toast.error(error.message); return; }
    onUpdated(data as Case);
    if (user) await supabase.from('ray_case_notes').insert({
      case_id: caseRow.id, user_id: user.id, note_type: 'action', body: `Status → ${status}`,
    });
    load();
  };

  const updateSeverity = async (severity: string) => {
    const { data, error } = await supabase.from('ray_cases')
      .update({ severity }).eq('id', caseRow.id).select('*').single();
    if (error) { toast.error(error.message); return; }
    onUpdated(data as Case);
  };

  const deleteCase = async () => {
    if (!confirm('Delete this case and all its attachments and notes?')) return;
    const { error } = await supabase.from('ray_cases').delete().eq('id', caseRow.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Case deleted');
    onDeleted();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> All cases
      </button>

      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold">{caseRow.title}</CardTitle>
              {caseRow.summary && <p className="text-sm text-muted-foreground mt-1">{caseRow.summary}</p>}
              <div className="text-[11px] text-muted-foreground mt-2">
                Opened {formatDistanceToNow(new Date(caseRow.opened_at), { addSuffix: true })}
                {caseRow.closed_at && ` · Closed ${formatDistanceToNow(new Date(caseRow.closed_at), { addSuffix: true })}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={caseRow.severity} onValueChange={updateSeverity}>
                <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
              <Select value={caseRow.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="triaging">Triaging</SelectItem>
                  <SelectItem value="containing">Containing</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[hsl(0_75%_65%)]" onClick={deleteCase}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Evidence */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">Evidence · {items.length}</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setAttachOpen(v => !v); if (!attachOpen) loadInvestigations(); }}>
                <Plus className="h-3 w-3 mr-1" /> Attach investigation
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {attachOpen && (
                <div className="border border-border rounded-sm p-2 space-y-1 max-h-64 overflow-auto bg-muted/30">
                  {investigations.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No recent investigations.</p>
                  ) : investigations.map(inv => (
                    <button
                      key={inv.id}
                      onClick={() => attach('investigation', inv.id, inv.input_label || inv.input_type)}
                      className="flex items-center gap-2 w-full text-left text-xs px-2 py-1.5 rounded-sm hover:bg-accent"
                    >
                      <ScanSearch className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate flex-1">{inv.input_label || inv.input_type}</span>
                      <Badge variant="outline" className="text-[9px] uppercase">{inv.verdict ?? '—'}</Badge>
                    </button>
                  ))}
                </div>
              )}
              {loading ? (
                <Skeleton className="h-10 w-full" />
              ) : items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">No evidence attached yet.</p>
              ) : items.map(it => {
                const Icon = ITEM_ICON[it.item_type] ?? Fingerprint;
                const href = ITEM_HREF[it.item_type]?.(it.ref_id);
                const inner = (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs truncate flex-1">{it.label ?? it.ref_id}</span>
                    <Badge variant="outline" className="text-[9px] uppercase">{it.item_type}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(it.id); }}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
                return href ? <Link key={it.id} to={href} className="block">{inner}</Link> : <div key={it.id}>{inner}</div>;
              })}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Notes & actions · {notes.length}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Textarea placeholder="Log an action, observation, or handoff…" rows={2} value={noteBody} onChange={e => setNoteBody(e.target.value)} />
                <div className="flex justify-end">
                  <Button size="sm" onClick={addNote} disabled={!noteBody.trim()}>
                    <MessageSquare className="h-3 w-3 mr-1" /> Add note
                  </Button>
                </div>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                {notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">No notes yet.</p>
                ) : notes.map(n => (
                  <div key={n.id} className="text-xs border-l-2 border-border pl-3 py-1">
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                      <span className={n.note_type === 'action' ? 'text-[hsl(262_60%_70%)]' : ''}>{n.note_type}</span>
                      <span>· {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{n.body}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">At a glance</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              <Stat label="Severity" value={caseRow.severity} tone={SEVERITY_TONE[caseRow.severity]} />
              <Stat label="Status"   value={caseRow.status}   tone={STATUS_TONE[caseRow.status]} />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Investigations</span>
                <span>{items.filter(i => i.item_type === 'investigation').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Attack paths</span>
                <span>{items.filter(i => i.item_type === 'attack_path').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reports</span>
                <span>{items.filter(i => i.item_type === 'report').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">IOCs</span>
                <span>{items.filter(i => i.item_type === 'ioc').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Notes</span>
                <span>{notes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 border rounded-sm ${tone ?? 'border-border text-muted-foreground'}`}>{value}</span>
    </div>
  );
}
