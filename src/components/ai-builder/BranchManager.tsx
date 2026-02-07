import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GitBranch, Plus, Trash2, GitMerge, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Branch } from '@/hooks/useBranching';

interface BranchManagerProps {
  branches: Branch[];
  activeBranch: string;
  activeBranchName: string;
  onCreateBranch: (name: string) => void;
  onSwitchBranch: (id: string) => void;
  onMergeBranch: (id: string) => void;
  onDeleteBranch: (id: string) => void;
}

export function BranchManager({
  branches, activeBranch, activeBranchName,
  onCreateBranch, onSwitchBranch, onMergeBranch, onDeleteBranch,
}: BranchManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCreate = () => {
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim());
    setNewBranchName('');
    setShowNewInput(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 h-7 px-2 rounded-md text-[11px] font-mono text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors border border-white/[0.06]"
      >
        <GitBranch className="h-3 w-3" />
        <span className="max-w-[80px] truncate">{activeBranchName}</span>
        <ChevronDown className="h-2.5 w-2.5" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-white/[0.08] bg-[#0d0d14] shadow-xl shadow-black/50 z-50 overflow-hidden">
          <div className="p-1.5 border-b border-white/[0.06]">
            <div className="text-[9px] text-white/20 uppercase tracking-wider px-2 py-1 font-medium">Branches</div>
          </div>

          <div className="max-h-40 overflow-auto p-1">
            {branches.map(branch => (
              <div
                key={branch.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md group cursor-pointer transition-colors",
                  branch.id === activeBranch ? "bg-cyan-500/10 text-cyan-400" : "text-white/60 hover:bg-white/5 hover:text-white/80"
                )}
                onClick={() => { onSwitchBranch(branch.id); setIsOpen(false); }}
              >
                <GitBranch className="h-3 w-3 shrink-0" />
                <span className="flex-1 text-[11px] font-mono truncate">{branch.name}</span>
                {branch.id !== 'main' && branch.id !== activeBranch && (
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); onMergeBranch(branch.id); }}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10"
                      title="Merge into current"
                    >
                      <GitMerge className="h-2.5 w-2.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteBranch(branch.id); }}
                      className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10"
                      title="Delete branch"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-1.5 border-t border-white/[0.06]">
            {showNewInput ? (
              <div className="flex gap-1">
                <input
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="branch-name"
                  className="flex-1 h-7 px-2 text-[11px] font-mono bg-white/5 border border-white/[0.08] rounded text-white/80 placeholder:text-white/20 outline-none focus:border-cyan-500/30"
                  autoFocus
                />
                <button
                  onClick={handleCreate}
                  disabled={!newBranchName.trim()}
                  className="h-7 px-2 text-[10px] bg-cyan-500/20 text-cyan-400 rounded hover:bg-cyan-500/30 disabled:opacity-30 transition-colors"
                >
                  Create
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewInput(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              >
                <Plus className="h-3 w-3" />
                New branch
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
