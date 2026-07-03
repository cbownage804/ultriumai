/**
 * PlaybookLibrary — Wave 4 + Wave 5: browseable playbooks with filters
 * and scheduling.
 *
 * Filter chips narrow the catalog by intent (Critical / Quick win /
 * Scheduled). The "Schedule" action opens a weekly/monthly cadence and
 * writes to ray_playbook_schedules so the ray-scheduler cron can run it
 * unattended.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  PLAYBOOK_TEMPLATES,
  startPlaybook,
  type PlaybookTemplate,
  type PlaybookCategory,
} from '@/lib/ray/playbooks';

const CATEGORY_LABEL: Record<PlaybookCategory, string> = {
  account: 'Accounts',
  credential: 'Passwords & breaches',
  identity: 'Identity',
  device: 'Devices',
  exposure: 'Identity Monitoring',
  mfa: 'MFA',
  passkey: 'Passkeys',
};

const ORDER: PlaybookCategory[] = ['credential', 'mfa', 'account', 'identity', 'exposure', 'device', 'passkey'];

type Filter = 'all' | 'critical' | 'quick' | 'scheduled';
const SCHEDULABLE = new Set(['freeze-credit', 'oauth-app-audit', 'mfa-enroll-everywhere', 'exposure-cleanup']);

export function PlaybookLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    return PLAYBOOK_TEMPLATES.filter((t) => {
      if (filter === 'critical') return t.reward_score >= 15;
      if (filter === 'quick') return t.estimated_minutes <= 5;
      if (filter === 'scheduled') return SCHEDULABLE.has(t.slug);
      return true;
    });
  }, [filter]);

  const grouped = useMemo(() => {
    const map = new Map<PlaybookCategory, PlaybookTemplate[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [filtered]);

  async function launch(slug: string) {
    if (!user || busy) return;
    setBusy(slug);
    try {
      const run = await startPlaybook(user.id, slug);
      if (run) navigate(`/app/ray/playbook/${run.id}`);
    } finally {
      setBusy(null);
    }
  }

  async function schedule(slug: string, cron: 'weekly' | 'monthly') {
    if (!user) return;
    const { error } = await supabase.from('ray_playbook_schedules').insert({
      user_id: user.id,
      playbook_slug: slug,
      cron,
      enabled: true,
      next_run_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("Ray couldn't save that schedule.");
      return;
    }
    toast.success(`Scheduled. I'll run this ${cron} and let you know.`);
  }

  const chips: Array<[Filter, string]> = [
    ['all', 'All'],
    ['critical', 'Critical'],
    ['quick', 'Quick win'],
    ['scheduled', 'Schedulable'],
  ];

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 inline-flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-violet-300" /> Playbook library
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Start any of these whenever you want. I'll walk you through it one step at a time.
      </p>

      <div className="flex flex-wrap gap-2 mb-5">
        {chips.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-colors',
              filter === id
                ? 'border-violet-400/60 text-violet-200 bg-violet-500/10'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {ORDER.filter((c) => grouped.has(c)).map((cat) => (
          <div key={cat}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
              {CATEGORY_LABEL[cat]}
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {grouped.get(cat)!.map((t) => (
                <li
                  key={t.slug}
                  className="group rounded-sm border border-border bg-card/40 p-4 flex flex-col gap-3 transition-colors hover:border-primary/40"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</div>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {t.estimated_minutes} min
                      <span className="mx-1">·</span>
                      <span className="text-violet-300">+{t.reward_score}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {SCHEDULABLE.has(t.slug) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => schedule(t.slug, 'monthly')}
                          className="h-7 px-2 text-xs text-foreground/70 hover:text-foreground"
                          title="Schedule monthly"
                        >
                          <Calendar className="h-3 w-3 mr-1" /> Monthly
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === t.slug}
                        onClick={() => launch(t.slug)}
                        className={cn(
                          'h-7 px-2 text-xs text-foreground/80 hover:text-foreground',
                          busy === t.slug && 'opacity-60',
                        )}
                      >
                        <Play className="h-3 w-3 mr-1" /> Start
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
