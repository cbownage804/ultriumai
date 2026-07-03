import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Send,
  Sparkles,
  Mail,
  Link2,
  HardDrive,
  Building2,
  ListChecks,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { getRayContext, type RayContext } from '@/lib/ray';
import { formatDistanceToNow } from 'date-fns';

type RayCard = {
  title?: string;
  body?: string;
  fields?: { label: string; value: string }[];
  severity?: 'info' | 'success' | 'warn' | 'danger';
};
type RayAction = {
  id: string;
  label: string;
  intent: 'navigate' | 'run_action' | 'open_playbook' | 'external';
  target: string;
  risk?: 'low' | 'medium' | 'high';
};
type RaySource = { kind: string; id?: string; label: string; url?: string };
export type RayResponse = {
  skill: string;
  message: string;
  cards?: RayCard[];
  actions?: RayAction[];
  sources?: RaySource[];
  follow_ups?: string[];
  classifier?: { slug: string; confidence: number; reasoning: string };
};

type Turn =
  | { role: 'user'; text: string }
  | { role: 'ray'; response: RayResponse };

const SEVERITY_CLASS: Record<string, string> = {
  info: 'border-border',
  success: 'border-emerald-500/40 bg-emerald-500/5',
  warn: 'border-amber-500/40 bg-amber-500/5',
  danger: 'border-red-500/40 bg-red-500/5',
};

const QUICK_ACTIONS: { label: string; prompt: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Analyze a suspicious email', prompt: 'I want to analyze a suspicious email. What do you need from me?', Icon: Mail },
  { label: 'Scan a URL', prompt: 'Can you scan a URL for me?', Icon: Link2 },
  { label: 'Find vulnerable devices', prompt: 'Which of my devices are most vulnerable right now?', Icon: HardDrive },
  { label: 'Ask about Microsoft 365', prompt: 'What should I know about my Microsoft 365 security today?', Icon: Building2 },
  { label: "Today's recommendations", prompt: "Show me today's recommendations.", Icon: ListChecks },
  { label: 'Explain my security score', prompt: 'Explain my security score and how to improve it.', Icon: Gauge },
  { label: 'Review latest breaches', prompt: 'Any recent breaches that affect me?', Icon: ShieldAlert },
  { label: 'Run a security check', prompt: 'Run a full security check on my environment.', Icon: ShieldCheck },
];

type PanelContext = {
  kind: string;
  id?: string;
  title?: string;
  body?: string;
  evidence?: Record<string, unknown>;
};

function greet(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

type NoticeTone = 'warn' | 'danger' | 'success';
type Notice = { tone: NoticeTone; text: string; prompt: string; actionLabel: string };

function severityToTone(sev: string): NoticeTone {
  const s = (sev || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 'danger';
  if (s === 'medium' || s === 'warn' || s === 'warning') return 'warn';
  return 'warn';
}

function buildNotices(ctx: RayContext | null): Notice[] {
  if (!ctx) return [];
  const out: Notice[] = [];
  for (const r of ctx.recommendations.slice(0, 3)) {
    out.push({
      tone: severityToTone(r.severity),
      text: r.title,
      prompt: `Tell me more about "${r.title}" and how to fix it.`,
      actionLabel: 'Review',
    });
  }
  if (out.length === 0 && ctx.hasOnboarded) {
    out.push({
      tone: 'success',
      text: 'Nothing urgent right now — Ray is watching quietly.',
      prompt: 'Give me a proactive briefing of my environment.',
      actionLabel: 'Briefing',
    });
  }
  return out;
}

export default function RaySkillsPanel() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<PanelContext | null>(null);
  const [ctx, setCtx] = useState<RayContext | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  useEffect(() => {
    let active = true;
    if (!user) return;
    void getRayContext(user.id).then((c) => {
      if (active) setCtx(c);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const send = async (message: string, ctxOverride?: PanelContext | null) => {
    const text = message.trim();
    if (!text || loading) return;
    setInput('');
    setTurns((t) => [...t, { role: 'user', text }]);
    setLoading(true);
    const currentCtx = ctxOverride !== undefined ? ctxOverride : context;
    try {
      const { data, error } = await supabase.functions.invoke('ray-router', {
        body: { message: text, source: 'in_app', context: currentCtx ?? undefined },
      });
      if (error) throw error;
      const resp = data as RayResponse;
      setTurns((t) => [...t, { role: 'ray', response: resp }]);
    } catch (e: any) {
      toast.error(e?.message ?? 'Ray could not answer');
      setTurns((t) => [
        ...t,
        { role: 'ray', response: { skill: 'error', message: 'Something went wrong reaching Ray.' } },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    function onSend(e: Event) {
      const detail = (e as CustomEvent).detail ?? {};
      if (detail.context) setContext(detail.context as PanelContext);
      if (typeof detail.message === 'string' && detail.message.trim()) {
        void send(detail.message, detail.context as PanelContext | undefined);
      }
    }
    window.addEventListener('ray:panel-send', onSend);
    return () => window.removeEventListener('ray:panel-send', onSend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAction = async (action: RayAction) => {
    if (action.intent === 'navigate') return navigate(action.target);
    if (action.intent === 'external') return void window.open(action.target, '_blank', 'noreferrer');
    toast.info(`${action.label} — coming from ${action.intent}.`);
  };

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
    if (full) return full.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const score = ctx?.latestScore?.score ?? null;
  const delta = ctx?.scoreDelta ?? null;
  const notices = useMemo(() => buildNotices(ctx), [ctx]);
  const openCount = ctx?.recommendations.length ?? 0;

  const activity = useMemo(() => {
    const items: { text: string; when: Date; tone: NoticeTone }[] = [];
    for (const f of (ctx?.findings ?? []).slice(0, 4)) {
      items.push({
        text: `${f.kind.replace(/_/g, ' ')} detected`,
        when: new Date(f.created_at),
        tone: severityToTone(f.severity),
      });
    }
    for (const r of (ctx?.recommendations ?? []).slice(0, 2)) {
      items.push({
        text: r.title,
        when: new Date(r.last_seen_at ?? r.created_at),
        tone: severityToTone(r.severity),
      });
    }
    return items
      .sort((a, b) => b.when.getTime() - a.when.getTime())
      .slice(0, 4);
  }, [ctx]);

  const empty = turns.length === 0;
  const scoreTone =
    score == null ? 'text-foreground' : score >= 80 ? 'text-emerald-300' : score >= 60 ? 'text-amber-300' : 'text-red-300';

  return (
    <Card className="flex h-[720px] flex-col overflow-hidden border-border/60 bg-gradient-to-b from-background to-background/60">
      <CardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="space-y-6 p-6">
              {/* Header greeting + score */}
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Ray
                    <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[9px]">
                      v0.3 beta
                    </Badge>
                  </div>
                  <h2 className="text-xl font-light text-foreground">
                    <span className="text-2xl">👋</span> {greet()}, {firstName}.
                  </h2>
                  <p className="text-sm text-muted-foreground leading-snug max-w-md">
                    I've been watching your environment.
                    {openCount > 0
                      ? ` Today I found ${openCount} thing${openCount === 1 ? '' : 's'} worth your attention.`
                      : ' Everything looks healthy today.'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Security score</div>
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-4xl font-extralight tabular-nums leading-none mt-1 ${scoreTone}`}
                  >
                    {score ?? '—'}
                  </motion.div>
                  {delta != null && delta !== 0 && (
                    <div
                      className={`mt-1 inline-flex items-center gap-0.5 text-[11px] ${
                        delta > 0 ? 'text-emerald-300' : 'text-red-300'
                      }`}
                    >
                      {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {delta > 0 ? '+' : ''}
                      {delta} this week
                    </div>
                  )}
                </div>
              </div>

              {/* Ray noticed */}
              <section className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Ray noticed</div>
                <div className="space-y-2">
                  {notices.length > 0 ? (
                    notices.map((n, i) => <NoticeRow key={i} notice={n} onAsk={send} />)
                  ) : (
                    <div className="rounded-md border border-border/60 bg-card/40 px-3 py-3 text-sm text-muted-foreground">
                      Ray is still building your first briefing. Ask anything below in the meantime.
                    </div>
                  )}
                </div>
              </section>

              {/* Quick actions */}
              <section className="space-y-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">How can I help?</div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map(({ label, prompt, Icon }) => (
                    <button
                      key={label}
                      onClick={() => send(prompt)}
                      className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-left text-sm text-foreground/90 transition hover:border-primary/50 hover:bg-primary/5"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Recent activity */}
              {activity.length > 0 && (
                <section className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Recent activity</div>
                  <ul className="space-y-1.5">
                    {activity.map((a, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ActivityIcon tone={a.tone} />
                        <span className="flex-1 truncate text-foreground/80 capitalize">{a.text}</span>
                        <span className="tabular-nums text-[10px]">
                          {formatDistanceToNow(a.when, { addSuffix: true })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {turns.map((turn, i) =>
                turn.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                      {turn.text}
                    </div>
                  </div>
                ) : (
                  <RayTurn key={i} response={turn.response} onAction={runAction} onFollowUp={send} />
                ),
              )}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Ray is thinking…
                </div>
              )}
            </div>
          )}
        </div>

        {context && (
          <div className="mx-4 mb-2 flex items-center gap-2 rounded-md border border-violet-400/30 bg-violet-500/[0.05] px-2 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-violet-300 shrink-0" />
            <span className="flex-1 truncate text-foreground/80">
              About: {context.title ?? context.kind}
            </span>
            <button
              type="button"
              onClick={() => setContext(null)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Clear context"
            >
              ×
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t border-border/60 bg-background/60 p-3"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              context
                ? `Ask Ray about "${context.title ?? context.kind}"…`
                : 'What can I help you with today?'
            }
            disabled={loading}
            className="h-10 rounded-full bg-card/60"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-10 w-10 rounded-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NoticeRow({ notice, onAsk }: { notice: Notice; onAsk: (q: string) => void }) {
  const toneStyle =
    notice.tone === 'danger'
      ? 'border-red-500/40 bg-red-500/5'
      : notice.tone === 'warn'
      ? 'border-amber-500/40 bg-amber-500/5'
      : 'border-emerald-500/40 bg-emerald-500/5';
  const Icon =
    notice.tone === 'danger' ? ShieldAlert : notice.tone === 'warn' ? AlertTriangle : CheckCircle2;
  const iconTone =
    notice.tone === 'danger' ? 'text-red-300' : notice.tone === 'warn' ? 'text-amber-300' : 'text-emerald-300';
  return (
    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${toneStyle}`}>
      <Icon className={`h-4 w-4 shrink-0 ${iconTone}`} />
      <span className="flex-1 text-sm text-foreground/90">{notice.text}</span>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 rounded-full px-3 text-xs"
        onClick={() => onAsk(notice.prompt)}
      >
        {notice.actionLabel}
      </Button>
    </div>
  );
}

function ActivityIcon({ tone }: { tone: NoticeTone }) {
  if (tone === 'success') return <CheckCircle2 className="h-3 w-3 text-emerald-300" />;
  if (tone === 'danger') return <ShieldAlert className="h-3 w-3 text-red-300" />;
  return <Activity className="h-3 w-3 text-amber-300" />;
}

function RayTurn({
  response,
  onAction,
  onFollowUp,
}: {
  response: RayResponse;
  onAction: (a: RayAction) => void;
  onFollowUp: (q: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-xs text-muted-foreground">Ray</span>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card/60 p-3 text-sm">
        <div className="whitespace-pre-wrap">{response.message}</div>
        {response.cards?.map((c, i) => (
          <div key={i} className={`mt-3 rounded-md border p-3 ${SEVERITY_CLASS[c.severity ?? 'info']}`}>
            {c.title && (
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.title}</div>
            )}
            {c.body && <div className="mt-1 text-sm">{c.body}</div>}
            {c.fields && (
              <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                {c.fields.map((f, j) => (
                  <li key={j} className="flex justify-between gap-2 border-b border-dashed border-border/50 py-1">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="font-medium">{f.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        {response.actions && response.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {response.actions.map((a) => (
              <Button
                key={a.id}
                size="sm"
                variant={a.risk === 'high' ? 'destructive' : 'secondary'}
                onClick={() => onAction(a)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {response.follow_ups && response.follow_ups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {response.follow_ups.map((f) => (
            <Button
              key={f}
              size="sm"
              variant="ghost"
              className="h-7 rounded-full text-xs"
              onClick={() => onFollowUp(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
