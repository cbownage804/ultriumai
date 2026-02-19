import { X, BarChart3, Eye, Smartphone, Monitor, Globe } from 'lucide-react';
import type { AnalyticsSummary } from '@/hooks/useBuiltInAnalytics';

interface Props {
  open: boolean;
  onClose: () => void;
  summary: AnalyticsSummary;
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onGenerateScript: () => string;
  onInsertCode: (code: string) => void;
}

export function AnalyticsDashboardPanel({ open, onClose, summary, isTracking, onStartTracking, onStopTracking, onGenerateScript, onInsertCode }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-400" /><span className="text-sm font-medium text-white">Analytics Dashboard</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-cyan-400">{summary.totalViews}</div>
              <div className="text-[10px] text-white/30">Page Views</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-emerald-400">{summary.uniqueVisitors}</div>
              <div className="text-[10px] text-white/30">Unique Visitors</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-violet-400">{summary.topPages.length}</div>
              <div className="text-[10px] text-white/30">Pages Tracked</div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-amber-400">{summary.topReferrers.length}</div>
              <div className="text-[10px] text-white/30">Referrers</div>
            </div>
          </div>

          {summary.topPages.length > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-2">Top Pages</div>
              <div className="space-y-1">
                {summary.topPages.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-white/[0.02] text-xs">
                    <span className="text-white/70">{p.path}</span>
                    <span className="text-cyan-400">{p.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.deviceBreakdown.length > 0 && (
            <div>
              <div className="text-xs text-white/50 mb-2">Devices</div>
              <div className="flex gap-2">
                {summary.deviceBreakdown.map((d, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] text-xs text-white/60">
                    {d.device === 'desktop' ? <Monitor className="h-3 w-3" /> : d.device === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {d.device}: {d.count}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button onClick={isTracking ? onStopTracking : onStartTracking} className={`px-3 py-1.5 text-xs rounded-lg ${isTracking ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
            <button onClick={() => onInsertCode(onGenerateScript())} className="px-3 py-1.5 text-xs bg-white/[0.06] text-white/60 rounded-lg hover:bg-white/[0.1]">
              Insert Tracking Script
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
