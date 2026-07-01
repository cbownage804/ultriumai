/**
 * MspDashboard — Ray's cross-client view for MSP owners.
 *
 * "Good morning, Brandon. I checked 27 client organizations overnight.
 *  Three need attention today."
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, Building2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrg } from '@/hooks/useActiveOrg';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchMspBriefing, fetchLatestHealth, triggerOrgSync, triggerMspBrief,
  type RayOrgBriefing, type RayOrgHealth,
} from '@/lib/ray/org';
import { PageMotion } from '@/components/ray/PageMotion';


interface ClientRow {
  id: string;
  name: string;
  health: RayOrgHealth | null;
}

function tone(s: number) {
  if (s >= 90) return 'text-green-400';
  if (s >= 75) return 'text-violet-300';
  if (s >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export default function MspDashboard() {
  const { user } = useAuth();
  const { switchOrg } = useActiveOrg();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [briefing, setBriefing] = useState<RayOrgBriefing | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [{ data: ownedOrgs }, b] = await Promise.all([
      supabase.from('org_teams').select('id, name').eq('owner_id', user.id),
      fetchMspBriefing(user.id),
    ]);
    setBriefing(b);
    const rows = await Promise.all(
      (ownedOrgs ?? []).map(async (o: any) => ({
        id: o.id as string,
        name: o.name as string,
        health: await fetchLatestHealth(o.id),
      })),
    );
    rows.sort((a, b) => (a.health?.overall_score ?? 0) - (b.health?.overall_score ?? 0));
    setClients(rows);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function refresh() {
    if (!user) return;
    setRefreshing(true);
    try {
      // Trigger sync for every client (best-effort, in parallel)
      await Promise.all(clients.map(c => triggerOrgSync(c.id).catch(() => null)));
      await triggerMspBrief(true);
      await load();
      toast({ title: 'Ray re-checked every client.' });
    } catch (e) {
      toast({ title: 'Ray could not refresh', description: String((e as Error).message), variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }

  const attention = clients.filter(c => (c.health?.overall_score ?? 100) < 80);

  return (
    <PageMotion className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

      <Card className="p-6 md:p-8 bg-card border-border">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-violet-300/80 mb-3">
          <Sparkles className="h-3 w-3" /> Ray's MSP brief
        </div>
        {briefing ? (
          <>
            {briefing.greeting && <p className="text-foreground/90 text-lg md:text-xl">{briefing.greeting}</p>}
            <p className="text-foreground/80 text-base md:text-lg mt-2">{briefing.summary}</p>
            {briefing.recommendation && (
              <p className="text-sm text-muted-foreground italic mt-4">{briefing.recommendation}</p>
            )}
          </>
        ) : loading ? <Skeleton className="h-20" /> : (
          <p className="text-foreground/80">
            I haven't published a cross-client briefing yet. Ask me to check your clients and I'll have one in a moment.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={refresh} disabled={refreshing} variant="outline" className="gap-2 rounded-sm">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            Ask Ray to check every client
          </Button>
        </div>
      </Card>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Client organizations</h2>
          <span className="text-xs text-muted-foreground">
            {clients.length} clients · {attention.length} need attention
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.length === 0 && !loading && (
            <Card className="p-6 text-sm text-muted-foreground bg-card border-border md:col-span-2 lg:col-span-3 text-center">
              No client organizations yet. Create one to give Ray something to watch.
            </Card>
          )}
          {clients.map((c) => {
            const score = c.health?.overall_score ?? 0;
            const delta = c.health?.score_delta ?? 0;
            const stats = (c.health?.stats ?? {}) as Record<string, number>;
            return (
              <Card key={c.id} className="p-4 bg-card border-border hover:border-violet-500/30 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm text-foreground truncate flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {c.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {stats.employees ?? 0} employees
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-2xl font-light tabular-nums', tone(score))}>{score}</div>
                    <div className="text-[10px]">
                      {delta === 0 ? <span className="text-muted-foreground inline-flex items-center gap-0.5"><Minus className="h-2.5 w-2.5" />0</span>
                       : delta > 0 ? <span className="text-green-400 inline-flex items-center gap-0.5"><ArrowUp className="h-2.5 w-2.5" />+{delta}</span>
                       : <span className="text-red-400 inline-flex items-center gap-0.5"><ArrowDown className="h-2.5 w-2.5" />{delta}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(stats.mfa_missing ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400">{stats.mfa_missing} no MFA</Badge>
                  )}
                  {(stats.breached_employees ?? 0) > 0 && (
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">{stats.breached_employees} breached</Badge>
                  )}
                  {(stats.mfa_missing ?? 0) === 0 && (stats.breached_employees ?? 0) === 0 && (
                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">Healthy</Badge>
                  )}
                </div>
                <Link to="/app/org" onClick={() => switchOrg(c.id)}>
                  <Button variant="ghost" size="sm" className="w-full justify-between rounded-sm">
                    Open client brief
                    <span aria-hidden>→</span>
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      </section>
    </PageMotion>

  );
}
