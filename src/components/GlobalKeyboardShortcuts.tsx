import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  action?: () => void;
}

interface GlobalKeyboardShortcutsProps {
  onOpenCommandPalette?: () => void;
}

export function GlobalKeyboardShortcuts({ onOpenCommandPalette }: GlobalKeyboardShortcutsProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const SHORTCUTS: Shortcut[] = [
    { keys: ['⌘', 'K'], description: 'Open command palette', category: 'Navigation', action: onOpenCommandPalette },
    { keys: ['⇧', '?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
    { keys: ['G', 'H'], description: 'Go to Hub', category: 'Navigation', action: () => navigate('/hub') },
    { keys: ['G', 'A'], description: 'Go to AI Studio', category: 'Navigation', action: () => navigate('/ai-studio') },
    { keys: ['G', 'S'], description: 'Go to SafeSuite', category: 'Navigation', action: () => navigate('/safesuite/dashboard') },
    { keys: ['G', 'P'], description: 'Go to Profile', category: 'Navigation', action: () => navigate('/profile') },
    { keys: ['Esc'], description: 'Close dialog / cancel', category: 'General' },
    { keys: ['⌘', 'Z'], description: 'Undo', category: 'Editing' },
    { keys: ['⌘', '⇧', 'Z'], description: 'Redo', category: 'Editing' },
    { keys: ['⌘', 'A'], description: 'Select all', category: 'Editing' },
    { keys: ['Space'], description: 'Select / toggle row', category: 'Tables' },
    { keys: ['⇧', 'Click'], description: 'Range select rows', category: 'Tables' },
    { keys: ['⌘', 'Click'], description: 'Multi-select rows', category: 'Tables' },
  ];

  const categories = [...new Set(SHORTCUTS.map(s => s.category))];

  // Sequence detection for two-key combos like G→H
  const [lastKey, setLastKey] = useState<string | null>(null);
  const lastKeyTimer = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    // Shift + ? to open shortcuts
    if (e.key === '?' && e.shiftKey && !isInput) {
      e.preventDefault();
      setOpen(prev => !prev);
      return;
    }

    // G-sequence navigation (only outside inputs)
    if (!isInput && !e.metaKey && !e.ctrlKey) {
      if (lastKey === 'g') {
        const key = e.key.toLowerCase();
        const shortcut = SHORTCUTS.find(s => 
          s.keys.length === 2 && s.keys[0] === 'G' && s.keys[1].toLowerCase() === key
        );
        if (shortcut?.action) {
          e.preventDefault();
          shortcut.action();
        }
        setLastKey(null);
        return;
      }

      if (e.key === 'g') {
        setLastKey('g');
        setTimeout(() => setLastKey(null), 800);
        return;
      }
    }
  }, [lastKey, SHORTCUTS, navigate, onOpenCommandPalette]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-card border-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2 max-h-[60vh] overflow-y-auto">
          {categories.map(cat => (
            <div key={cat}>
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-2">{cat}</h4>
              <div className="space-y-1.5">
                {SHORTCUTS.filter(s => s.category === cat).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-xs text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-0.5">
                      {shortcut.keys.map((key, ki) => (
                        <kbd
                          key={ki}
                          className="min-w-[22px] h-5 px-1.5 rounded bg-muted/50 border border-border text-[10px] text-muted-foreground font-mono flex items-center justify-center"
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
        <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
          Press <kbd className="px-1 rounded bg-muted/50 border border-border text-[10px]">Shift</kbd> + <kbd className="px-1 rounded bg-muted/50 border border-border text-[10px]">?</kbd> to toggle
        </p>
      </DialogContent>
    </Dialog>
  );
}
