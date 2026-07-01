import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { PageMotion } from '@/components/ray/PageMotion';
import { formatDistanceToNow } from 'date-fns';

type Credits = {
  monthly_credits_used: number | null;
  monthly_credits_limit: number | null;
  daily_credits_used: number | null;
  daily_credits_limit: number | null;
  bonus_credits: number | null;
  monthly_reset_at: string | null;
  daily_reset_at: string | null;
};

type LedgerRow = {
  id: string;
  credits_used: number;
  tokens_used: number | null;
  usage_type: string | null;
  description: string | null;
  created_at: string;
};

export default function AiCredits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: c }, { data: l }] = await Promise.all([
          supabase
            .from('user_credits')
            .select('monthly_credits_used, monthly_credits_limit, daily_credits_used, daily_credits_limit, bonus_credits, monthly_reset_at, daily_reset_at')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('ai_credit_ledger')
            .select('id, credits_used, tokens_used, usage_type, description, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(25),
        ]);
        if (cancelled) return;
        setCredits((c as Credits) ?? {
          monthly_credits_used: 0,
          monthly_credits_limit: 0,
          daily_credits_used: 0,
          daily_credits_limit: 0,
          bonus_credits: 0,
          monthly_reset_at: null,
          daily_reset_at: null,
        });
        setLedger((l as LedgerRow[]) ?? []);
      } catch (e) {
        if (!cancelled) setError('Ray couldn\'t load your credit ledger right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const monthlyUsed = credits?.monthly_credits_used ?? 0;
  const monthlyLimit = credits?.monthly_credits_limit ?? 0;
  const dailyUsed = credits?.daily_credits_used ?? 0;
  const dailyLimit = credits?.daily_credits_limit ?? 0;
  const bonus = credits?.bonus_credits ?? 0;

  const monthlyPct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0;
  const dailyPct = dailyLimit > 0 ? Math.min(100, Math.round((dailyUsed / dailyLimit) * 100)) : 0;

  return (
    <PageMotion>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <RayPageHeader
          icon={Coins}
          title="AI Credits"
          question="How much of Ray's brain have you used this cycle?"
          explain={{ title: 'How Ray tracks credits', body: "Credits power Ray's AI actions — briefings, analyses, conversations. Ray tracks daily and monthly usage separately so a busy Tuesday doesn't burn your month." }}
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Monthly
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold">{monthlyUsed.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/ {monthlyLimit.toLocaleString()}</span>
                  </div>
                  <Progress value={monthlyPct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {credits?.monthly_reset_at
                      ? `Resets ${formatDistanceToNow(new Date(credits.monthly_reset_at), { addSuffix: true })}`
                      : 'No reset scheduled'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Today
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold">{dailyUsed.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/ {dailyLimit.toLocaleString()}</span>
                  </div>
                  <Progress value={dailyPct} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {credits?.daily_reset_at
                      ? `Resets ${formatDistanceToNow(new Date(credits.daily_reset_at), { addSuffix: true })}`
                      : 'Resets at midnight'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Bonus credits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-semibold">{bonus.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Bonus credits carry over — Ray uses them last so nothing goes to waste.
                  </p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link to="/app/billing">Add credits</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                {ledger.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ray hasn't spent any credits yet. Ask him something and it'll show up here.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {ledger.map((row) => (
                      <div key={row.id} className="flex items-center justify-between py-3 gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {row.description || row.usage_type || 'AI usage'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                            {row.tokens_used ? ` · ${row.tokens_used.toLocaleString()} tokens` : ''}
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary shrink-0">
                          −{Number(row.credits_used).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageMotion>
  );
}
