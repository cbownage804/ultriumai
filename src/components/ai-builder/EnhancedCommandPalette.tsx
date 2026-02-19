import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Search, FileCode, Eye, Code, Columns, Undo2, Redo2, Save, Trash2, Rocket,
  Settings, Database, Shield, Brain, Zap, Package, Variable, Image, History,
  Terminal, Gauge, BarChart3, Globe, Bug, Keyboard, Sun, Moon, Palette,
  GitBranch, FolderOpen, Layers, Bot, BookOpen, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: 'file' | 'view' | 'edit' | 'panel' | 'deploy' | 'theme' | 'run';
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface EnhancedCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ProjectFile[];
  actions: CommandAction[];
  onSelectFile: (path: string) => void;
  recentFiles?: string[];
}

export function EnhancedCommandPalette({
  open, onOpenChange, files, actions, onSelectFile, recentFiles = [],
}: EnhancedCommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIndex(0); }
  }, [open]);

  // Keyboard shortcut removed — handled by workspace-level handler to avoid conflicts

  const isFileMode = query.length === 0 || !query.startsWith('>');
  const searchQuery = query.startsWith('>') ? query.slice(1).trim().toLowerCase() : query.toLowerCase();

  const filteredItems = useMemo(() => {
    if (isFileMode && searchQuery.length === 0) {
      // Show recent files + top actions
      const recentFileItems = recentFiles.slice(0, 5).map(path => ({
        id: `file:${path}`,
        type: 'file' as const,
        label: path.split('/').pop() || path,
        description: path,
        icon: FileCode,
        action: () => onSelectFile(path),
      }));
      const topActions = actions.slice(0, 8).map(a => ({
        id: `action:${a.id}`,
        type: 'action' as const,
        label: a.label,
        description: a.description,
        icon: a.icon,
        shortcut: a.shortcut,
        action: a.action,
        category: a.category,
      }));
      return [...recentFileItems, ...topActions];
    }

    if (isFileMode) {
      // File fuzzy search
      const fileItems = files
        .filter(f => {
          const name = f.path.toLowerCase();
          return name.includes(searchQuery) || fuzzyMatch(name, searchQuery);
        })
        .slice(0, 15)
        .map(f => ({
          id: `file:${f.path}`,
          type: 'file' as const,
          label: f.path.split('/').pop() || f.path,
          description: f.path,
          icon: FileCode,
          action: () => onSelectFile(f.path),
        }));
      return fileItems;
    }

    // Action search (prefixed with >)
    return actions
      .filter(a => {
        const text = `${a.label} ${a.description || ''} ${(a.keywords || []).join(' ')}`.toLowerCase();
        return text.includes(searchQuery);
      })
      .slice(0, 15)
      .map(a => ({
        id: `action:${a.id}`,
        type: 'action' as const,
        label: a.label,
        description: a.description,
        icon: a.icon,
        shortcut: a.shortcut,
        action: a.action,
        category: a.category,
      }));
  }, [query, files, actions, recentFiles, onSelectFile, isFileMode, searchQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = filteredItems[selectedIndex];
      if (item) { item.action(); onOpenChange(false); }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }, [filteredItems, selectedIndex, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 bg-[#111118] border-white/10 shadow-2xl shadow-black/50 overflow-hidden gap-0">
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 h-12 border-b border-white/[0.06]">
          <Search className="h-4 w-4 text-white/30 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files or type > for commands..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none"
            autoFocus
          />
          <kbd className="text-[9px] text-white/20 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {filteredItems.length === 0 && (
            <div className="py-8 text-center text-white/20 text-sm">No results found</div>
          )}
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.button
                key={item.id}
                data-index={i}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1, delay: i * 0.015 }}
                onClick={() => { item.action(); onOpenChange(false); }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                  i === selectedIndex ? "bg-cyan-500/10 text-white" : "text-white/60 hover:bg-white/[0.03]"
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", i === selectedIndex ? "text-cyan-400" : "text-white/30")} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{item.label}</div>
                  {item.description && (
                    <div className="text-[10px] text-white/25 truncate">{item.description}</div>
                  )}
                </div>
                {'shortcut' in item && item.shortcut && (
                  <kbd className="text-[9px] text-white/15 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono shrink-0">
                    {item.shortcut}
                  </kbd>
                )}
                {'category' in item && item.category && (
                  <span className="text-[9px] text-white/15 uppercase tracking-wider shrink-0">
                    {item.category}
                  </span>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 h-8 border-t border-white/[0.06] text-[10px] text-white/15">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">{isFileMode ? 'Type > for commands' : 'File search'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function fuzzyMatch(text: string, pattern: string): boolean {
  let pi = 0;
  for (let ti = 0; ti < text.length && pi < pattern.length; ti++) {
    if (text[ti] === pattern[pi]) pi++;
  }
  return pi === pattern.length;
}
