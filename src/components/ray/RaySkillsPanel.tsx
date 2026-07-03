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
import { motion, AnimatePresence } from 'framer-motion';
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

const QUICK_ACTIONS: {
  label: string;
  subtitle: string;
  prompt: string;
  emoji: string;
  group: 'Investigate' | 'Understand' | 'Learn';
}[] = [
  { label: 'Analyze Threat', subtitle: 'Paste anything suspicious', prompt: 'I want to analyze a suspicious email. What do you need from me?', emoji: '🛡', group: 'Investigate' },
  { label: 'Scan URL', subtitle: 'Check a link before you click', prompt: 'Can you scan a URL for me?', emoji: '🌐', group: 'Investigate' },
  { label: 'Devices', subtitle: 'Find what is vulnerable', prompt: 'Which of my devices are most vulnerable right now?', emoji: '💻', group: 'Investigate' },
  { label: 'Microsoft 365', subtitle: 'Review tenant security', prompt: 'What should I know about my Microsoft 365 security today?', emoji: '☁️', group: 'Investigate' },
  { label: 'Passwords', subtitle: 'Health and exposed accounts', prompt: 'Review my password health and any exposed accounts.', emoji: '🔑', group: 'Understand' },
  { label: 'Explain Score', subtitle: 'What moves the number', prompt: 'Explain my security score and how to improve it.', emoji: '📊', group: 'Understand' },
  { label: 'Recommendations', subtitle: "Today's priority list", prompt: "Walk me through today's recommendations in priority order.", emoji: '📈', group: 'Understand' },
  { label: 'Company Knowledge', subtitle: 'What Ray knows about you', prompt: 'What do you know about my company and environment?', emoji: '📚', group: 'Learn' },
];


const ROTATING_PLACEHOLDERS = [
  'Ask me why your score changed…',
  'Paste a phishing email…',
  'Why is BitLocker disabled?',
  'Ask me about Microsoft 365…',
  'What should I fix first?',
  'Any new breaches affecting me?',
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

function severityToTone(sev: string): NoticeTone {
  const s = (sev || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 'danger';
  if (s === 'medium' || s === 'warn' || s === 'warning') return 'warn';
  return 'warn';
}

type PriorityRec = {
  id: string;
  title: string;
  why: string;
  severity: string;
  tone: NoticeTone;
  priority: number;
  impactPoints: number;
  durationLabel: string;
  needsReboot: boolean;
  askPrompt: string;
  impactPrompt: string;
  fixPrompt: string;
};


const STOPWORDS = new Set([
  'the','a','an','your','my','with','for','and','to','of','in','on','is','be','are',
  'about','from','this','that','it','into','via','using','use','how','why','what',
  'wrayth','ray','please','can','you','me','i',
]);

function topicKey(text: string): string {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  // signature = first two meaningful words, sorted for stability
  return words.slice(0, 2).sort().join('|');
}

function buildPriorityRecs(ctx: RayContext | null): PriorityRec[] {
  if (!ctx) return [];
  // Dedupe near-duplicates: same rule_slug, same category, or same topic signature.
  const seen = new Set<string>();
  const unique: typeof ctx.recommendations = [];
  for (const r of ctx.recommendations) {
    const keys = [
      r.rule_slug ? `slug:${r.rule_slug}` : null,
      r.category ? `cat:${r.category}` : null,
      `topic:${topicKey(r.title)}`,
    ].filter(Boolean) as string[];
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    unique.push(r);
    if (unique.length >= 3) break;
  }
  return unique.map((r, i) => {
    const tone = severityToTone(r.severity);
    const impactPoints = tone === 'danger' ? 12 : tone === 'warn' ? 8 : 4;
    const secs = r.estimated_fix_seconds ?? (tone === 'danger' ? 300 : 120);
    const durationLabel = secs >= 3600
      ? `${Math.round(secs / 3600)} hr`
      : secs >= 60 ? `${Math.round(secs / 60)} min` : `${secs} sec`;
    const slug = (r.rule_slug || '').toLowerCase();
    const needsReboot = /bitlocker|update|patch|reboot|kernel/.test(slug + ' ' + r.title.toLowerCase());
    return {
      id: r.id,
      title: r.title,
      why:
        (r.body && r.body.trim()) ||
        (r.objective && r.objective.trim()) ||
        "I flagged this because it materially affects your security posture.",
      severity: r.severity,
      tone,
      priority: i + 1,
      impactPoints,
      durationLabel,
      needsReboot,
      askPrompt: `Explain in detail why "${r.title}" matters and what the risk is if I ignore it.`,
      impactPrompt: `Show me the exact impact "${r.title}" will have on my security score and posture.`,
      fixPrompt: `Walk me through fixing "${r.title}" now, step by step.`,
    };
  });
}


// ---- memory (localStorage) ---------------------------------------------------

type RayMemory = {
  lastVisitAt: string;
  lastScore: number | null;
  lastRecCount: number;
};
const MEMORY_KEY = 'ray:memory:v1';

function readMemory(): RayMemory | null {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? (JSON.parse(raw) as RayMemory) : null;
  } catch {
    return null;
  }
}
function writeMemory(m: RayMemory) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(m)); } catch { /* noop */ }
}

// ---- component ---------------------------------------------------------------

export default function RaySkillsPanel() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<PanelContext | null>(null);
  const [ctx, setCtx] = useState<RayContext | null>(null);
  const [booting, setBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [memory, setMemory] = useState<RayMemory | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  // Load context + snapshot previous memory
  useEffect(() => {
    let active = true;
    if (!user) return;
    setMemory(readMemory());
    void getRayContext(user.id).then((c) => {
      if (!active) return;
      setCtx(c);
      writeMemory({
        lastVisitAt: new Date().toISOString(),
        lastScore: c.latestScore?.score ?? null,
        lastRecCount: c.recommendations.length,
      });
    });
    return () => { active = false; };
  }, [user]);

  // Boot sequence — "Ray is thinking…"
  useEffect(() => {
    const steps = ['Checking breaches', 'Reviewing devices', 'Comparing Microsoft posture', 'Done'];
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        clearInterval(iv);
        setBooting(false);
        return;
      }
      setBootStep(i);
    }, 380);
    return () => clearInterval(iv);
  }, []);

  // Rotating placeholder
  useEffect(() => {
    const iv = setInterval(() => setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length), 3200);
    return () => clearInterval(iv);
  }, []);

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
  const recs = useMemo(() => buildPriorityRecs(ctx), [ctx]);
  const openCount = ctx?.recommendations.length ?? 0;
  const findingsCount = ctx?.findings.length ?? 0;

  // "Since we last talked" — memory diff
  const memoryLine = useMemo(() => {
    if (!memory || !ctx) return null;
    const nowScore = ctx.latestScore?.score ?? null;
    const scoreDiff = nowScore != null && memory.lastScore != null ? nowScore - memory.lastScore : null;
    const recDiff = openCount - memory.lastRecCount;
    const when = formatDistanceToNow(new Date(memory.lastVisitAt), { addSuffix: true });
    if (scoreDiff === 0 && recDiff === 0) {
      return `We last talked ${when}. Nothing changed since — looking steady.`;
    }
    const bits: string[] = [];
    if (scoreDiff != null && scoreDiff !== 0) {
      bits.push(`your score ${scoreDiff > 0 ? 'rose' : 'dropped'} ${Math.abs(scoreDiff)} points`);
    }
    if (recDiff > 0) bits.push(`${recDiff} new recommendation${recDiff === 1 ? '' : 's'} appeared`);
    if (recDiff < 0) bits.push(`${Math.abs(recDiff)} recommendation${Math.abs(recDiff) === 1 ? '' : 's'} cleared`);
    return `Since we talked ${when}: ${bits.join(', ')}.`;
  }, [memory, ctx, openCount]);

  // Last activity — most recent finding or recommendation timestamp
  const lastActivityAt = useMemo(() => {
    const times: number[] = [];
    for (const f of ctx?.findings ?? []) times.push(new Date(f.created_at).getTime());
    for (const r of ctx?.recommendations ?? []) times.push(new Date(r.last_seen_at ?? r.created_at).getTime());
    if (times.length === 0) return null;
    return new Date(Math.max(...times));
  }, [ctx]);

  const target = score != null ? Math.min(100, score + Math.max(6, openCount * 4)) : null;

  const empty = turns.length === 0;
  const scoreTone =
    score == null ? 'text-foreground' : score >= 80 ? 'text-emerald-300' : score >= 60 ? 'text-amber-300' : 'text-red-300';

  // Boot screen
  if (booting && empty) {
    const steps = [
      { label: 'Checking breaches', icon: ShieldAlert },
      { label: 'Reviewing devices', icon: Activity },
      { label: 'Comparing Microsoft posture', icon: ShieldCheck },
      { label: 'Ready', icon: CheckCircle2 },
    ];
    return (
      <Card className="flex h-[720px] flex-col overflow-hidden border-border/60 bg-gradient-to-b from-background to-background/60">
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <motion.div
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/40 to-primary/10"
            animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
          </motion.div>
          <div className="w-full max-w-xs space-y-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < bootStep;
              const active = i === bootStep;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: i <= bootStep ? 1 : 0.3, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-2 text-sm"
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground/60" />
                  )}
                  <span className={done ? 'text-muted-foreground line-through' : active ? 'text-foreground' : 'text-muted-foreground/70'}>
                    {s.label}…
                  </span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-[720px] flex-col overflow-hidden border-border/60 bg-gradient-to-b from-background to-background/60">
      <CardContent className="flex flex-1 flex-col gap-0 overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="space-y-6 p-6">
              {/* Header: Ray identity + status pill */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-[11px] uppercase tracking-[0.22em] text-primary">Ray</span>
                    </div>
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">v0.3 beta</Badge>
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-2 py-0.5">
                      <motion.span
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <span className="text-[10px] uppercase tracking-wider text-emerald-300">Watching</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-light text-foreground leading-snug">
                    <span className="text-2xl">👋</span> {greet()}, {firstName}.
                  </h2>
                  <p className="text-sm text-muted-foreground leading-snug max-w-md">
                    {openCount > 0
                      ? `I reviewed your environment while you were away. ${openCount} thing${openCount === 1 ? '' : 's'} I'd fix next.`
                      : "Everything has been quiet. I'll keep watching."}
                  </p>

                  {memoryLine && (
                    <p className="text-xs text-foreground/70 italic border-l-2 border-primary/40 pl-2">
                      {memoryLine}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    <span>Last activity {lastActivityAt ? formatDistanceToNow(lastActivityAt, { addSuffix: true }) : 'just now'}</span>
                    <span>·</span>
                    <span>{findingsCount} finding{findingsCount === 1 ? '' : 's'}</span>
                    <span>·</span>
                    <span>{openCount} open</span>
                  </div>
                </div>
              </div>

              {/* Security score — hero */}
              <section className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Security Score</div>
                  {delta != null && delta !== 0 && (
                    <div className={`inline-flex items-center gap-0.5 text-xs ${delta > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {delta > 0 ? '+' : ''}{delta} this week
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-6xl font-extralight tabular-nums leading-none ${scoreTone}`}
                  >
                    {score ?? '—'}
                  </motion.div>
                  {target != null && target > (score ?? 0) && (
                    <div className="pb-1 text-xs text-muted-foreground">
                      Ray thinks <span className="text-foreground font-medium">{target}</span> is achievable today.
                    </div>
                  )}
                </div>
                {score != null && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                    />
                  </div>
                )}
                <button
                  onClick={() => send('Coach me — what should I do next to raise my score?')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Coach me →
                </button>
              </section>

              {/* Priority recommendations */}
              {recs.length > 0 && (
                <section className="space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Ray noticed</div>
                  <AnimatePresence>
                    <div className="space-y-2">
                      {recs.map((r, i) => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.15, duration: 0.35 }}
                        >
                          <PriorityRecRow rec={r} onAsk={send} />
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                </section>
              )}

              {/* While you were away */}
              <section className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-primary">
                  <Activity className="h-3 w-3" />
                  While you were away
                </div>
                <ul className="space-y-1 text-xs text-foreground/85">
                  <li>• Checked your devices for posture drift</li>
                  <li>• Scanned {findingsCount} recent finding{findingsCount === 1 ? '' : 's'}</li>
                  <li>• Regenerated today's recommendations</li>
                  <li>• Detected no active threats</li>
                </ul>
              </section>

              {/* Quick actions — grouped with emoji */}
              <section className="space-y-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">How can I help?</div>
                {(['Investigate', 'Understand', 'Learn'] as const).map((group) => {
                  const items = QUICK_ACTIONS.filter((a) => a.group === group);
                  if (items.length === 0) return null;
                  return (
                    <div key={group} className="space-y-1.5">
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">{group}</div>
                      <div className="grid grid-cols-2 gap-2">
                        {items.map(({ label, prompt, emoji }) => (
                          <button
                            key={label}
                            onClick={() => send(prompt)}
                            className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2.5 text-left text-sm text-foreground/90 transition hover:border-primary/50 hover:bg-primary/5"
                          >
                            <span className="text-base leading-none">{emoji}</span>
                            <span className="truncate">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
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
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 border-t border-border/60 bg-background/60 p-3"
        >
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={context ? `Ask Ray about "${context.title ?? context.kind}"…` : ''}
              disabled={loading}
              className="h-10 rounded-full bg-card/60"
            />
            {!input && !context && (
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={placeholderIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="text-sm text-muted-foreground"
                  >
                    {ROTATING_PLACEHOLDERS[placeholderIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
          </div>
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="h-10 w-10 rounded-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PriorityRecRow({ rec, onAsk }: { rec: PriorityRec; onAsk: (q: string) => void }) {
  const toneStyle =
    rec.tone === 'danger'
      ? 'border-red-500/40 bg-red-500/[0.04]'
      : rec.tone === 'warn'
      ? 'border-amber-500/40 bg-amber-500/[0.04]'
      : 'border-emerald-500/40 bg-emerald-500/[0.04]';
  const badgeTone =
    rec.tone === 'danger' ? 'bg-red-500/15 text-red-300 border-red-500/30'
    : rec.tone === 'warn' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  const severityLabel =
    rec.tone === 'danger' ? 'Critical' : rec.tone === 'warn' ? 'Important' : 'Healthy';

  return (
    <div className={`rounded-lg border p-3 ${toneStyle}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Priority {rec.priority}</span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${badgeTone}`}>
            {severityLabel}
          </span>
        </div>
        <Button size="sm" variant="secondary" className="h-7 rounded-full px-3 text-xs"
          onClick={() => onAsk(rec.prompt)}>
          Review
        </Button>
      </div>
      <div className="mt-1.5 text-sm font-medium text-foreground">{rec.title}</div>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">{rec.why}</p>
    </div>
  );
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
