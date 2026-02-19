/**
 * Inline SQL Runner — Phase 35
 * Detects SQL blocks in chat messages and adds "Run Query" buttons.
 * Displays results as inline data tables.
 */

import { useState, useCallback } from 'react';
import { Play, Download, Loader2, Table2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface InlineSQLRunnerProps {
  sql: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export function InlineSQLRunner({ sql, supabaseUrl, supabaseServiceKey }: InlineSQLRunnerProps) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runQuery = useCallback(async () => {
    setIsRunning(true);
    const start = performance.now();

    try {
      const { data, error } = await supabase.functions.invoke('ai-builder-schema', {
        body: {
          supabaseUrl: supabaseUrl || '',
          supabaseServiceKey: supabaseServiceKey || '',
          query: sql,
          action: 'run_query',
        },
      });

      const elapsed = Math.round(performance.now() - start);

      if (error || data?.error) {
        setResult({
          columns: [],
          rows: [],
          rowCount: 0,
          executionTimeMs: elapsed,
          error: data?.error || error?.message || 'Query failed',
        });
        return;
      }

      const rows = data?.rows || data || [];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

      setResult({
        columns,
        rows,
        rowCount: rows.length,
        executionTimeMs: elapsed,
      });
    } catch (err) {
      setResult({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTimeMs: Math.round(performance.now() - start),
        error: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setIsRunning(false);
    }
  }, [sql, supabaseUrl, supabaseServiceKey]);

  const exportCSV = useCallback(() => {
    if (!result || result.rows.length === 0) return;
    const header = result.columns.join(',');
    const rows = result.rows.map(r =>
      result.columns.map(c => JSON.stringify(r[c] ?? '')).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query-results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <div className="mt-2 rounded-lg border border-white/[0.06] overflow-hidden">
      {/* Run button */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02]">
        <button
          onClick={runQuery}
          disabled={isRunning}
          className={cn(
            "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md transition-colors",
            isRunning
              ? "text-white/30 bg-white/[0.03]"
              : "text-emerald-400/80 bg-emerald-500/[0.08] hover:bg-emerald-500/[0.15]"
          )}
        >
          {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {isRunning ? 'Running...' : 'Run Query'}
        </button>
        {result && !result.error && (
          <>
            <span className="text-[10px] text-white/20">
              {result.rowCount} row{result.rowCount !== 1 ? 's' : ''} · {result.executionTimeMs}ms
            </span>
            <button
              onClick={exportCSV}
              className="ml-auto flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
            >
              <Download className="h-2.5 w-2.5" />
              CSV
            </button>
          </>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="max-h-60 overflow-auto">
          {result.error ? (
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-red-400/80 bg-red-500/[0.05]">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {result.error}
            </div>
          ) : result.rows.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-white/25">
              No rows returned
            </div>
          ) : (
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {result.columns.map(col => (
                    <th key={col} className="px-2 py-1.5 text-left text-white/40 font-medium bg-white/[0.02]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    {result.columns.map(col => (
                      <td key={col} className="px-2 py-1 text-white/50 font-mono max-w-[200px] truncate">
                        {row[col] === null ? <span className="text-white/15 italic">null</span> : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
