/**
 * Wrayth Launch Checklist — dev-only "release dashboard".
 *
 * Not linked from navigation. Only routable when import.meta.env.DEV is true
 * or the URL carries ?debug=1. See src/App.tsx for the guard.
 *
 * Combines automated grep results (scripts/audit.mjs) with a manual checklist
 * persisted to localStorage. Purpose: give us a measurable definition of
 * "ready" during the 5.0 polish sprint.
 */
import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Circle, AlertTriangle, XCircle } from 'lucide-react';
import { CATEGORIES, STORAGE_KEY, type CheckStatus } from '@/dev/launchManifest';
import auditReport from '@/dev/auditReport.json';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type ManualState = Record<string, CheckStatus>;

const STATUS_ORDER: CheckStatus[] = ['todo', 'warn', 'fail', 'pass'];

function loadState(): ManualState {
  if (typeof localStorage === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveState(state: ManualState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* no-op */
  }
}

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'pass') return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (status === 'warn') return <AlertTriangle className="size-4 text-amber-500" />;
  if (status === 'fail') return <XCircle className="size-4 text-red-500" />;
  return <Circle className="size-4 text-muted-foreground" />;
}

export default function LaunchChecklist() {
  const [state, setState] = useState<ManualState>({});

  useEffect(() => {
    setState(loadState());
  }, []);

  const cycle = (id: string) => {
    setState((prev) => {
      const current = prev[id] ?? 'todo';
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
      const updated = { ...prev, [id]: next };
      saveState(updated);
      return updated;
    });
  };

  const stats = useMemo(() => {
    const totalManual = CATEGORIES.reduce((n, c) => n + c.manual.length, 0);
    const passed = Object.values(state).filter((s) => s === 'pass').length;
    return { passed, totalManual, pct: totalManual === 0 ? 0 : Math.round((passed / totalManual) * 100) };
  }, [state]);

  const audit = auditReport as typeof auditReport;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Helmet>
        <title>Launch Checklist · Wrayth (dev)</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Internal · not shipped</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Wrayth Launch Checklist</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The measurable definition of &ldquo;ready&rdquo; for Wrayth 5.0. Manual checks below;
          automated grep results at the bottom. Click any check to cycle its state.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Progress value={stats.pct} className="h-2 max-w-md" />
          <span className="text-sm font-medium">
            {stats.passed} / {stats.totalManual} passing ({stats.pct}%)
          </span>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const catPassed = cat.manual.filter((m) => state[m.id] === 'pass').length;
          return (
            <div key={cat.id} className="rounded-2xl border border-border/60 bg-card/40 p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-medium">{cat.title}</h2>
                <span className="text-xs text-muted-foreground">
                  {catPassed}/{cat.manual.length}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{cat.description}</p>
              <ul className="mt-4 space-y-2">
                {cat.manual.map((check) => {
                  const status = state[check.id] ?? 'todo';
                  return (
                    <li key={check.id}>
                      <button
                        type="button"
                        onClick={() => cycle(check.id)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                          'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        )}
                        aria-label={`${check.label} — currently ${status}`}
                      >
                        <span className="mt-0.5"><StatusIcon status={status} /></span>
                        <span className="flex-1">
                          <span className={cn(status === 'pass' && 'text-muted-foreground line-through')}>
                            {check.label}
                          </span>
                          {check.hint ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">{check.hint}</span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-medium">Automated audit</h2>
          <span className="text-xs text-muted-foreground">
            {audit.generatedAt ? new Date(audit.generatedAt).toLocaleString() : 'run `node scripts/audit.mjs`'}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Grep-based signals across src/, supabase/functions/, extension/, public/.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Object.entries(audit.totals).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border/50 bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="text-lg font-semibold">{String(v)}</p>
            </div>
          ))}
        </div>

        {audit.legacyBrand?.length ? (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Legacy brand references ({audit.legacyBrand.length})
            </summary>
            <ul className="mt-2 max-h-80 space-y-1 overflow-auto rounded-md bg-background/60 p-3 text-xs font-mono">
              {audit.legacyBrand.slice(0, 100).map((h, i) => (
                <li key={i} className="truncate">
                  <span className="text-muted-foreground">{h.file}:{h.line}</span>{' '}
                  <span>{h.text}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <footer className="mt-10 flex items-center justify-between border-t border-border/40 pt-6 text-xs text-muted-foreground">
        <span>State stored locally — clear to reset.</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setState({});
          }}
        >
          Reset checklist
        </Button>
      </footer>
    </div>
  );
}
