import { useState, useMemo } from 'react';
import { X, Search, Star, Trash2, Clock, Copy, Play, Download, Upload, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { PromptHistoryEntry } from '@/hooks/usePromptHistory';

interface PromptHistoryPanelProps {
  open: boolean;
  onClose: () => void;
  history: PromptHistoryEntry[];
  onRerun: (prompt: string) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onExport: () => string;
  onImport: (json: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  ui: 'text-cyan-400 bg-cyan-500/10',
  backend: 'text-violet-400 bg-violet-500/10',
  fix: 'text-red-400 bg-red-500/10',
  refactor: 'text-amber-400 bg-amber-500/10',
  general: 'text-white/40 bg-white/[0.06]',
};

export function PromptHistoryPanel({
  open, onClose, history, onRerun, onToggleFavorite, onRemove, onClear, onExport, onImport,
}: PromptHistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filtered = useMemo(() => {
    let items = [...history].reverse();
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(e => e.prompt.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      items = items.filter(e => e.category === categoryFilter);
    }
    if (showFavoritesOnly) {
      items = items.filter(e => e.isFavorite);
    }
    return items;
  }, [history, search, categoryFilter, showFavoritesOnly]);

  const handleExport = () => {
    const json = onExport();
    navigator.clipboard.writeText(json);
    toast.success(`Copied ${history.length} prompts to clipboard`);
  };

  const handleImport = () => {
    const input = prompt('Paste exported prompt history JSON:');
    if (input) { onImport(input); toast.success('Imported prompts'); }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/80">Prompt History</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">{history.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleExport} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Export">
            <Download className="h-2.5 w-2.5" />
          </button>
          <button onClick={handleImport} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5" title="Import">
            <Upload className="h-2.5 w-2.5" />
          </button>
          <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 h-7">
          <Search className="h-3 w-3 text-white/20 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="flex-1 bg-transparent text-[11px] text-white/70 placeholder:text-white/20 outline-none"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/[0.04] shrink-0 flex-wrap">
        <button
          onClick={() => setShowFavoritesOnly(v => !v)}
          className={cn("h-5 px-1.5 rounded text-[9px] transition-colors flex items-center gap-0.5",
            showFavoritesOnly ? "bg-amber-500/10 text-amber-400" : "text-white/25 hover:text-white/50")}
        >
          <Star className="h-2.5 w-2.5" /> Favorites
        </button>
        {['all', 'ui', 'backend', 'fix', 'refactor'].map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={cn("h-5 px-1.5 rounded text-[9px] transition-colors",
              categoryFilter === cat ? "bg-white/10 text-white/70" : "text-white/25 hover:text-white/50")}>
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-5 w-5 text-white/10 mb-2" />
              <p className="text-[11px] text-white/25">{history.length === 0 ? 'No prompts yet' : 'No matches'}</p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map(entry => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="group rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <button onClick={() => onToggleFavorite(entry.id)} className="mt-0.5 shrink-0">
                      <Star className={cn("h-3 w-3 transition-colors",
                        entry.isFavorite ? "text-amber-400 fill-amber-400" : "text-white/15 hover:text-amber-400/60")} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/60 leading-snug line-clamp-3">{entry.prompt}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={cn("text-[8px] px-1 py-0.5 rounded font-medium", CATEGORY_COLORS[entry.category])}>
                          {entry.category}
                        </span>
                        <span className="text-[8px] text-white/15">
                          {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {entry.resultFileCount > 0 && (
                          <span className="text-[8px] text-white/15">{entry.resultFileCount} files</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onRerun(entry.prompt)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                      <Play className="h-2.5 w-2.5" /> Re-run
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(entry.prompt); toast.success('Copied'); }}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/5">
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                    <button onClick={() => onRemove(entry.id)}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-red-400/60 hover:bg-red-500/5">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {history.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/[0.06] shrink-0">
          <button onClick={onClear} className="text-[9px] text-red-400/50 hover:text-red-400 transition-colors">
            Clear all history
          </button>
        </div>
      )}
    </motion.div>
  );
}
