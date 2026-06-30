/**
 * RaySearchBar — unified search across passwords, identities, threats,
 * recommendations, and timeline. Lives on /app/ray.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { raySearch, labelForKind, type RaySearchResult } from '@/lib/ray/search';
import { cn } from '@/lib/utils';
import { Loader2, Search } from 'lucide-react';

const KIND_TONE: Record<RaySearchResult['kind'], string> = {
  password: 'text-violet-300 border-violet-400/30',
  identity: 'text-sky-300 border-sky-400/30',
  threat: 'text-red-300 border-red-400/30',
  recommendation: 'text-amber-300 border-amber-400/30',
  event: 'text-slate-300 border-slate-500/30',
};

export function RaySearchBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<RaySearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce
  const debounced = useDebounced(q, 220);

  useEffect(() => {
    if (!user || debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    setLoading(true);
    void raySearch(user.id, debounced)
      .then((r) => { if (active) setResults(r); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, debounced]);

  const grouped = useMemo(() => {
    const g: Record<string, RaySearchResult[]> = {};
    for (const r of results) {
      (g[r.kind] ||= []).push(r);
    }
    return g;
  }, [results]);

  return (
    <section>
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
        Ask Ray to find anything
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search passwords, identities, threats, timeline…"
          className="w-full rounded-sm border border-border bg-card/40 pl-10 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {q.trim().length >= 2 && !loading && results.length === 0 && (
        <div className="mt-2 text-xs text-muted-foreground">Ray didn't find anything matching "{q}".</div>
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

export default RaySearchBar;
