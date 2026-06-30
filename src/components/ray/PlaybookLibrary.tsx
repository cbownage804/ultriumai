/**
 * PlaybookLibrary — browse all available Ray playbooks and start one on demand.
 *
 * Templates are pure data from `PLAYBOOK_TEMPLATES`; clicking "Start" creates
 * a run via the same engine the Fix-with-Ray launcher uses.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, Play, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  exposure: 'Exposure',
  mfa: 'MFA',
  passkey: 'Passkeys',
};

const ORDER: PlaybookCategory[] = ['credential', 'mfa', 'account', 'identity', 'exposure', 'device', 'passkey'];

export function PlaybookLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<PlaybookCategory, PlaybookTemplate[]>();
    for (const t of PLAYBOOK_TEMPLATES) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, []);

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

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2 inline-flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-violet-300" /> Playbook library
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Start any of these whenever you want. I'll walk you through it one step at a time.
      </p>
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
                  <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {t.estimated_minutes} min
                      <span className="mx-1">·</span>
                      <span className="text-violet-300">+{t.reward_score}</span>
                    </span>
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
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
