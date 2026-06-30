/**
 * AskRay — Wrayth 2.6 unified question + search bar.
 *
 * If the input parses as a question, Ray composes a grounded answer from
 * internal skills (passwords, MFA, exposure, devices, timeline, score,
 * recommendations). Otherwise it falls back to direct search results.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { askRay, type RayAnswer, type AnswerTone } from '@/lib/ray/intent';
import { raySearch, labelForKind, type RaySearchResult } from '@/lib/ray/search';
import { recordAskedQuestion } from '@/lib/ray/notices';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';

const TONE_DOT: Record<AnswerTone, string> = {
  ok: 'bg-emerald-400',
  warn: 'bg-amber-400',
  bad: 'bg-red-400',
  info: 'bg-violet-300/70',
};

const KIND_TONE: Record<RaySearchResult['kind'], string> = {
  password: 'text-violet-300 border-violet-400/30',
  identity: 'text-sky-300 border-sky-400/30',
  threat: 'text-red-300 border-red-400/30',
  recommendation: 'text-amber-300 border-amber-400/30',
  event: 'text-slate-300 border-slate-500/30',
};

function isQuestionish(q: string): boolean {
  const t = q.trim();
  if (t.endsWith('?')) return true;
  return /^(is|are|was|were|do|does|did|can|should|which|what|why|how|when|where|show|tell|list|find)\b/i.test(t)
    || t.split(/\s+/).length >= 3;
}

export function AskRay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<RayAnswer | null>(null);
  const [results, setResults] = useState<RaySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounced(q, 260);

  // Allow other surfaces to push a question (e.g., suggested chips).
  useEffect(() => {
    function onAsk(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') setQ(detail);
    }
    window.addEventListener('ray:ask', onAsk);
    return () => window.removeEventListener('ray:ask', onAsk);
  }, []);

  useEffect(() => {
    if (!user || debounced.trim().length < 2) {
      setAnswer(null);
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    const question = isQuestionish(debounced);
    const work = question
      ? askRay(user.id, debounced).then((a) => { if (active) { setAnswer(a); setResults([]); } })
      : raySearch(user.id, debounced).then((r) => { if (active) { setResults(r); setAnswer(null); } });
    void work.finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, debounced]);

  const grouped = useMemo(() => {
    const g: Record<string, RaySearchResult[]> = {};
    for (const r of results) (g[r.kind] ||= []).push(r);
    return g;
  }, [results]);

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
        Ask Ray
      </div>
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300/70" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask Ray anything…  e.g. Is my Gmail secure?"
          className="w-full rounded-sm border border-border bg-card/40 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {q.trim().length >= 2 && !loading && !answer && results.length === 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Ray didn't find anything matching "{q}".
        </div>
      )}

      {answer && (
        <article className="mt-3 rounded-sm border border-violet-400/25 bg-violet-500/[0.04] px-4 py-3">
          <header className="text-sm text-foreground">{answer.headline}</header>
          <ul className="mt-2 space-y-1.5">
            {answer.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className={cn('mt-1.5 h-1.5 w-1.5 rounded-full shrink-0', TONE_DOT[b.tone])} />
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
          {answer.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {answer.actions.map((a) => (
                <button
                  key={a.href}
                  onClick={() => navigate(a.href)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-foreground/80 hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  {a.label} <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
          {answer.skillsUsed.length > 0 && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              Composed from {answer.skillsUsed.join(' · ')}
            </div>
          )}
        </article>
      )}

      {results.length > 0 && (
        <div className="mt-3 rounded-sm border border-border bg-card/40 divide-y divide-border">
          {Object.entries(grouped).map(([kind, items]) => (
            <div key={kind}>
              <div className="px-4 pt-2.5 pb-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {labelForKind(kind as RaySearchResult['kind'])}
              </div>
              <ul>
                {items.map((r) => (
                  <li key={`${r.kind}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => navigate(r.href)}
                      className="w-full text-left px-4 py-2 hover:bg-foreground/5 flex items-center gap-3"
                    >
                      <span className={cn('text-[10px] uppercase tracking-wider border rounded-full px-2 py-0.5', KIND_TONE[r.kind])}>
                        {labelForKind(r.kind)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <div className="text-sm text-foreground truncate">{r.title}</div>
                        {r.subtitle && <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default AskRay;
