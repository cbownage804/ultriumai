import { useState, useCallback, useMemo } from 'react';
import { Search, Hash, Braces, Type, Variable, ArrowRight, X, FileCode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface SymbolResult {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'type' | 'interface' | 'component' | 'export';
  file: string;
  line: number;
  preview: string;
}

interface SymbolSearchPanelProps {
  open: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onNavigate: (file: string, line: number) => void;
}

const SYMBOL_PATTERNS: { kind: SymbolResult['kind']; regex: RegExp }[] = [
  { kind: 'function', regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g },
  { kind: 'function', regex: /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(/g },
  { kind: 'function', regex: /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>/g },
  { kind: 'class', regex: /(?:export\s+)?class\s+(\w+)/g },
  { kind: 'type', regex: /(?:export\s+)?type\s+(\w+)\s*=/g },
  { kind: 'interface', regex: /(?:export\s+)?interface\s+(\w+)/g },
  { kind: 'component', regex: /(?:export\s+)?(?:default\s+)?function\s+([A-Z]\w+)\s*\(/g },
  { kind: 'variable', regex: /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*[:=]/g },
];

const KIND_ICONS: Record<SymbolResult['kind'], typeof Hash> = {
  function: Braces,
  class: Type,
  variable: Variable,
  type: Hash,
  interface: Hash,
  component: FileCode,
  export: ArrowRight,
};

const KIND_COLORS: Record<SymbolResult['kind'], string> = {
  function: 'text-amber-400',
  class: 'text-emerald-400',
  variable: 'text-sky-400',
  type: 'text-fuchsia-400',
  interface: 'text-violet-400',
  component: 'text-cyan-400',
  export: 'text-orange-400',
};

function extractSymbols(files: ProjectFile[]): SymbolResult[] {
  const results: SymbolResult[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (!file.path.match(/\.(ts|tsx|js|jsx|html|css)$/)) continue;
    const lines = file.content.split('\n');

    for (const { kind, regex } of SYMBOL_PATTERNS) {
      // Reset regex lastIndex
      const re = new RegExp(regex.source, regex.flags);
      let match;
      while ((match = re.exec(file.content)) !== null) {
        const name = match[1];
        const key = `${file.path}:${name}:${kind}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Find line number
        const beforeMatch = file.content.substring(0, match.index);
        const line = beforeMatch.split('\n').length;
        const preview = lines[line - 1]?.trim() || '';

        results.push({ name, kind, file: file.path, line, preview });
      }
    }
  }

  return results;
}

export function SymbolSearchPanel({ open, onClose, files, onNavigate }: SymbolSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<SymbolResult['kind'] | null>(null);

  const allSymbols = useMemo(() => extractSymbols(files), [files]);

  const filtered = useMemo(() => {
    let results = allSymbols;
    if (kindFilter) results = results.filter(s => s.kind === kindFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.file.toLowerCase().includes(q)
      );
    }
    return results.slice(0, 100);
  }, [allSymbols, query, kindFilter]);

  const handleSelect = useCallback((sym: SymbolResult) => {
    onNavigate(sym.file, sym.line);
    onClose();
  }, [onNavigate, onClose]);

  // Group by file
  const grouped = useMemo(() => {
    const map = new Map<string, SymbolResult[]>();
    for (const sym of filtered) {
      const arr = map.get(sym.file) || [];
      arr.push(sym);
      map.set(sym.file, arr);
    }
    return map;
  }, [filtered]);

  if (!open) return null;

  const kinds: SymbolResult['kind'][] = ['component', 'function', 'class', 'interface', 'type', 'variable'];

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Search className="h-3.5 w-3.5 text-cyan-400" />
          Symbol Search
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="px-2 py-2 space-y-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbols... (@ for types, # for functions)"
          className="h-7 text-xs bg-white/5 border-white/10"
          autoFocus
        />
        <div className="flex flex-wrap gap-1">
          {kinds.map(k => {
            const Icon = KIND_ICONS[k];
            return (
              <button
                key={k}
                onClick={() => setKindFilter(prev => prev === k ? null : k)}
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 transition-colors capitalize",
                  kindFilter === k
                    ? `${KIND_COLORS[k]} border-current/30 bg-current/10`
                    : "text-white/30 border-white/10 hover:text-white/50"
                )}
              >
                <Icon className="h-2.5 w-2.5" />
                {k}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/20 text-xs">
            {query ? 'No symbols found' : `${allSymbols.length} symbols indexed`}
          </div>
        ) : (
          Array.from(grouped.entries()).map(([file, symbols]) => (
            <div key={file} className="mb-2">
              <div className="text-[9px] font-medium text-white/25 px-2 py-1 truncate" title={file}>
                {file}
              </div>
              {symbols.map((sym, i) => {
                const Icon = KIND_ICONS[sym.kind];
                return (
                  <button
                    key={`${sym.name}-${i}`}
                    onClick={() => handleSelect(sym)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors group flex items-start gap-2"
                  >
                    <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", KIND_COLORS[sym.kind])} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-white/70 group-hover:text-white/90 font-mono truncate">
                        {sym.name}
                      </div>
                      <div className="text-[10px] text-white/20 font-mono truncate">
                        L{sym.line}: {sym.preview}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-white/[0.06] text-[10px] text-white/20">
        {filtered.length} of {allSymbols.length} symbols
      </div>
    </div>
  );
}
