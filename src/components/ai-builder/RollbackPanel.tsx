import { X, RotateCcw, Clock, FileCode, FilePlus, FileMinus, FileEdit } from 'lucide-react';
import type { DeploySnapshot } from '@/hooks/useOneClickRollback';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface Props {
  open: boolean;
  onClose: () => void;
  snapshots: DeploySnapshot[];
  currentFiles: ProjectFile[];
  onRollback: (id: string) => void;
  onGetDiff: (id: string) => { added: string[]; removed: string[]; modified: string[] } | null;
  isRollingBack: boolean;
}

export function RollbackPanel({ open, onClose, snapshots, currentFiles, onRollback, onGetDiff, isRollingBack }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-amber-400" /><span className="text-sm font-medium text-white">Deploy History & Rollback</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {snapshots.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">No deploy snapshots yet. Publish your app to create one.</p>
          ) : snapshots.map(s => {
            const diff = onGetDiff(s.id);
            return (
              <div key={s.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400">{s.version}</span>
                    <span className="text-xs text-white/70">{s.label}</span>
                  </div>
                  <button onClick={() => onRollback(s.id)} disabled={isRollingBack} className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-30">
                    Rollback
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.deployedAt.toLocaleString()}</span>
                  <span>{s.fileCount} files</span>
                  {diff && (
                    <>
                      {diff.added.length > 0 && <span className="text-emerald-400">+{diff.added.length}</span>}
                      {diff.modified.length > 0 && <span className="text-cyan-400">~{diff.modified.length}</span>}
                      {diff.removed.length > 0 && <span className="text-red-400">-{diff.removed.length}</span>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
