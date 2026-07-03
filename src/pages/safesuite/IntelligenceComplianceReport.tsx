/**
 * Intelligence → Compliance Gap Report.
 *
 * Renders a prioritized, exportable gap report for a completed compliance
 * scan (ray_compliance_scans). Every gap is ranked by a computed risk score
 * (severity weighted, effort adjusted, control-state boosted), grouped by
 * framework domain, annotated with impacted systems, and exportable to a
 * consistent DOCX for auditors and execs.
 *
 * The underlying scan may or may not have `impacted_systems` / `risk_score`
 * / `control_state` per gap depending on when it was generated — this view
 * degrades gracefully and computes defaults so historical scans still render
 * a full report.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  ClipboardCheck, ShieldAlert, FileDown, Loader2, ArrowLeft, Server,
  Target, TrendingDown, ListChecks, FolderOpen, KeyRound, MonitorSmartphone,
  ScrollText, FileSearch, Camera, Settings2, ExternalLink, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType,
  LevelFormat, PageOrientation, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';

type Gap = {
  control?: string;
  domain?: string;
  gap?: string;
  severity?: string;
  effort?: string;
  risk_score?: number;
  control_state?: string;
  impacted_systems?: string[];
  remediation?: string;
};

type ScanRow = {
  id: string;
  framework: string;
  scope: string | null;
  organization_context: string | null;
  status: string;
  overall_score: number | null;
  posture: string | null;
  totals: { controls_total?: number; controls_met?: number; controls_partial?: number; controls_missing?: number };
  domains: Array<{ name?: string; score?: number; status?: string; why?: string }>;
  gaps: Gap[];
  executive_summary: string | null;
  created_at: string;
};

const SEVERITY_RANK: Record<string, number> = { critical: 100, high: 75, medium: 50, low: 25 };
const EFFORT_MULT: Record<string, number> = { low: 1.15, medium: 1.0, high: 0.85 };
const STATE_BOOST: Record<string, number> = { missing: 10, weak: 5, partial: 0 };

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'border-[hsl(0_80%_50%/0.5)] bg-[hsl(0_80%_50%/0.08)] text-[hsl(0_80%_70%)]',
  high:     'border-[hsl(20_80%_50%/0.5)] bg-[hsl(20_80%_50%/0.08)] text-[hsl(20_80%_70%)]',
  medium:   'border-[hsl(38_90%_50%/0.5)] bg-[hsl(38_90%_50%/0.08)] text-[hsl(38_90%_70%)]',
  low:      'border-[hsl(140_60%_50%/0.5)] bg-[hsl(140_60%_50%/0.08)] text-[hsl(140_60%_70%)]',
};

function riskScoreFor(g: Gap): number {
  if (typeof g.risk_score === 'number') return Math.max(0, Math.min(100, Math.round(g.risk_score)));
  const base = SEVERITY_RANK[(g.severity ?? '').toLowerCase()] ?? 40;
  const mult = EFFORT_MULT[(g.effort ?? '').toLowerCase()] ?? 1;
  const boost = STATE_BOOST[(g.control_state ?? '').toLowerCase()] ?? 0;
  return Math.max(0, Math.min(100, Math.round(base * mult + boost)));
}

function stateOf(g: Gap): 'missing' | 'weak' | 'partial' {
  const s = (g.control_state ?? '').toLowerCase();
  if (s === 'missing' || s === 'weak' || s === 'partial') return s;
  // Fall back: critical/high with no state → missing; medium → weak; low → partial.
  const sev = (g.severity ?? '').toLowerCase();
  if (sev === 'critical' || sev === 'high') return 'missing';
  if (sev === 'medium') return 'weak';
  return 'partial';
}

// ─── Evidence checklist ──────────────────────────────────────────────────
//
// For every gap we synthesize a short, opinionated list of the exact
// artifacts an auditor typically wants to close the finding. Each item
// links to the most relevant place inside Wrayth (SafeDoc for documents,
// SafePass for credentials, Vanguard for endpoint config, Ray for logs
// & investigations) so users can jump straight to where the evidence lives.

type EvidenceKind = 'document' | 'record' | 'config' | 'log' | 'screenshot' | 'policy';

type EvidenceItem = {
  id: string;
  kind: EvidenceKind;
  label: string;
  hint: string;
  href?: string;
};

const KIND_META: Record<EvidenceKind, { icon: typeof FolderOpen; tone: string }> = {
  document:   { icon: FolderOpen,       tone: 'text-[hsl(220_80%_70%)]' },
  record:     { icon: FileSearch,       tone: 'text-[hsl(200_70%_70%)]' },
  config:     { icon: Settings2,        tone: 'text-[hsl(160_60%_65%)]' },
  log:        { icon: ScrollText,       tone: 'text-[hsl(38_80%_70%)]' },
  screenshot: { icon: Camera,           tone: 'text-[hsl(280_60%_75%)]' },
  policy:     { icon: ClipboardCheck,   tone: 'text-[hsl(262_70%_75%)]' },
};

const EVIDENCE_ROUTES = {
  documents:      '/app/intelligence/history',
  policies:       '/app/intelligence/policies',
  investigations: '/app/intelligence/investigations',
  logs:           '/app/intelligence/logs',
  reports:        '/app/intelligence/reports',
  graph:          '/app/intelligence/graph',
  vault:          '/app/products/safepass',
};

const EVIDENCE_RULES: Array<{
  match: RegExp;
  items: Omit<EvidenceItem, 'id'>[];
}> = [
  {
    match: /\b(mfa|multi-?factor|2fa|otp|totp)\b/i,
    items: [
      { kind: 'screenshot', label: 'MFA enforcement screenshot', hint: 'IdP/tenant admin console showing MFA is required for all users.', href: EVIDENCE_ROUTES.documents },
      { kind: 'record',     label: 'User MFA enrollment export',  hint: 'CSV/report of every active user with their MFA status.', href: EVIDENCE_ROUTES.reports },
      { kind: 'policy',     label: 'Access control policy',       hint: 'Signed policy that mandates MFA and specifies allowed factors.', href: EVIDENCE_ROUTES.policies },
    ],
  },
  {
    match: /\b(password|credential|secret|vault|rotation)\b/i,
    items: [
      { kind: 'policy',   label: 'Password / credential policy', hint: 'Complexity, rotation cadence, storage rules, shared-account handling.', href: EVIDENCE_ROUTES.policies },
      { kind: 'record',   label: 'Vault inventory + last-rotated dates', hint: 'Export from SafePass showing shared secrets and rotation timestamps.', href: EVIDENCE_ROUTES.vault },
      { kind: 'log',      label: 'Rotation & access audit log',  hint: 'Who accessed which secret when, and last rotation events.',       href: EVIDENCE_ROUTES.logs },
    ],
  },
  {
    match: /\b(access|rbac|least[- ]?privilege|privilege|authorization|role)\b/i,
    items: [
      { kind: 'record',   label: 'Role / entitlement matrix',    hint: 'Mapping of roles → systems → permissions, plus current assignments.', href: EVIDENCE_ROUTES.reports },
      { kind: 'record',   label: 'Access review sign-off',       hint: 'Most recent quarterly access review with owner approvals.',        href: EVIDENCE_ROUTES.documents },
      { kind: 'log',      label: 'Privileged access audit log',  hint: 'Admin logins, sudo/elevation events, break-glass usage.',           href: EVIDENCE_ROUTES.logs },
    ],
  },
  {
    match: /\b(logging|log|audit|monitor|siem|detection)\b/i,
    items: [
      { kind: 'config',   label: 'Log source coverage list',     hint: 'Every in-scope system + which logs are shipped to the SIEM.',      href: EVIDENCE_ROUTES.graph },
      { kind: 'log',      label: 'Sample log snapshots',         hint: 'At least 30 days of retention proof from each critical source.',   href: EVIDENCE_ROUTES.logs },
      { kind: 'policy',   label: 'Log retention & review policy', hint: 'Retention windows, who reviews, how alerts are triaged.',         href: EVIDENCE_ROUTES.policies },
    ],
  },
  {
    match: /\b(backup|restore|recovery|dr|bcp|resilience)\b/i,
    items: [
      { kind: 'record',   label: 'Latest successful backup report', hint: 'Job status export for each critical system + retention proof.', href: EVIDENCE_ROUTES.reports },
      { kind: 'document', label: 'Restore test evidence',        hint: 'Signed record of the last full restore test with timing/results.', href: EVIDENCE_ROUTES.documents },
      { kind: 'policy',   label: 'DR / BCP plan',                hint: 'Current plan with RTO/RPO, contact tree, and last exercise date.', href: EVIDENCE_ROUTES.policies },
    ],
  },
  {
    match: /\b(vuln|patch|update|cve|scan)\b/i,
    items: [
      { kind: 'record',   label: 'Vulnerability scan export',    hint: 'Most recent scan showing findings, severities, and status.',       href: EVIDENCE_ROUTES.reports },
      { kind: 'record',   label: 'Patch compliance report',      hint: 'Per-endpoint patch level + missing critical/important updates.',   href: EVIDENCE_ROUTES.reports },
      { kind: 'policy',   label: 'Vulnerability management SLA', hint: 'SLA for triaging and remediating critical/high findings.',          href: EVIDENCE_ROUTES.policies },
    ],
  },
  {
    match: /\b(encrypt|tls|ssl|at[- ]rest|in[- ]transit|kms)\b/i,
    items: [
      { kind: 'config',     label: 'Encryption configuration',   hint: 'TLS versions/ciphers, at-rest encryption per datastore, KMS setup.', href: EVIDENCE_ROUTES.graph },
      { kind: 'screenshot', label: 'Cert & key inventory',       hint: 'Certificates, expiries, key rotation cadence.',                    href: EVIDENCE_ROUTES.documents },
      { kind: 'policy',     label: 'Cryptography policy',        hint: 'Approved algorithms, key lengths, rotation frequency.',            href: EVIDENCE_ROUTES.policies },
    ],
  },
  {
    match: /\b(incident|response|ir|breach|containment|forensic)\b/i,
    items: [
      { kind: 'policy',   label: 'Incident response runbook',    hint: 'Current IR plan with roles, escalation paths, comms tree.',        href: EVIDENCE_ROUTES.policies },
      { kind: 'document', label: 'Tabletop / drill record',      hint: 'Last IR exercise: date, scenario, participants, lessons.',         href: EVIDENCE_ROUTES.documents },
      { kind: 'record',   label: 'Recent investigation timeline', hint: 'A real Ray investigation with actions, artifacts, and outcome.',  href: EVIDENCE_ROUTES.investigations },
    ],
  },
  {
    match: /\b(training|awareness|phish|education)\b/i,
    items: [
      { kind: 'record',   label: 'Training completion roster',   hint: 'Per-user completion status for the last training cycle.',          href: EVIDENCE_ROUTES.reports },
      { kind: 'document', label: 'Training content / curriculum', hint: 'Slides, modules, or LMS course used this cycle.',                 href: EVIDENCE_ROUTES.documents },
      { kind: 'record',   label: 'Phishing simulation results',  hint: 'Click / report rates from the last simulation campaign.',          href: EVIDENCE_ROUTES.reports },
    ],
  },
  {
    match: /\b(vendor|third[- ]?party|supplier|contract|dpa)\b/i,
    items: [
      { kind: 'document', label: 'Vendor inventory',             hint: 'List of vendors, data types shared, criticality tier.',            href: EVIDENCE_ROUTES.documents },
      { kind: 'document', label: 'Signed DPA / security addendum', hint: 'Executed data processing / security terms for each vendor.',     href: EVIDENCE_ROUTES.documents },
      { kind: 'record',   label: 'Vendor risk assessment',       hint: 'Most recent questionnaire / SOC 2 review per vendor.',             href: EVIDENCE_ROUTES.reports },
    ],
  },
  {
    match: /\b(endpoint|edr|antivirus|av|device|laptop|workstation)\b/i,
    items: [
      { kind: 'record',   label: 'Endpoint inventory + agent status', hint: 'Every managed endpoint with EDR/AV agent health.',            href: EVIDENCE_ROUTES.reports },
      { kind: 'config',   label: 'EDR / AV policy configuration', hint: 'Screenshots of enforced policies (real-time scan, tamper protection).', href: EVIDENCE_ROUTES.graph },
      { kind: 'log',      label: 'Recent detection log sample',   hint: '30 days of detections/alerts from EDR console.',                   href: EVIDENCE_ROUTES.logs },
    ],
  },
  {
    match: /\b(network|firewall|segmentation|vpn|acl)\b/i,
    items: [
      { kind: 'config',     label: 'Firewall ruleset export',    hint: 'Current inbound/outbound rules with owner + justification.',       href: EVIDENCE_ROUTES.graph },
      { kind: 'document',   label: 'Network diagram',            hint: 'Up-to-date diagram showing segmentation and trust boundaries.',    href: EVIDENCE_ROUTES.documents },
      { kind: 'record',     label: 'Firewall change tickets',    hint: 'Recent change requests with approvals for network changes.',        href: EVIDENCE_ROUTES.documents },
    ],
  },
  {
    match: /\b(data|classification|dlp|retention|privacy|pii|phi)\b/i,
    items: [
      { kind: 'document', label: 'Data classification scheme',   hint: 'Tiers, examples, handling rules per tier.',                        href: EVIDENCE_ROUTES.documents },
      { kind: 'record',   label: 'Data inventory / RoPA',        hint: 'Where each data type lives, retention window, legal basis.',       href: EVIDENCE_ROUTES.reports },
      { kind: 'policy',   label: 'Data retention & disposal policy', hint: 'How long each class is kept and how it is destroyed.',         href: EVIDENCE_ROUTES.policies },
    ],
  },
];

const DEFAULT_EVIDENCE: Omit<EvidenceItem, 'id'>[] = [
  { kind: 'policy',   label: 'Written control statement',   hint: 'Documented policy or standard that addresses this control.',       href: EVIDENCE_ROUTES.policies },
  { kind: 'record',   label: 'Operational evidence sample', hint: 'At least one recent record showing the control operating.',        href: EVIDENCE_ROUTES.reports },
  { kind: 'document', label: 'Owner sign-off',              hint: 'Named control owner with approval date on file.',                  href: EVIDENCE_ROUTES.documents },
];

function evidenceFor(g: Gap): EvidenceItem[] {
  const text = [g.control, g.domain, g.gap, g.remediation].filter(Boolean).join(' ').toLowerCase();
  const seen = new Set<string>();
  const out: EvidenceItem[] = [];
  for (const rule of EVIDENCE_RULES) {
    if (!rule.match.test(text)) continue;
    for (const item of rule.items) {
      const key = `${item.kind}:${item.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...item, id: key });
    }
    if (out.length >= 6) break;
  }
  if (out.length < 3) {
    for (const item of DEFAULT_EVIDENCE) {
      const key = `${item.kind}:${item.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ ...item, id: key });
    }
  }
  // Impacted-system-specific reminder — surfaces the exact assets to attach evidence for.
  if ((g.impacted_systems ?? []).length) {
    out.push({
      id: 'record:impacted-systems',
      kind: 'record',
      label: `Evidence for each impacted system (${(g.impacted_systems ?? []).length})`,
      hint: (g.impacted_systems ?? []).join(', '),
      href: EVIDENCE_ROUTES.graph,
    });
  }
  return out.slice(0, 7);
}

const CHECKS_STORAGE_KEY = 'ray.evidence.checks.v1';

function loadChecks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(CHECKS_STORAGE_KEY) || '{}');
  } catch { return {}; }
}
function saveChecks(state: Record<string, boolean>) {
  try { localStorage.setItem(CHECKS_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
function checkKey(scanId: string, gapIdx: number, evidenceId: string) {
  return `${scanId}::${gapIdx}::${evidenceId}`;
}

export default function IntelligenceComplianceReport() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialId = params.get('id');
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [scanId, setScanId] = useState<string | null>(initialId);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('ray_compliance_scans')
        .select('*')
        .eq('status', 'complete')
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      const rows = (data as ScanRow[] | null) ?? [];
      setScans(rows);
      if (!scanId && rows[0]) setScanId(rows[0].id);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to load scans.');
    } finally {
      setLoading(false);
    }
  }, [user, scanId]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const scan = useMemo(() => scans.find(s => s.id === scanId) ?? null, [scans, scanId]);

  const gaps = useMemo(() => {
    if (!scan) return [];
    return (scan.gaps ?? []).map(g => ({ ...g, _risk: riskScoreFor(g), _state: stateOf(g) }));
  }, [scan]);

  const domains = useMemo(
    () => Array.from(new Set(gaps.map(g => g.domain).filter(Boolean))) as string[],
    [gaps],
  );

  const filtered = useMemo(() => {
    return gaps
      .filter(g => severityFilter === 'all' || (g.severity ?? '').toLowerCase() === severityFilter)
      .filter(g => domainFilter === 'all' || g.domain === domainFilter)
      .sort((a, b) => b._risk - a._risk);
  }, [gaps, severityFilter, domainFilter]);

  const impactedSystems = useMemo(() => {
    const map = new Map<string, number>();
    gaps.forEach(g => (g.impacted_systems ?? []).forEach(s => {
      const key = s.trim();
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    }));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [gaps]);

  const buckets = useMemo(() => ({
    critical: gaps.filter(g => (g.severity ?? '').toLowerCase() === 'critical').length,
    high:     gaps.filter(g => (g.severity ?? '').toLowerCase() === 'high').length,
    medium:   gaps.filter(g => (g.severity ?? '').toLowerCase() === 'medium').length,
    low:      gaps.filter(g => (g.severity ?? '').toLowerCase() === 'low').length,
    missing:  gaps.filter(g => g._state === 'missing').length,
    weak:     gaps.filter(g => g._state === 'weak').length,
    partial:  gaps.filter(g => g._state === 'partial').length,
  }), [gaps]);

  function pickScan(id: string) {
    setScanId(id);
    setParams({ id }, { replace: true });
  }

  async function exportDocx() {
    if (!scan) return;
    setExporting(true);
    try {
      const doc = buildReportDocx(scan, filtered, impactedSystems, buckets);
      const blob = await Packer.toBlob(doc);
      const safe = `${scan.framework}-gap-report`.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      saveAs(blob, `${safe}.docx`);
      toast.success('Gap report exported.');
    } catch (e) {
      toast.error((e as Error).message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Ray Intelligence · Compliance Gap Report
          </div>
          <h1 className="text-2xl font-semibold mt-1 flex items-center gap-2">
            Prioritized Gap Report
            <ShieldAlert className="h-5 w-5 text-[hsl(20_80%_65%)]" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Every open gap ranked by risk, with impacted systems and a clean list of missing or weak controls — ready to hand to an auditor or your remediation team.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-sm gap-1.5">
          <Link to="/app/intelligence/compliance"><ArrowLeft className="h-3.5 w-3.5" /> Back to scans</Link>
        </Button>
      </div>

      {/* Scan picker + export */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 grid md:grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Compliance scan</Label>
            <Select value={scanId ?? ''} onValueChange={pickScan}>
              <SelectTrigger><SelectValue placeholder={loading ? 'Loading…' : 'Pick a scan'} /></SelectTrigger>
              <SelectContent>
                {scans.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.framework} · score {s.overall_score ?? '—'} · {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Severity</Label>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Domain</Label>
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                {domains.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={exportDocx}
            disabled={!scan || exporting}
            className="rounded-sm gap-1.5"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Export DOCX
          </Button>
        </CardContent>
      </Card>

      {!scan ? (
        <Card className="border-border bg-card">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {loading ? 'Loading compliance scans…' : 'No completed compliance scans yet. Run a scan first.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Header stats */}
          <div className="grid md:grid-cols-4 gap-3">
            <StatCard label="Framework" value={scan.framework} sub={scan.posture ?? '—'} />
            <StatCard label="Overall score" value={`${scan.overall_score ?? '—'}/100`} sub={scan.posture ?? '—'} />
            <StatCard
              label="Open gaps"
              value={gaps.length}
              sub={`${buckets.critical} critical · ${buckets.high} high`}
              tone={buckets.critical > 0 ? 'danger' : buckets.high > 0 ? 'warn' : 'default'}
            />
            <StatCard
              label="Control state"
              value={`${buckets.missing} missing`}
              sub={`${buckets.weak} weak · ${buckets.partial} partial`}
              tone={buckets.missing > 0 ? 'warn' : 'default'}
            />
          </div>

          {/* Executive summary */}
          {scan.executive_summary && (
            <Card className="border-border bg-card">
              <CardContent className="p-4 text-sm leading-relaxed">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Executive summary
                </div>
                {scan.executive_summary}
              </CardContent>
            </Card>
          )}

          {/* Impacted systems */}
          {impactedSystems.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-4 space-y-2">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" /> Impacted systems
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {impactedSystems.map(([sys, n]) => (
                    <Badge key={sys} variant="outline" className="text-[11px] border-border rounded-sm">
                      {sys} <span className="ml-1 text-muted-foreground">×{n}</span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prioritized gap table */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5" /> Gaps by risk
                  <span className="normal-case tracking-normal text-muted-foreground/70 ml-1">
                    ({filtered.length}{filtered.length !== gaps.length && ` of ${gaps.length}`})
                  </span>
                </div>
              </div>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No gaps match the current filters.
                </p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((g, i) => (
                    <GapRow key={i} rank={i + 1} g={g} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Missing / weak controls list */}
          <Card className="border-border bg-card">
            <CardContent className="p-4 space-y-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" /> Missing or weak controls
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <ControlList
                  title="Missing"
                  items={gaps.filter(g => g._state === 'missing')}
                  tone="critical"
                />
                <ControlList
                  title="Weak"
                  items={gaps.filter(g => g._state === 'weak')}
                  tone="high"
                />
                <ControlList
                  title="Partial"
                  items={gaps.filter(g => g._state === 'partial')}
                  tone="medium"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, tone = 'default' }: {
  label: string; value: React.ReactNode; sub?: string;
  tone?: 'default' | 'warn' | 'danger';
}) {
  const border = tone === 'danger' ? 'border-[hsl(0_80%_50%/0.5)]'
    : tone === 'warn' ? 'border-[hsl(20_80%_50%/0.4)]'
    : 'border-border';
  return (
    <Card className={cn('bg-card', border)}>
      <CardContent className="p-4 space-y-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
        {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function GapRow({ rank, g }: { rank: number; g: Gap & { _risk: number; _state: string } }) {
  const sev = (g.severity ?? 'medium').toLowerCase();
  return (
    <div className="rounded-sm border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">#{rank}</span>
          <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider rounded-sm', SEVERITY_STYLES[sev])}>
            {g.severity ?? 'medium'}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-border rounded-sm">
            {g._state}
          </Badge>
          <span className="text-sm font-medium truncate">{g.control ?? 'Control'}</span>
          {g.domain && (
            <span className="text-[11px] text-muted-foreground truncate">· {g.domain}</span>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk</div>
          <div className="text-sm font-semibold tabular-nums">{g._risk}</div>
        </div>
      </div>
      {g.gap && <p className="text-sm leading-relaxed">{g.gap}</p>}
      {g.remediation && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="uppercase tracking-wider text-muted-foreground/70 mr-1">Fix:</span>
          {g.remediation}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {g.effort && (
          <Badge variant="outline" className="text-[10px] border-border rounded-sm">
            Effort: {g.effort}
          </Badge>
        )}
        {(g.impacted_systems ?? []).map((s, i) => (
          <Badge key={i} variant="outline" className="text-[10px] border-border rounded-sm">
            <Server className="h-2.5 w-2.5 mr-1" /> {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ControlList({ title, items, tone }: { title: string; items: Gap[]; tone: keyof typeof SEVERITY_STYLES }) {
  return (
    <div className="rounded-sm border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{title}</span>
        <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider rounded-sm', SEVERITY_STYLES[tone])}>
          {items.length}
        </Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 15).map((g, i) => (
            <li key={i} className="text-[12px] leading-snug">
              <span className="font-medium">{g.control ?? 'Control'}</span>
              {g.domain && <span className="text-muted-foreground"> · {g.domain}</span>}
            </li>
          ))}
          {items.length > 15 && (
            <li className="text-[11px] text-muted-foreground">+{items.length - 15} more…</li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── DOCX export ───────────────────────────────────────────────────────────

const CELL_BORDER = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const CELL_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER };

function tCell(text: string, opts: { bold?: boolean; width: number; shade?: string } = { width: 1000 }) {
  return new TableCell({
    borders: CELL_BORDERS,
    width: { size: opts.width, type: WidthType.DXA },
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold })] })],
  });
}

function buildReportDocx(
  scan: ScanRow,
  gaps: Array<Gap & { _risk: number; _state: string }>,
  impacted: Array<[string, number]>,
  buckets: { critical: number; high: number; medium: number; low: number; missing: number; weak: number; partial: number },
): Document {
  const children: Paragraph[] = [];
  const h1 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 }, children: [new TextRun({ text: t, bold: true })] });
  const h2 = (t: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, bold: true })] });
  const p = (t: string) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: t })] });
  const bullet = (t: string) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t })] });

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 200 },
    children: [new TextRun({ text: `${scan.framework} — Compliance Gap Report`, bold: true, size: 36 })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 320 },
    children: [new TextRun({
      text: `Overall score ${scan.overall_score ?? '—'}/100  \u2022  Posture: ${scan.posture ?? '—'}  \u2022  Generated ${new Date(scan.created_at).toLocaleDateString()}`,
      italics: true, size: 20, color: '666666',
    })],
  }));

  children.push(h1('1. Executive Summary'));
  children.push(p(scan.executive_summary?.trim() || 'No executive summary was generated for this scan.'));

  children.push(h1('2. Scorecard'));
  children.push(bullet(`Open gaps: ${gaps.length}`));
  children.push(bullet(`By severity: ${buckets.critical} critical, ${buckets.high} high, ${buckets.medium} medium, ${buckets.low} low`));
  children.push(bullet(`By state: ${buckets.missing} missing, ${buckets.weak} weak, ${buckets.partial} partial`));
  if (impacted.length) children.push(bullet(`Impacted systems: ${impacted.slice(0, 20).map(([s, n]) => `${s} (×${n})`).join(', ')}`));

  children.push(h1('3. Prioritized Gaps'));
  if (gaps.length === 0) {
    children.push(p('No open gaps recorded for this scan.'));
  } else {
    const header = new TableRow({
      tableHeader: true,
      children: [
        tCell('#', { bold: true, width: 500, shade: 'F2F2F2' }),
        tCell('Risk', { bold: true, width: 700, shade: 'F2F2F2' }),
        tCell('Severity', { bold: true, width: 1000, shade: 'F2F2F2' }),
        tCell('State', { bold: true, width: 900, shade: 'F2F2F2' }),
        tCell('Control', { bold: true, width: 1800, shade: 'F2F2F2' }),
        tCell('Domain', { bold: true, width: 1400, shade: 'F2F2F2' }),
        tCell('Gap / Remediation', { bold: true, width: 3060, shade: 'F2F2F2' }),
      ],
    });
    const widths = [500, 700, 1000, 900, 1800, 1400, 3060];
    const rows = gaps.map((g, i) => new TableRow({
      children: [
        tCell(String(i + 1), { width: widths[0] }),
        tCell(String(g._risk), { width: widths[1], bold: true }),
        tCell((g.severity ?? '').toUpperCase(), { width: widths[2] }),
        tCell(g._state, { width: widths[3] }),
        tCell(g.control ?? '—', { width: widths[4] }),
        tCell(g.domain ?? '—', { width: widths[5] }),
        tCell(`${g.gap ?? ''}${g.remediation ? `\nFix: ${g.remediation}` : ''}${(g.impacted_systems ?? []).length ? `\nImpacts: ${(g.impacted_systems ?? []).join(', ')}` : ''}`, { width: widths[6] }),
      ],
    }));
    children.push(new Paragraph({ children: [] })); // spacer
    // Tables can't sit in children[] as Paragraph — need to add as separate section child.
    // docx-js allows Table in section children directly, so we wrap below.
    (children as unknown as Array<Paragraph | Table>).push(new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: widths,
      rows: [header, ...rows],
    }));
  }

  children.push(h1('4. Missing or Weak Controls'));
  const missing = gaps.filter(g => g._state === 'missing');
  const weak = gaps.filter(g => g._state === 'weak');
  const partial = gaps.filter(g => g._state === 'partial');
  const emit = (label: string, arr: Gap[]) => {
    children.push(h2(`${label} (${arr.length})`));
    if (arr.length === 0) children.push(p('None.'));
    arr.forEach(g => children.push(bullet(`${g.control ?? 'Control'}${g.domain ? ` — ${g.domain}` : ''}${g.severity ? ` [${g.severity}]` : ''}`)));
  };
  emit('Missing', missing);
  emit('Weak', weak);
  emit('Partial', partial);

  children.push(h1('5. Impacted Systems'));
  if (impacted.length === 0) {
    children.push(p('No specific systems were tagged. Treat gaps as org-wide.'));
  } else {
    impacted.forEach(([s, n]) => children.push(bullet(`${s} — referenced in ${n} gap${n === 1 ? '' : 's'}`)));
  }

  return new Document({
    creator: 'Ray \u00b7 Wrayth',
    title: `${scan.framework} Gap Report`,
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 30, bold: true, font: 'Arial', color: '111827' },
          paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Arial', color: '1f2937' },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [{
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: children as unknown as Array<Paragraph | Table>,
    }],
  });
}
