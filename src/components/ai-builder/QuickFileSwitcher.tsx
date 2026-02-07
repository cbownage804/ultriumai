import { useState, useEffect, useRef } from 'react';
import { FileCode, Search } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface QuickFileSwitcherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ProjectFile[];
  onSelectFile: (path: string) => void;
}

export function QuickFileSwitcher({ open, onOpenChange, files, onSelectFile }: QuickFileSwitcherProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter(f =>
    f.path.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      onSelectFile(filtered[selectedIndex].path);
      onOpenChange(false);
    }
  };

  const getIcon = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const icons: Record<string, string> = { html: '🌐', css: '🎨', js: '⚡', ts: '💎', json: '📋', md: '📝', svg: '🖼️' };
    return icons[ext] || '📄';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-sm p-0 gap-0 [&>button]:hidden">
        <div className="flex items-center gap-2 px-3 h-10 border-b border-white/[0.06]">
          <Search className="h-3.5 w-3.5 text-white/30" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Go to file..."
            className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/20 outline-none"
          />
          <span className="text-[9px] text-white/20 font-mono">⌘P</span>
        </div>
        <div className="max-h-64 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="text-center text-white/20 text-xs py-6">No files found</div>
          ) : (
            filtered.map((file, i) => (
              <button
                key={file.path}
                onClick={() => { onSelectFile(file.path); onOpenChange(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                  i === selectedIndex ? "bg-cyan-500/10 text-white/90" : "text-white/50 hover:bg-white/[0.03]"
                )}
              >
                <span className="text-sm">{getIcon(file.path)}</span>
                <span className="text-xs font-mono truncate">{file.path}</span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
