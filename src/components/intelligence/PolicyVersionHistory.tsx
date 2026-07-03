/**
 * Version history + diff view for a Ray-generated policy.
 *
 * Every mutation of `ray_policies` triggers a snapshot in `ray_policy_versions`
 * (see the trg_ray_policies_snapshot DB trigger). This panel lists those
 * snapshots and lets the user diff any prior version against the current one
 * or against another version, so iteration on a policy is transparent and
 * auditable.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { History, GitCompare, Loader2, ArrowRight } from 'lucide-react';
import { diffLines, type Change } from 'diff';
import { toast } from 'sonner';

export type PolicyVersion = {
  id: string;
  policy_id: string;
  version_number: number;
  title: string;
  frameworks: string[];
  sections: unknown;
  metadata: Record<string, unknown>;
  markdown: string | null;
  note: string | null;
  created_at: string;
};

type Props = {
  policyId: string;
  organizationName: string | null;
  /** Renders the version snapshot to Markdown for diffing. Provided by parent
   * so this component reuses the exact same renderer as the DOCX/Markdown
   * export — a diff of "what the user actually sees" not of raw JSON. */
  renderVersionMarkdown: (v: PolicyVersion, organizationName: string | null) => string;
  currentMarkdown: string;
};

export default function PolicyVersionHistory({
  policyId, organizationName, renderVersionMarkdown, currentMarkdown,
}: Props) {
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('__current__');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('ray_policy_versions')
        .select('*')
        .eq('policy_id', policyId)
        .order('version_number', { ascending: false });
      if (error) throw error;
      setVersions((data as PolicyVersion[] | null) ?? []);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to load versions.');
    } finally {
      setLoading(false);
    }
  }, [policyId]);

  useEffect(() => { load(); }, [load]);

  // Reload on external mutations to this policy (regenerate, edit, etc.).
  useEffect(() => {
    const channel = supabase
      .channel(`ray_policy_versions:${policyId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ray_policy_versions', filter: `policy_id=eq.${policyId}` },
        () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [policyId, load]);

  const latest = versions[0];

  function openDiff(vId: string) {
    setLeftId(vId);
    setRightId('__current__');
    setDiffOpen(true);
  }

  const diffPair = useMemo(() => {
    if (!diffOpen) return null;
    const left = versions.find(v => v.id === leftId);
    if (!left) return null;
    const leftMd = renderVersionMarkdown(left, organizationName);
    const rightMd = rightId === '__current__'
      ? currentMarkdown
      : (() => {
          const r = versions.find(v => v.id === rightId);
          return r ? renderVersionMarkdown(r, organizationName) : '';
        })();
    return { left, leftMd, rightMd, changes: diffLines(leftMd, rightMd) };
  }, [diffOpen, leftId, rightId, versions, organizationName, currentMarkdown, renderVersionMarkdown]);

  return (
    <>
      <section className="space-y-2 pt-4 border-t border-border/60">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Version history
            {versions.length > 0 && (
              <span className="normal-case tracking-normal text-muted-foreground/70 ml-1">
                ({versions.length})
              </span>
            )}
          </h3>
          {latest && versions.length > 1 && (
            <Button
              size="sm" variant="outline" className="rounded-sm gap-1.5 h-7 text-[11px]"
              onClick={() => openDiff(versions[1].id)}
            >
              <GitCompare className="h-3.5 w-3.5" /> Diff last two
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading versions…
          </div>
        ) : versions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            No prior versions yet. A snapshot is captured automatically every time this policy is regenerated or edited.
          </p>
        ) : (
          <ol className="space-y-1">
            {versions.map((v, idx) => {
              const isCurrent = idx === 0;
              return (
                <li
                  key={v.id}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-sm border px-2.5 py-2 text-xs',
                    isCurrent
                      ? 'border-[hsl(262_60%_64%/0.5)] bg-[hsl(262_60%_64%/0.08)]'
                      : 'border-border bg-muted/30',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider border-border shrink-0"
                      >
                        v{v.version_number}
                      </Badge>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider text-[hsl(262_60%_70%)]">
                          current
                        </span>
                      )}
                      <span className="text-muted-foreground truncate">
                        {v.note || 'Edited'}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(v.created_at), 'PP p')} · {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {!isCurrent && (
                    <Button
                      variant="ghost" size="sm"
                      className="rounded-sm gap-1 h-7 text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => openDiff(v.id)}
                    >
                      <GitCompare className="h-3.5 w-3.5" /> Diff
                    </Button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" /> Policy diff
            </DialogTitle>
            <DialogDescription>
              Line-level comparison of the rendered policy. Green lines were added, red lines were removed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Compare</span>
            <Select value={leftId} onValueChange={setLeftId}>
              <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue placeholder="Version" /></SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    v{v.version_number} — {format(new Date(v.created_at), 'PP')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={rightId} onValueChange={setRightId}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Target" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__current__" className="text-xs">Current (live)</SelectItem>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.id} className="text-xs">
                    v{v.version_number} — {format(new Date(v.created_at), 'PP')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-auto border border-border rounded-sm bg-muted/20">
            {!diffPair ? (
              <div className="p-6 text-sm text-muted-foreground">Pick a version to compare.</div>
            ) : (
              <DiffView changes={diffPair.changes} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DiffView({ changes }: { changes: Change[] }) {
  const added = changes.filter(c => c.added).reduce((n, c) => n + (c.count ?? 0), 0);
  const removed = changes.filter(c => c.removed).reduce((n, c) => n + (c.count ?? 0), 0);

  return (
    <div className="text-xs font-mono">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-3 py-1.5 bg-background border-b border-border text-[11px]">
        <span className="text-emerald-500">+{added}</span>
        <span className="text-red-500">-{removed}</span>
        <span className="text-muted-foreground ml-auto font-sans">
          {added === 0 && removed === 0 ? 'Identical' : 'Line diff'}
        </span>
      </div>
      <pre className="p-0 m-0 whitespace-pre-wrap">
        {changes.map((c, i) => {
          const cls = c.added
            ? 'bg-emerald-500/10 text-emerald-100 border-l-2 border-emerald-500'
            : c.removed
              ? 'bg-red-500/10 text-red-100 border-l-2 border-red-500'
              : 'text-muted-foreground border-l-2 border-transparent';
          const prefix = c.added ? '+ ' : c.removed ? '- ' : '  ';
          const lines = c.value.split('\n');
          // Trim trailing empty line so we don't render an empty gutter row.
          if (lines[lines.length - 1] === '') lines.pop();
          return (
            <div key={i} className={cn('py-0', cls)}>
              {lines.map((ln, j) => (
                <div key={j} className="px-3 py-0.5">
                  <span className="text-muted-foreground/50 mr-1 select-none">{prefix}</span>
                  {ln || '\u00a0'}
                </div>
              ))}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
