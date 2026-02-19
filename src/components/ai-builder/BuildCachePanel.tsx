import { X, Zap, BarChart3 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  stats: { hits: number; misses: number; totalTime: number; cachedFiles: number };
  onInvalidate: () => void;
}

export function BuildCachePanel({ open, onClose, stats, onInvalidate }: Props) {
  if (!open) return null;
  const hitRate = stats.hits + stats.misses > 0 ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) : 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[500px] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-400" /><span className="text-sm font-medium text-white">Build Cache</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-emerald-400">{hitRate}%</div>
              <div className="text-[10px] text-white/30">Hit Rate</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.cachedFiles}</div>
              <div className="text-[10px] text-white/30">Cached</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-white/70">{stats.hits}</div>
              <div className="text-[10px] text-white/30">Hits</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-amber-400">{stats.misses}</div>
              <div className="text-[10px] text-white/30">Misses</div>
            </div>
          </div>
          <div className="text-xs text-white/40">Last compile: {stats.totalTime}ms</div>
          <button onClick={onInvalidate} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30">Clear Cache</button>
        </div>
      </div>
    </div>
  );
}
