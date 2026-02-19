import { X, Play, Settings, Check, AlertTriangle } from 'lucide-react';
import type { BuildScript } from '@/hooks/useCustomBuildScripts';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

interface Props {
  open: boolean;
  onClose: () => void;
  scripts: BuildScript[];
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
  onRemove: (id: string) => void;
}

export function BuildScriptsPanel({ open, onClose, scripts, onToggle, onRun, onRemove }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[550px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Settings className="h-4 w-4 text-violet-400" /><span className="text-sm font-medium text-white">Build Scripts</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {scripts.map(s => (
            <div key={s.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggle(s.id)} className={`h-4 w-4 rounded border ${s.enabled ? 'bg-violet-500 border-violet-500' : 'border-white/20'} flex items-center justify-center`}>
                    {s.enabled && <Check className="h-3 w-3 text-white" />}
                  </button>
                  <span className="text-xs font-medium text-white/80">{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30">{s.hook}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onRun(s.id)} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-white/5">
                    <Play className="h-3 w-3" />
                  </button>
                  <button onClick={() => onRemove(s.id)} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-white/5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-white/30">{s.script}</p>
              {s.lastResult && (
                <div className={`mt-1 text-[10px] flex items-center gap-1 ${s.lastResult === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {s.lastResult === 'success' ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {s.lastOutput?.slice(0, 80)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
