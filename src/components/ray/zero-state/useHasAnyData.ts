/**
 * useHasAnyData — cheap `count: 'exact', head: true` probe that answers
 * "does this customer have ANY real rows in this table yet?"
 *
 * Use it to drive three-state rendering (Loading / Empty / Active) without
 * pulling the full dataset. Pair with <PageState/> or usePageState().
 *
 * @example
 * const { hasData, isLoading } = useHasAnyData('wrayth_devices', {
 *   filters: [{ column: 'user_id', op: 'eq', value: user?.id }],
 * });
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FilterOp = 'eq' | 'neq' | 'is' | 'gt' | 'gte' | 'lt' | 'lte';

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
}

interface UseHasAnyDataOptions {
  filters?: Array<Filter | null | undefined | false>;
  /** Disable the query (e.g. while auth is loading). */
  enabled?: boolean;
}

interface UseHasAnyDataResult {
  hasData: boolean;
  count: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHasAnyData(
  table: string,
  { filters, enabled = true }: UseHasAnyDataOptions = {},
): UseHasAnyDataResult {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const filterKey = JSON.stringify(filters ?? []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    (async () => {
      let q = supabase.from(table as any).select('*', { count: 'exact', head: true });
      for (const f of filters ?? []) {
        if (!f) continue;
        // @ts-expect-error dynamic filter builder
        q = q[f.op](f.column, f.value);
      }
      const { count: c, error: err } = await q;
      if (cancelled) return;
      if (err) setError(err.message);
      setCount(c ?? 0);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterKey, enabled, tick]);

  return {
    hasData: count > 0,
    count,
    isLoading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}
