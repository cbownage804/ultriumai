import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'Navigation' },
  { keys: ['⌘', 'P'], description: 'Quick file switch', category: 'Navigation' },
  { keys: ['⌘', 'S'], description: 'Save project', category: 'Navigation' },
  { keys: ['⌘', '⇧', 'F'], description: 'Search across files', category: 'Navigation' },
  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['⌘', 'B'], description: 'Toggle file tree', category: 'Navigation' },
  { keys: ['⌘', '.'], description: 'Toggle preview/code', category: 'Navigation' },
  { keys: ['⌘', 'Z'], description: 'Undo', category: 'Editing' },
  { keys: ['⌘', '⇧', 'Z'], description: 'Redo', category: 'Editing' },
  { keys: ['⌘', 'I'], description: 'Inline AI edit (in editor)', category: 'Editing' },
  { keys: ['Enter'], description: 'Send message', category: 'Chat' },
  { keys: ['⇧', 'Enter'], description: 'New line in chat', category: 'Chat' },
  { keys: ['⌘', 'Enter'], description: 'Quick send', category: 'Chat' },
  { keys: ['Esc'], description: 'Stop generation / close panel', category: 'Chat' },
  { keys: ['⌘', 'J'], description: 'Toggle console', category: 'Build' },
  { keys: ['⌘', '`'], description: 'Toggle terminal', category: 'Build' },
  { keys: ['⌘', '⇧', 'E'], description: 'Toggle env vars', category: 'Build' },
];

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsPanel({ open, onOpenChange }: KeyboardShortcutsPanelProps) {
  const categories = [...new Set(SHORTCUTS.map(s => s.category))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-sm" onCloseAutoFocus={() => { document.body.style.pointerEvents = ''; }}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-cyan-400" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {categories.map(cat => (
            <div key={cat}>
              <h4 className="text-[10px] uppercase tracking-wider text-white/20 font-medium mb-2">{cat}</h4>
              <div className="space-y-1.5">
                {SHORTCUTS.filter(s => s.category === cat).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-xs text-white/60">{shortcut.description}</span>
                    <div className="flex items-center gap-0.5">
                      {shortcut.keys.map((key, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-[22px] h-5 px-1.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-white/50 font-mono flex items-center justify-center"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
