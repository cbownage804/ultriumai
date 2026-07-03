/**
 * Intelligence → Policy Generator (v0.6, Sprint D).
 *
 * Generates editable, framework-mapped security policies (password, IR, DR,
 * AUP, BYOD, access control, etc.). Persists via ray-policy-generate. Exports
 * to DOCX client-side using the `docx` library — no server round-trip needed.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ClipboardCheck, Coins, Sparkles, FileDown, Trash2, Loader2, ShieldCheck,
  BookOpen, Users, Copy, UserPlus, Siren, KeyRound, HeartPulse, CreditCard,
  Laptop, RefreshCw, Mail, Cloud, ScrollText, Check,
} from 'lucide-react';
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType,
  LevelFormat, PageOrientation,
} from 'docx';
import { saveAs } from 'file-saver';

type PolicyClause = { id?: string; text?: string };
type PolicySection = {
  heading?: string;
  clauses?: PolicyClause[];
  controls?: Array<{ framework?: string; id?: string; why?: string }>;
};
type PolicyRoleRow = { role?: string; responsibility?: string };
type PolicyDefinition = { term?: string; definition?: string };

type PolicyRow = {
  id: string;
  policy_type: string;
  title: string;
  organization_name: string | null;
  frameworks: string[];
  jurisdiction: string | null;
  status: 'generating' | 'draft' | 'approved' | 'failed';
  version: number;
  sections: PolicySection[];
  metadata: {
    version?: string;
    effective_date?: string;
    review_cycle?: string;
    executive_summary?: string;
    scope?: string;
    roles?: PolicyRoleRow[];
    enforcement?: string;
    exceptions?: string;
    definitions?: PolicyDefinition[];
    revision_history?: Array<{ version?: string; date?: string; note?: string }>;
  };
  compute_credits: number;
  error: string | null;
  created_at: string;
};

const POLICY_TYPES: Array<{ id: string; label: string; blurb: string }> = [
  { id: 'password',            label: 'Password Policy',            blurb: 'Length, rotation, MFA, storage rules.' },
  { id: 'acceptable_use',      label: 'Acceptable Use (AUP)',       blurb: 'What users can and can\u2019t do with company assets.' },
  { id: 'incident_response',   label: 'Incident Response',          blurb: 'Detect, contain, eradicate, recover, review.' },
  { id: 'disaster_recovery',   label: 'Disaster Recovery',          blurb: 'RTO/RPO, failover, restore procedures.' },
  { id: 'byod',                label: 'BYOD',                       blurb: 'Personal device enrollment and controls.' },
  { id: 'access_control',      label: 'Access Control',             blurb: 'Least privilege, provisioning, review cycles.' },
  { id: 'data_classification', label: 'Data Classification',        blurb: 'Public / Internal / Confidential / Restricted.' },
  { id: 'remote_work',         label: 'Remote Work',                blurb: 'VPN, endpoint hardening, home-office rules.' },
  { id: 'vendor_risk',         label: 'Vendor Risk Management',     blurb: 'Third-party assessment and monitoring.' },
  { id: 'sdlc',                label: 'Secure SDLC',                blurb: 'Code review, dependency, secrets, deploy gates.' },
  { id: 'backup',              label: 'Backup & Retention',         blurb: 'Frequency, retention, offsite, restore tests.' },
  { id: 'email_security',      label: 'Email Security',             blurb: 'SPF/DKIM/DMARC, phishing, mailbox rules.' },
  { id: 'mfa',                 label: 'Multi-Factor Authentication',blurb: 'Coverage, methods, exemption rules.' },
];

const FRAMEWORKS = ['CIS v8', 'NIST CSF 2.0', 'ISO 27001', 'SOC 2', 'HIPAA', 'PCI DSS', 'GDPR'];

const COST = 10;

export default function IntelligencePolicies() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Form
  const [policyType, setPolicyType] = useState<string>('password');
  const [orgName, setOrgName] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['CIS v8', 'NIST CSF 2.0']);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from('ray_policies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(25);
    setPolicies((data as PolicyRow[] | null) ?? []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(
    () => policies.find(p => p.id === selectedId) ?? policies[0] ?? null,
    [policies, selectedId],
  );

  async function generate() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ray-policy-generate', {
        body: {
          policy_type: policyType,
          organization_name: orgName || undefined,
          jurisdiction: jurisdiction || undefined,
          frameworks: selectedFrameworks,
          notes: notes || undefined,
        },
      });
      if (error) throw error;
      const p = (data as { policy?: PolicyRow })?.policy;
      if (p) {
        setPolicies(prev => [p, ...prev.filter(x => x.id !== p.id)]);
        setSelectedId(p.id);
        toast.success(`Policy drafted. ${p.compute_credits} Ray Compute used.`);
      } else {
        toast.error('Ray could not draft that policy.');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Policy generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await (supabase as any).from('ray_policies').delete().eq('id', id);
    setPolicies(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success('Policy deleted.');
  }

  function toggleFramework(f: string) {
    setSelectedFrameworks(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f],
    );
  }

  async function copyMarkdown() {
    if (!selected) return;
    const md = renderMarkdown(selected);
    await navigator.clipboard.writeText(md);
    toast.success('Copied Markdown.');
  }

  async function exportDocx() {
    if (!selected) return;
    setExporting(true);
    try {
      const doc = buildDocx(selected);
      const blob = await Packer.toBlob(doc);
      const safe = (selected.title || 'policy').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      saveAs(blob, `${safe}.docx`);
      toast.success('DOCX exported.');
    } catch (e) {
      toast.error((e as Error).message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <ClipboardCheck className="h-3.5 w-3.5" />
          Ray Intelligence · Policy Generator
        </div>
        <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          Policy Generator
          <Sparkles className="h-5 w-5 text-[hsl(262_60%_70%)]" />
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          Draft enforceable security policies mapped to CIS, NIST, ISO 27001, SOC 2, HIPAA and
          more. Every clause is written in policy voice — export to Word, edit, sign, and ship.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Left column: form + history */}
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label>Policy type</Label>
                <Select value={policyType} onValueChange={setPolicyType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POLICY_TYPES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {POLICY_TYPES.find(t => t.id === policyType)?.blurb}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">Organization name (optional)</Label>
                <Input
                  id="orgName" value={orgName} onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jur">Jurisdiction (optional)</Label>
                <Input
                  id="jur" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
                  placeholder="e.g. United States, EU, Canada"
                />
              </div>

              <div className="space-y-2">
                <Label>Frameworks</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FRAMEWORKS.map(f => {
                    const on = selectedFrameworks.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleFramework(f)}
                        className={cn(
                          'text-[11px] px-2 py-1 rounded-sm border transition-colors min-h-[28px]',
                          on
                            ? 'bg-[hsl(262_60%_64%/0.15)] border-[hsl(262_60%_64%/0.5)] text-foreground'
                            : 'bg-muted border-border text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional context (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. We are a 40-person healthcare SaaS. Must cover PHI handling and BAAs."
                  rows={4}
                  className="text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <Coins className="h-3 w-3" /> {COST} Ray Compute
                </div>
                <Button
                  onClick={generate}
                  disabled={loading || selectedFrameworks.length === 0}
                  className="gap-2 rounded-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Draft policy
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card className="border-border bg-card">
            <CardContent className="p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground px-1 pb-2">
                Recent policies
              </div>
              {policies.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 py-3">
                  Nothing drafted yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {policies.map(p => {
                    const active = (selected?.id ?? '') === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={cn(
                          'w-full text-left px-2 py-2 rounded-sm text-sm transition-colors',
                          active
                            ? 'bg-[hsl(262_60%_64%/0.1)] text-foreground'
                            : 'hover:bg-accent text-muted-foreground',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{p.title}</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase tracking-wider border-border shrink-0"
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: preview */}
        <div>
          {!selected ? (
            <Card className="border-border bg-card">
              <CardContent className="p-10 text-center space-y-2">
                <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto" />
                <div className="text-sm text-muted-foreground">
                  Pick a policy type, target frameworks, and click <span className="text-foreground">Draft policy</span>.
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Ray uses your organization context and framework choice to generate an enforceable, editable draft.
                </div>
              </CardContent>
            </Card>
          ) : selected.status === 'generating' ? (
            <Card className="border-border bg-card">
              <CardContent className="p-10 text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[hsl(262_60%_70%)]" />
                <div className="text-sm">Drafting policy&hellip;</div>
              </CardContent>
            </Card>
          ) : selected.status === 'failed' ? (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-6">
                <div className="text-sm text-destructive">
                  {selected.error || 'Generation failed.'}
                </div>
              </CardContent>
            </Card>
          ) : (
            <PolicyPreview
              policy={selected}
              onCopy={copyMarkdown}
              onExport={exportDocx}
              onDelete={() => remove(selected.id)}
              exporting={exporting}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Preview ────────────────────────────────────────────────────────────────

function PolicyPreview({
  policy, onCopy, onExport, onDelete, exporting,
}: {
  policy: PolicyRow;
  onCopy: () => void;
  onExport: () => void;
  onDelete: () => void;
  exporting: boolean;
}) {
  const m = policy.metadata ?? {};
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border/60">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {policy.policy_type.replace(/_/g, ' ')}
            </div>
            <h2 className="text-xl font-semibold mt-0.5">{policy.title}</h2>
            <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              {policy.organization_name && <span>Org: {policy.organization_name}</span>}
              {m.version && <span>v{m.version}</span>}
              {m.effective_date && <span>Effective {m.effective_date}</span>}
              {m.review_cycle && <span>Review: {m.review_cycle}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onCopy} className="rounded-sm gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={onExport} disabled={exporting} className="rounded-sm gap-1.5">
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              DOCX
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="rounded-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Frameworks */}
        {policy.frameworks?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            {policy.frameworks.map(f => (
              <Badge key={f} variant="outline" className="text-[10px] uppercase tracking-wider border-border">
                {f}
              </Badge>
            ))}
          </div>
        )}

        {/* Executive summary */}
        {m.executive_summary && (
          <section className="space-y-1.5">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Executive summary
            </h3>
            <p className="text-sm leading-relaxed">{m.executive_summary}</p>
          </section>
        )}

        {m.scope && (
          <section className="space-y-1.5">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Scope</h3>
            <p className="text-sm leading-relaxed">{m.scope}</p>
          </section>
        )}

        {/* Roles */}
        {Array.isArray(m.roles) && m.roles.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Roles &amp; responsibilities
            </h3>
            <div className="space-y-1.5">
              {m.roles.map((r, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{r.role}: </span>
                  <span className="text-muted-foreground">{r.responsibility}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        {policy.sections.map((s, i) => (
          <section key={i} className="space-y-2 pt-2 border-t border-border/40">
            <h3 className="text-sm font-semibold">
              {i + 1}. {s.heading}
            </h3>
            {Array.isArray(s.clauses) && s.clauses.length > 0 && (
              <div className="space-y-1.5">
                {s.clauses.map((c, j) => (
                  <div key={j} className="text-sm leading-relaxed">
                    <span className="text-muted-foreground mr-2 tabular-nums">{c.id || `${i + 1}.${j + 1}`}</span>
                    {c.text}
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(s.controls) && s.controls.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {s.controls.map((ctrl, k) => (
                  <Badge key={k} variant="outline" className="text-[10px] border-border font-normal">
                    {ctrl.framework} · {ctrl.id}
                  </Badge>
                ))}
              </div>
            )}
          </section>
        ))}

        {m.enforcement && (
          <section className="space-y-1.5 pt-2 border-t border-border/40">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Enforcement</h3>
            <p className="text-sm leading-relaxed">{m.enforcement}</p>
          </section>
        )}

        {m.exceptions && (
          <section className="space-y-1.5">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Exceptions</h3>
            <p className="text-sm leading-relaxed">{m.exceptions}</p>
          </section>
        )}

        {Array.isArray(m.definitions) && m.definitions.length > 0 && (
          <section className="space-y-1.5">
            <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Definitions</h3>
            <div className="space-y-1">
              {m.definitions.map((d, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium">{d.term}: </span>
                  <span className="text-muted-foreground">{d.definition}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Renderers ──────────────────────────────────────────────────────────────

function renderMarkdown(p: PolicyRow): string {
  const m = p.metadata ?? {};
  const parts: string[] = [];
  parts.push(`# ${p.title}\n`);
  if (p.organization_name) parts.push(`**Organization:** ${p.organization_name}`);
  if (m.version) parts.push(`**Version:** ${m.version}`);
  if (m.effective_date) parts.push(`**Effective:** ${m.effective_date}`);
  if (m.review_cycle) parts.push(`**Review cycle:** ${m.review_cycle}`);
  if (p.frameworks?.length) parts.push(`**Frameworks:** ${p.frameworks.join(', ')}`);
  parts.push('');
  if (m.executive_summary) parts.push(`## Executive Summary\n\n${m.executive_summary}\n`);
  if (m.scope) parts.push(`## Scope\n\n${m.scope}\n`);
  if (Array.isArray(m.roles) && m.roles.length) {
    parts.push(`## Roles & Responsibilities\n`);
    m.roles.forEach(r => parts.push(`- **${r.role}:** ${r.responsibility}`));
    parts.push('');
  }
  p.sections.forEach((s, i) => {
    parts.push(`## ${i + 1}. ${s.heading}\n`);
    (s.clauses ?? []).forEach((c, j) => {
      parts.push(`**${c.id || `${i + 1}.${j + 1}`}** ${c.text}\n`);
    });
    if (s.controls?.length) {
      parts.push(`_Controls: ${s.controls.map(c => `${c.framework} ${c.id}`).join(', ')}_\n`);
    }
  });
  if (m.enforcement) parts.push(`## Enforcement\n\n${m.enforcement}\n`);
  if (m.exceptions) parts.push(`## Exceptions\n\n${m.exceptions}\n`);
  if (Array.isArray(m.definitions) && m.definitions.length) {
    parts.push(`## Definitions\n`);
    m.definitions.forEach(d => parts.push(`- **${d.term}:** ${d.definition}`));
  }
  return parts.join('\n');
}

/**
 * Canonical section order enforced on every exported policy so downstream
 * reviewers, auditors, and GRC tooling always see the same shape:
 *   1. Purpose  2. Scope  3. Controls  4. Procedures  5. Exceptions  6. References
 * Roles & Responsibilities and Definitions are inserted only when populated so
 * they never break the six-section contract.
 */
const PROCEDURE_HINTS = /(procedure|process|workflow|runbook|playbook|steps?|response|handling|operation|lifecycle|onboard|offboard|escalat|containment|recovery|restore|drill)/i;

function classifySections(sections: PolicySection[]) {
  const controls: PolicySection[] = [];
  const procedures: PolicySection[] = [];
  sections.forEach(s => {
    const h = (s.heading ?? '').toLowerCase();
    if (PROCEDURE_HINTS.test(h)) procedures.push(s);
    else controls.push(s);
  });
  return { controls, procedures };
}

function buildDocx(p: PolicyRow): Document {
  const m = p.metadata ?? {};
  const children: Paragraph[] = [];

  const h1 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 320, after: 140 },
      children: [new TextRun({ text, bold: true })],
    });
  const h2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text, bold: true })],
    });
  const para = (text: string) =>
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text })],
    });
  const bullet = (runs: TextRun[]) =>
    new Paragraph({
      numbering: { reference: 'bullets', level: 0 },
      spacing: { after: 60 },
      children: runs,
    });
  const muted = (text: string) =>
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text, italics: true, size: 18, color: '666666' })],
    });

  // ----- Title block --------------------------------------------------------
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: p.title, bold: true, size: 36 })],
  }));

  const meta: string[] = [];
  if (p.organization_name) meta.push(`Organization: ${p.organization_name}`);
  if (m.version) meta.push(`Version: ${m.version}`);
  if (m.effective_date) meta.push(`Effective: ${m.effective_date}`);
  if (m.review_cycle) meta.push(`Review cycle: ${m.review_cycle}`);
  if (p.jurisdiction) meta.push(`Jurisdiction: ${p.jurisdiction}`);
  if (meta.length) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [new TextRun({ text: meta.join('  \u2022  '), italics: true, size: 20, color: '666666' })],
    }));
  }

  const { controls: controlSections, procedures: procedureSections } = classifySections(p.sections ?? []);

  // ----- 1. Purpose ---------------------------------------------------------
  children.push(h1('1. Purpose'));
  children.push(para(
    m.executive_summary?.trim()
      || `This ${p.title} defines the mandatory requirements, responsibilities, and controls that ${p.organization_name || 'the organization'} follows to reduce risk and meet ${p.frameworks?.join(', ') || 'applicable'} obligations.`
  ));

  // ----- 2. Scope -----------------------------------------------------------
  children.push(h1('2. Scope'));
  children.push(para(
    m.scope?.trim()
      || 'This policy applies to all employees, contractors, systems, applications, and data owned or operated by the organization, regardless of location or hosting model.'
  ));
  if (Array.isArray(m.roles) && m.roles.length) {
    children.push(h2('Roles & Responsibilities'));
    m.roles.forEach(r => {
      children.push(bullet([
        new TextRun({ text: `${r.role ?? 'Role'}: `, bold: true }),
        new TextRun({ text: r.responsibility ?? '' }),
      ]));
    });
  }

  // ----- 3. Controls --------------------------------------------------------
  children.push(h1('3. Controls'));
  if (controlSections.length === 0) {
    children.push(para('No prescriptive controls were generated for this policy. Review with your security team before publication.'));
  } else {
    controlSections.forEach((s, i) => {
      children.push(h2(`3.${i + 1} ${s.heading ?? 'Control Set'}`));
      (s.clauses ?? []).forEach((c, j) => {
        children.push(new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${c.id || `3.${i + 1}.${j + 1}`}  `, bold: true }),
            new TextRun({ text: c.text ?? '' }),
          ],
        }));
      });
      if (s.controls?.length) {
        children.push(muted(
          `Mapped controls: ${s.controls.map(c => `${c.framework ?? ''} ${c.id ?? ''}`.trim()).filter(Boolean).join(', ')}`
        ));
      }
    });
  }

  // ----- 4. Procedures ------------------------------------------------------
  children.push(h1('4. Procedures'));
  if (procedureSections.length === 0) {
    children.push(para('Operational procedures for enforcing this policy are maintained in the corresponding runbooks. Document owners must review procedures at least annually.'));
  } else {
    procedureSections.forEach((s, i) => {
      children.push(h2(`4.${i + 1} ${s.heading ?? 'Procedure'}`));
      (s.clauses ?? []).forEach((c, j) => {
        children.push(new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: `${c.id || `4.${i + 1}.${j + 1}`}  `, bold: true }),
            new TextRun({ text: c.text ?? '' }),
          ],
        }));
      });
      if (s.controls?.length) {
        children.push(muted(
          `Mapped controls: ${s.controls.map(c => `${c.framework ?? ''} ${c.id ?? ''}`.trim()).filter(Boolean).join(', ')}`
        ));
      }
    });
  }

  // ----- 5. Exceptions ------------------------------------------------------
  children.push(h1('5. Exceptions'));
  children.push(para(
    m.exceptions?.trim()
      || 'Exceptions to this policy require written approval from the policy owner and the CISO (or designated security lead). All exceptions must be documented with a business justification, compensating controls, and an expiration date not to exceed twelve (12) months.'
  ));
  if (m.enforcement?.trim()) {
    children.push(h2('Enforcement'));
    children.push(para(m.enforcement));
  }

  // ----- 6. References ------------------------------------------------------
  children.push(h1('6. References'));

  if (p.frameworks?.length) {
    children.push(h2('Frameworks'));
    p.frameworks.forEach(f => {
      children.push(bullet([new TextRun({ text: f })]));
    });
  }

  const allControls = (p.sections ?? []).flatMap(s => s.controls ?? []);
  if (allControls.length) {
    children.push(h2('Control Mappings'));
    const seen = new Set<string>();
    allControls.forEach(c => {
      const key = `${c.framework ?? ''}|${c.id ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      children.push(bullet([
        new TextRun({ text: `${c.framework ?? ''} ${c.id ?? ''}`.trim(), bold: true }),
        ...(c.why ? [new TextRun({ text: ` — ${c.why}` })] : []),
      ]));
    });
  }

  if (Array.isArray(m.definitions) && m.definitions.length) {
    children.push(h2('Definitions'));
    m.definitions.forEach(d => {
      children.push(bullet([
        new TextRun({ text: `${d.term ?? ''}: `, bold: true }),
        new TextRun({ text: d.definition ?? '' }),
      ]));
    });
  }

  if (Array.isArray(m.revision_history) && m.revision_history.length) {
    children.push(h2('Revision History'));
    m.revision_history.forEach(r => {
      children.push(bullet([
        new TextRun({ text: `v${r.version ?? '?'} `, bold: true }),
        new TextRun({ text: `(${r.date ?? 'n/d'}) — ${r.note ?? ''}` }),
      ]));
    });
  }

  // Always leave a "generated by" trailer so re-imports are traceable.
  children.push(new Paragraph({
    spacing: { before: 320 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: `Generated by Ray \u00b7 Wrayth \u2014 policy id ${p.id}`,
      italics: true, size: 16, color: '999999',
    })],
  }));

  return new Document({
    creator: 'Ray \u00b7 Wrayth',
    title: p.title,
    description: `${p.policy_type} policy${p.organization_name ? ` for ${p.organization_name}` : ''}`,
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 30, bold: true, font: 'Arial', color: '111827' },
          paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: '1f2937' },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });
}
