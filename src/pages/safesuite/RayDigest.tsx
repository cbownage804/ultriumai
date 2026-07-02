import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

type Digest = {
  id: string;
  week_start: string;
  week_end: string;
  score_before: number | null;
  score_after: number | null;
  counts: any;
  highlights: any[];
  recommendations_open: number;
  recommendations_resolved: number;
  sent_at: string | null;
  delivery_status: any;
};

const SEV_DOT: Record<string, string> = {
  danger: '🔴',
  warn: '🟡',
  info: '🟢',
  success: '🟢',
};

export default function RayDigest() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ray_digests')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle();
    setDigest(data as Digest | null);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const buildNow = async () => {
    setBuilding(true);
    try {
      const { error } = await supabase.functions.invoke('ray-digest-build');
      if (error) throw error;
      toast.success('Digest built');
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not build digest');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Digest</h1>
          <p className="text-sm text-muted-foreground">
            Ray's Monday morning summary: what changed, what improved, what still needs attention.
          </p>
        </div>
        <Button onClick={buildNow} disabled={building} variant="outline" size="sm">
          {building ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Build latest
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading digest…
        </div>
      ) : !digest ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No digest yet. Ray builds one every Monday, or click <strong>Build latest</strong> above.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Week of {digest.week_start} → {digest.week_end}</span>
              {digest.sent_at ? (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Mail className="h-3 w-3" /> sent
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px]">draft</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {digest.score_after != null && (
              <div className="flex items-center gap-2 text-sm">
                {digest.score_before != null && digest.score_after >= digest.score_before ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                )}
                <span>
                  Security score: <strong>{digest.score_after}</strong>
                  {digest.score_before != null && (
                    <span className="text-muted-foreground"> (was {digest.score_before})</span>
                  )}
                </span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="New findings" value={digest.counts?.new_findings ?? 0} />
              <Stat label="Resolved" value={digest.counts?.resolved ?? 0} />
              <Stat label="Critical open" value={digest.counts?.danger ?? 0} />
              <Stat label="Open total" value={digest.recommendations_open} />
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Highlights
              </div>
              {digest.highlights?.length ? (
                <ul className="space-y-2 text-sm">
                  {digest.highlights.map((h: any) => (
                    <li key={h.id} className="flex items-center gap-2 rounded-md border p-2">
                      <span>{SEV_DOT[h.severity] ?? '⚪'}</span>
                      <span className="flex-1">{h.title}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{h.category}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No new findings this week. Nice.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
