import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, ShieldCheck, HardDrive, KeyRound, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

const SKILL_ICON: Record<string, JSX.Element> = {
  threat: <ShieldCheck className="h-3.5 w-3.5" />,
  device: <HardDrive className="h-3.5 w-3.5" />,
  identity: <KeyRound className="h-3.5 w-3.5" />,
  knowledge: <BookOpen className="h-3.5 w-3.5" />,
};

const SEVERITY_CLASS: Record<string, string> = {
  info: 'border-border',
  success: 'border-emerald-500/40 bg-emerald-500/5',
  warn: 'border-amber-500/40 bg-amber-500/5',
  danger: 'border-red-500/40 bg-red-500/5',
};

const STARTERS = [
  'Which devices are missing BitLocker?',
  'Why did my security score drop?',
  'Is this email safe? sender@newdomain.zip',
  'How do I connect the VPN?',
];

type PanelContext = {
  kind: string;
  id?: string;
  title?: string;
  body?: string;
  evidence?: Record<string, unknown>;
};

export default function RaySkillsPanel() {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<PanelContext | null>(null);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, loading]);

  const send = async (message: string, ctxOverride?: PanelContext | null) => {
    const text = message.trim();
    if (!text || loading) return;
    setInput('');
    setTurns((t) => [...t, { role: 'user', text }]);
    setLoading(true);
    const ctx = ctxOverride !== undefined ? ctxOverride : context;
    try {
      const { data, error } = await supabase.functions.invoke('ray-router', {
        body: { message: text, source: 'in_app', context: ctx ?? undefined },
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

  // Allow other surfaces to seed a question + recommendation context.
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
    if (action.intent === 'navigate') {
      navigate(action.target);
      return;
    }
    if (action.intent === 'external') {
      window.open(action.target, '_blank', 'noreferrer');
      return;
    }
    toast.info(`${action.label} — coming from ${action.intent}. Wire this into the existing action pipeline.`);
  };

  const empty = turns.length === 0;

  return (
    <Card className="flex h-[640px] flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" /> Ray Skills
          <Badge variant="secondary" className="ml-auto text-[10px]">v0.3 beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-1">
          {empty ? (
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                Ray routes your question to the right skill — threat, device, identity, or knowledge.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="justify-start whitespace-normal text-left"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {turns.map((turn, i) =>
                turn.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 border-t pt-3"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Ray anything about your security posture…"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
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
  const icon = SKILL_ICON[response.skill] ?? <Sparkles className="h-3.5 w-3.5" />;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1 capitalize">
          {icon}
          {response.skill}
        </Badge>
        {response.classifier && response.classifier.reasoning !== 'forced' && (
          <span className="text-[10px] text-muted-foreground">
            routed via {response.classifier.reasoning} ({Math.round(response.classifier.confidence * 100)}%)
          </span>
        )}
      </div>
      <div className="rounded-lg border bg-card p-3 text-sm">
        <div className="whitespace-pre-wrap">{response.message}</div>
        {response.cards?.map((c, i) => (
          <div key={i} className={`mt-3 rounded-md border p-3 ${SEVERITY_CLASS[c.severity ?? 'info']}`}>
            {c.title && <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.title}</div>}
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
        {response.sources && response.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {response.sources.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {s.label}
              </Badge>
            ))}
          </div>
        )}
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
            <Button key={f} size="sm" variant="ghost" className="h-7 rounded-full text-xs" onClick={() => onFollowUp(f)}>
              {f}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
