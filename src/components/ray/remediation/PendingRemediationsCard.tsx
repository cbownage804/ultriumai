/**
 * PendingRemediationsCard — Ray's proactive "I can fix N things for you"
 * card. Reads open recommendations, resolves each to a catalog remediation,
 * and offers Review + Fix everything.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  resolveAll,
  type ResolvedRemediation,
  type RayRecommendationLite,
} from '@/lib/ray/remediations/resolver';
import { BatchFixDialog } from './BatchFixDialog';

const RISK_CLS = {
  low: 'border-emerald-500/40 text-emerald-200',
  medium: 'border-amber-500/40 text-amber-200',
  high: 'border-red-500/40 text-red-300',
} as const;

interface Props {
  limit?: number;
  title?: string;
}

export function PendingRemediationsCard({ limit = 6, title }: Props) {
  const [pairs, setPairs] = useState<Array<{ rec: RayRecommendationLite; resolved: ResolvedRemediation }> | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ray_recommendations')
      .select('id, title, body, category, severity, rule_slug')
      .in('status', ['new', 'reviewed'])
      .order('severity', { ascending: true })
      .order('last_seen_at', { ascending: false })
      .limit(50);
    const recs = (data ?? []) as RayRecommendationLite[];
    setPairs(resolveAll(recs).slice(0, limit));
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSeconds = useMemo(
    () => (pairs ?? []).reduce((n, p) => n + p.resolved.remediation.estimatedSeconds, 0),
    [pairs],
  );
  const mins = totalSeconds >= 60 ? `${Math.round(totalSeconds / 60)} minute${totalSeconds >= 120 ? 's' : ''}` : `${totalSeconds}s`;

  if (pairs === null) {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Loading…</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking for things I can fix…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pairs.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Nothing to fix right now</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ray hasn't found anything actionable. When something needs a one-click fix, it'll show up here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-300" />
            <CardTitle className="text-lg">
              {title ?? `I can safely fix ${pairs.length} thing${pairs.length === 1 ? '' : 's'} for you`}
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-violet-400/40 text-violet-200 text-[10px]">
            ~{mins}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="space-y-1.5">
            {pairs.map(({ rec, resolved }) => {
              const r = resolved.remediation;
              return (
                <li key={rec.id} className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2">
                  {r.risk === 'high'
                    ? <ShieldAlert className="h-4 w-4 text-red-300 shrink-0" />
                    : <CheckCircle2 className="h-4 w-4 text-violet-300 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {rec.title}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] uppercase shrink-0', RISK_CLS[r.risk])}>
                    {r.risk}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground shrink-0 w-10 text-right">
                    {r.estimatedSeconds >= 60 ? `~${Math.round(r.estimatedSeconds / 60)}m` : `~${r.estimatedSeconds}s`}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="text-[12px] text-muted-foreground">
              Estimated time: <span className="text-foreground">{mins}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild className="min-h-[36px]">
                <Link to="/app/ray/recommendations">Review</Link>
              </Button>
              <Button
                size="sm"
                className="min-h-[36px]"
                onClick={() => setReviewOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Fix everything
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <BatchFixDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        pairs={pairs}
        onDone={() => {
          setReviewOpen(false);
          void load();
        }}
      />
    </>
  );
}

export default PendingRemediationsCard;
