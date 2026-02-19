import { useState, useCallback } from 'react';

export interface FTSColumn {
  id: string;
  table: string;
  column: string;
  weight: 'A' | 'B' | 'C' | 'D';
}

export function useFullTextSearchSetup() {
  const [columns, setColumns] = useState<FTSColumn[]>([
    { id: '1', table: 'posts', column: 'title', weight: 'A' },
    { id: '2', table: 'posts', column: 'content', weight: 'B' },
  ]);
  const [tableName, setTableName] = useState('posts');
  const [debounceMs, setDebounceMs] = useState(300);
  const [minChars, setMinChars] = useState(2);

  const addColumn = useCallback(() => {
    setColumns(prev => [...prev, { id: crypto.randomUUID(), table: tableName, column: '', weight: 'B' }]);
  }, [tableName]);

  const updateColumn = useCallback((id: string, updates: Partial<FTSColumn>) => {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const removeColumn = useCallback((id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
  }, []);

  const generateMigrationSQL = useCallback((): string => {
    const colExpr = columns.map(c => `setweight(to_tsvector('english', coalesce(${c.column}, '')), '${c.weight}')`).join(' || ');
    return `-- Add tsvector column
ALTER TABLE public.${tableName} ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (${colExpr}) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_${tableName}_fts ON public.${tableName} USING GIN (fts);

-- Example query:
-- SELECT * FROM ${tableName} WHERE fts @@ plainto_tsquery('english', 'search term')
-- ORDER BY ts_rank(fts, plainto_tsquery('english', 'search term')) DESC;`;
  }, [columns, tableName]);

  const generateSearchComponent = useCallback((): string => {
    return `import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface SearchResult {
  id: string;
  [key: string]: unknown;
}

export function SearchBar({ onResults }: { onResults: (results: SearchResult[]) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < ${minChars}) { onResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('${tableName}')
        .select('*')
        .textSearch('fts', query, { type: 'websearch' })
        .limit(20);
      if (!error && data) onResults(data as SearchResult[]);
      setIsSearching(false);
    }, ${debounceMs});
    return () => clearTimeout(timerRef.current);
  }, [query, onResults]);

  return (
    <div className="relative">
      <Input
        placeholder="Search..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="pl-9"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
    </div>
  );
}`;
  }, [tableName, debounceMs, minChars]);

  return { columns, tableName, debounceMs, minChars, setTableName, setDebounceMs, setMinChars, addColumn, updateColumn, removeColumn, generateMigrationSQL, generateSearchComponent };
}
