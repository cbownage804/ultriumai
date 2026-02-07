import { useState } from 'react';
import { AlertTriangle, FileCode, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface ConflictItem {
  path: string;
  userContent: string;
  aiContent: string;
}

interface FileConflictDialogProps {
  open: boolean;
  conflicts: ConflictItem[];
  onResolve: (resolutions: Record<string, 'mine' | 'ai'>) => void;
  onCancel: () => void;
}

export function FileConflictDialog({ open, conflicts, onResolve, onCancel }: FileConflictDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'mine' | 'ai'>>({});
  const [expandedFile, setExpandedFile] = useState<string | null>(conflicts[0]?.path || null);

  const setResolution = (path: string, choice: 'mine' | 'ai') => {
    setResolutions(prev => ({ ...prev, [path]: choice }));
  };

  const allResolved = conflicts.every(c => resolutions[c.path]);

  const handleApply = () => {
    // Default unresolved to 'ai'
    const final: Record<string, 'mine' | 'ai'> = {};
    for (const c of conflicts) {
      final[c.path] = resolutions[c.path] || 'ai';
    }
    onResolve(final);
  };

  const acceptAllAI = () => {
    const all: Record<string, 'mine' | 'ai'> = {};
    conflicts.forEach(c => { all[c.path] = 'ai'; });
    onResolve(all);
  };

  const keepAllMine = () => {
    const all: Record<string, 'mine' | 'ai'> = {};
    conflicts.forEach(c => { all[c.path] = 'mine'; });
    onResolve(all);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            File Conflicts ({conflicts.length})
          </DialogTitle>
        </DialogHeader>

        <p className="text-[11px] text-white/40">
          The AI wants to update files you've manually edited. Choose which version to keep for each file.
        </p>

        <ScrollArea className="flex-1 max-h-[45vh]">
          <div className="space-y-2 pr-2">
            {conflicts.map(conflict => (
              <div key={conflict.path} className="rounded-lg border border-white/[0.06] overflow-hidden">
                <button
                  onClick={() => setExpandedFile(expandedFile === conflict.path ? null : conflict.path)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] transition-colors"
                >
                  {expandedFile === conflict.path ? <ChevronDown className="h-3 w-3 text-white/30" /> : <ChevronRight className="h-3 w-3 text-white/30" />}
                  <FileCode className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-mono text-white/70 flex-1 text-left">{conflict.path}</span>
                  {resolutions[conflict.path] && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded",
                      resolutions[conflict.path] === 'mine' ? "bg-blue-500/10 text-blue-400" : "bg-cyan-500/10 text-cyan-400"
                    )}>
                      {resolutions[conflict.path] === 'mine' ? 'Keep mine' : 'Use AI'}
                    </span>
                  )}
                </button>

                {expandedFile === conflict.path && (
                  <div className="border-t border-white/[0.04] p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setResolution(conflict.path, 'mine')}
                        className={cn(
                          "p-2 rounded-lg border text-left transition-all",
                          resolutions[conflict.path] === 'mine'
                            ? "border-blue-500/30 bg-blue-500/[0.05]"
                            : "border-white/[0.06] hover:border-white/[0.12]"
                        )}
                      >
                        <p className="text-[10px] font-medium text-blue-400 mb-1">Your version</p>
                        <pre className="text-[9px] text-white/40 font-mono overflow-hidden max-h-16 leading-tight">
                          {conflict.userContent.slice(0, 200)}...
                        </pre>
                      </button>
                      <button
                        onClick={() => setResolution(conflict.path, 'ai')}
                        className={cn(
                          "p-2 rounded-lg border text-left transition-all",
                          resolutions[conflict.path] === 'ai'
                            ? "border-cyan-500/30 bg-cyan-500/[0.05]"
                            : "border-white/[0.06] hover:border-white/[0.12]"
                        )}
                      >
                        <p className="text-[10px] font-medium text-cyan-400 mb-1">AI version</p>
                        <pre className="text-[9px] text-white/40 font-mono overflow-hidden max-h-16 leading-tight">
                          {conflict.aiContent.slice(0, 200)}...
                        </pre>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 pt-2">
          <Button variant="ghost" size="sm" className="text-xs text-white/40" onClick={keepAllMine}>
            Keep all mine
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-white/40" onClick={acceptAllAI}>
            Accept all AI
          </Button>
          <Button size="sm" onClick={handleApply} className="text-xs bg-gradient-to-r from-cyan-500 to-violet-500 text-white border-0">
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
