import { useState, useMemo, useCallback } from 'react';
import { Search, Replace, X, ChevronDown, ChevronRight, FileCode, Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { toast } from 'sonner';

interface SearchMatch {
  file: string;
  line: number;
  column: number;
  lineContent: string;
  matchLength: number;
}

interface FileMatches {
  path: string;
  matches: SearchMatch[];
  expanded: boolean;
}

interface MultiFileSearchReplaceProps {
  open: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onReplaceInFiles: (query: string, replacement: string, isRegex: boolean, caseSensitive: boolean) => number;
  onSelectFile: (path: string) => void;
  onSwitchToCode: () => void;
}

export function MultiFileSearchReplace({
  open, onClose, files, onReplaceInFiles, onSelectFile, onSwitchToCode,
}: MultiFileSearchReplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [regexError, setRegexError] = useState<string | null>(null);

  const results = useMemo((): FileMatches[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    setRegexError(null);

    let regex: RegExp;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      regex = isRegex
        ? new RegExp(searchQuery, flags)
        : new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch (e: any) {
      setRegexError(e.message);
      return [];
    }

    const fileMatches: FileMatches[] = [];
    for (const file of files) {
      if (!file.path.match(/\.(tsx?|jsx?|css|html?|json|md|txt|yml|yaml|toml|env)$/)) continue;
      const lines = file.content.split('\n');
      const matches: SearchMatch[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match: RegExpExecArray | null;
        regex.lastIndex = 0;
        while ((match = regex.exec(line)) !== null) {
          matches.push({
            file: file.path,
            line: i + 1,
            column: match.index + 1,
            lineContent: line,
            matchLength: match[0].length,
          });
          if (!regex.global) break;
        }
      }

      if (matches.length > 0) {
        fileMatches.push({ path: file.path, matches, expanded: true });
      }
    }
    return fileMatches;
  }, [searchQuery, files, isRegex, caseSensitive]);

  const totalMatches = useMemo(() => results.reduce((sum, f) => sum + f.matches.length, 0), [results]);

  const handleReplaceAll = useCallback(() => {
    if (!searchQuery) return;
    const count = onReplaceInFiles(searchQuery, replaceQuery, isRegex, caseSensitive);
    toast.success(`Replaced ${count} occurrences across ${results.length} files`);
  }, [searchQuery, replaceQuery, isRegex, caseSensitive, onReplaceInFiles, results.length]);

  const toggleFile = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  if (!open) return null;

  return (
    <div className="w-72 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/70">Search & Replace</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Search input */}
      <div className="p-2 space-y-1.5 border-b border-white/[0.06]">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across files..."
            className="h-7 text-xs bg-white/5 border-white/10 text-white pr-16"
            autoFocus
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={cn("h-5 w-5 rounded text-[9px] font-bold flex items-center justify-center", caseSensitive ? "bg-cyan-500/20 text-cyan-400" : "text-white/20 hover:text-white/40")}
              title="Case sensitive"
            >Aa</button>
            <button
              onClick={() => setIsRegex(!isRegex)}
              className={cn("h-5 w-5 rounded text-[9px] font-mono flex items-center justify-center", isRegex ? "bg-cyan-500/20 text-cyan-400" : "text-white/20 hover:text-white/40")}
              title="Regex"
            >.*</button>
          </div>
        </div>

        {regexError && (
          <div className="flex items-center gap-1 text-[10px] text-red-400">
            <AlertTriangle className="h-3 w-3" />
            <span className="truncate">{regexError}</span>
          </div>
        )}

        <button
          onClick={() => setShowReplace(!showReplace)}
          className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1"
        >
          <Replace className="h-3 w-3" />
          {showReplace ? 'Hide replace' : 'Show replace'}
        </button>

        {showReplace && (
          <div className="flex items-center gap-1">
            <Input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
              className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleReplaceAll}
              disabled={totalMatches === 0}
              className="h-7 text-[10px] px-2 shrink-0"
            >
              All ({totalMatches})
            </Button>
          </div>
        )}
      </div>

      {/* Results count */}
      {searchQuery.length >= 2 && (
        <div className="px-3 py-1.5 text-[10px] text-white/30 border-b border-white/[0.04]">
          {totalMatches} result{totalMatches !== 1 ? 's' : ''} in {results.length} file{results.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {results.map(fileResult => {
          const isExpanded = expandedFiles.has(fileResult.path) || expandedFiles.size === 0;
          return (
            <div key={fileResult.path}>
              <button
                onClick={() => toggleFile(fileResult.path)}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left hover:bg-white/[0.03] transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3 text-white/20" /> : <ChevronRight className="h-3 w-3 text-white/20" />}
                <FileCode className="h-3 w-3 text-cyan-400/50" />
                <span className="text-[11px] text-white/60 truncate flex-1">{fileResult.path.split('/').pop()}</span>
                <span className="text-[9px] text-white/20 bg-white/5 rounded px-1">{fileResult.matches.length}</span>
              </button>
              {isExpanded && fileResult.matches.slice(0, 50).map((match, i) => (
                <button
                  key={`${match.line}-${match.column}-${i}`}
                  onClick={() => { onSelectFile(match.file); onSwitchToCode(); }}
                  className="w-full flex items-start gap-2 pl-8 pr-3 py-1 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="text-[9px] text-white/15 font-mono w-6 text-right shrink-0 pt-0.5">{match.line}</span>
                  <span className="text-[10px] text-white/40 font-mono truncate leading-relaxed">
                    {highlightMatch(match.lineContent, match.column - 1, match.matchLength)}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function highlightMatch(line: string, start: number, length: number): React.ReactNode {
  const before = line.slice(Math.max(0, start - 20), start);
  const match = line.slice(start, start + length);
  const after = line.slice(start + length, start + length + 30);
  return (
    <>
      {before}<span className="bg-amber-400/30 text-amber-300 rounded-sm px-0.5">{match}</span>{after}
    </>
  );
}
