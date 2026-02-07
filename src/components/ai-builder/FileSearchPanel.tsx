import { useState, useMemo, useCallback } from 'react';
import { Search, X, FileCode, ChevronDown, ChevronRight, Replace, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { motion, AnimatePresence } from 'framer-motion';

interface FileSearchPanelProps {
  open: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onSelectFile: (path: string) => void;
  onSwitchToCode: () => void;
  onReplaceInFiles?: (query: string, replacement: string, isRegex: boolean, caseSensitive: boolean) => number;
}

interface SearchMatch {
  filePath: string;
  line: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export function FileSearchPanel({ open, onClose, files, onSelectFile, onSwitchToCode, onReplaceInFiles }: FileSearchPanelProps) {
  const [query, setQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const [replacedCount, setReplacedCount] = useState(0);

  const results = useMemo(() => {
    if (!query || query.length < 2) return [];

    const matches: SearchMatch[] = [];
    let searchRegex: RegExp;

    try {
      searchRegex = isRegex
        ? new RegExp(query, caseSensitive ? 'g' : 'gi')
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
    } catch {
      return [];
    }

    for (const file of files) {
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        searchRegex.lastIndex = 0;
        while ((match = searchRegex.exec(line)) !== null) {
          matches.push({
            filePath: file.path,
            line: i + 1,
            lineContent: line,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
          if (matches.length > 200) break;
        }
        if (matches.length > 200) break;
      }
      if (matches.length > 200) break;
    }

    return matches;
  }, [query, files, isRegex, caseSensitive]);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchMatch[]>();
    for (const m of results) {
      if (!map.has(m.filePath)) map.set(m.filePath, []);
      map.get(m.filePath)!.push(m);
    }
    return map;
  }, [results]);

  const toggleCollapse = useCallback((path: string) => {
    setCollapsedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleSelect = useCallback((match: SearchMatch) => {
    onSelectFile(match.filePath);
    onSwitchToCode();
  }, [onSelectFile, onSwitchToCode]);

  const handleReplaceAll = useCallback(() => {
    if (!onReplaceInFiles || !query) return;
    const count = onReplaceInFiles(query, replaceText, isRegex, caseSensitive);
    setReplacedCount(count);
    setTimeout(() => setReplacedCount(0), 3000);
  }, [onReplaceInFiles, query, replaceText, isRegex, caseSensitive]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 280, opacity: 1 }}
        exit={{ width: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full border-r border-white/[0.06] bg-[#0a0a0f] flex flex-col shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-wider font-medium">
            <Search className="h-3 w-3" />
            Search {showReplace ? '& Replace' : 'Files'}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowReplace(!showReplace)}
              className={cn("h-5 w-5 flex items-center justify-center rounded transition-colors", showReplace ? "text-cyan-400 bg-cyan-500/10" : "text-white/30 hover:text-white/60")}
              title="Toggle Replace"
            >
              <ArrowRightLeft className="h-3 w-3" />
            </button>
            <button onClick={onClose} className="h-5 w-5 flex items-center justify-center text-white/30 hover:text-white/60 rounded transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="p-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 focus-within:border-cyan-500/30 transition-colors">
            <Search className="h-3 w-3 text-white/20 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search in files..."
              className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/20 outline-none"
              autoFocus
            />
          </div>

          {/* Replace input */}
          {showReplace && (
            <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 mt-1.5 focus-within:border-cyan-500/30 transition-colors">
              <Replace className="h-3 w-3 text-white/20 shrink-0" />
              <input
                type="text"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="flex-1 bg-transparent text-xs text-white/80 placeholder:text-white/20 outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-1.5 px-0.5">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={cn(
                "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                caseSensitive ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" : "border-white/10 text-white/30 hover:text-white/50"
              )}
            >
              Aa
            </button>
            <button
              onClick={() => setIsRegex(!isRegex)}
              className={cn(
                "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                isRegex ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" : "border-white/10 text-white/30 hover:text-white/50"
              )}
            >
              .*
            </button>

            {showReplace && results.length > 0 && (
              <button
                onClick={handleReplaceAll}
                className="text-[9px] px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors ml-auto"
              >
                Replace All ({results.length})
              </button>
            )}

            {!showReplace && results.length > 0 && (
              <span className="text-[9px] text-white/20 ml-auto">
                {results.length}{results.length >= 200 ? '+' : ''} results
              </span>
            )}
          </div>

          {replacedCount > 0 && (
            <div className="text-[9px] text-emerald-400 mt-1 px-0.5">
              ✓ Replaced {replacedCount} occurrence{replacedCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-auto">
          {query.length >= 2 && results.length === 0 && (
            <div className="p-4 text-center text-xs text-white/20">
              No results found
            </div>
          )}

          {Array.from(grouped.entries()).map(([filePath, matches]) => {
            const isCollapsed = collapsedFiles.has(filePath);
            return (
              <div key={filePath}>
                <button
                  onClick={() => toggleCollapse(filePath)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-white/[0.03] transition-colors"
                >
                  {isCollapsed ? <ChevronRight className="h-3 w-3 text-white/30" /> : <ChevronDown className="h-3 w-3 text-white/30" />}
                  <FileCode className="h-3 w-3 text-cyan-400/50 shrink-0" />
                  <span className="text-[11px] text-white/60 font-mono truncate flex-1">{filePath}</span>
                  <span className="text-[9px] text-white/20 shrink-0">{matches.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="pl-6">
                    {matches.slice(0, 20).map((m, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(m)}
                        className="w-full text-left px-2 py-1 hover:bg-white/[0.04] transition-colors group"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="text-[9px] text-white/15 font-mono shrink-0 w-6 text-right">{m.line}</span>
                          <span className="text-[11px] text-white/40 font-mono truncate">
                            {m.lineContent.slice(0, m.matchStart)}
                            <span className="text-cyan-300 bg-cyan-500/15 rounded-sm px-0.5">
                              {m.lineContent.slice(m.matchStart, m.matchEnd)}
                            </span>
                            {m.lineContent.slice(m.matchEnd, m.matchEnd + 40)}
                          </span>
                        </div>
                      </button>
                    ))}
                    {matches.length > 20 && (
                      <div className="px-2 py-1 text-[9px] text-white/15">+{matches.length - 20} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
