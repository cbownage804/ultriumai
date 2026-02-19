import { X, Activity, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import type { UptimeCheck, UptimeStats } from '@/hooks/useUptimeMonitor';

interface Props {
  open: boolean;
  onClose: () => void;
  checks: UptimeCheck[];
  stats: UptimeStats;
  isMonitoring: boolean;
  url: string;
  onStart: (url: string) => void;
  onStop: () => void;
  publishedUrl: string | null;
}

export function UptimeMonitorPanel({ open, onClose, checks, stats, isMonitoring, url, onStart, onStop, publishedUrl }: Props) {
  if (!open) return null;
  const statusColor = (s: UptimeCheck['status']) => s === 'up' ? 'bg-emerald-400' : s === 'degraded' ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium text-white">Uptime Monitor</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.uptimePercentage}%</div>
              <div className="text-[10px] text-white/30">Uptime</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-cyan-400">{stats.avgResponseTime}ms</div>
              <div className="text-[10px] text-white/30">Avg Response</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-white/70">{stats.totalChecks}</div>
              <div className="text-[10px] text-white/30">Total Checks</div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
              <div className="text-lg font-bold text-red-400">{stats.downtimeMinutes}m</div>
              <div className="text-[10px] text-white/30">Downtime</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {isMonitoring ? (
              <button onClick={onStop} className="px-3 py-1.5 text-xs bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30">Stop Monitoring</button>
            ) : (
              <button onClick={() => onStart(publishedUrl || '')} disabled={!publishedUrl} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 disabled:opacity-30">Start Monitoring</button>
            )}
            {url && <span className="text-[10px] text-white/30 font-mono truncate">{url}</span>}
          </div>

          {/* Recent checks */}
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {checks.slice(0, 20).map(c => (
              <div key={c.id} className="flex items-center gap-2 text-[10px] text-white/40">
                <div className={`h-1.5 w-1.5 rounded-full ${statusColor(c.status)}`} />
                <span className="font-mono">{c.timestamp.toLocaleTimeString()}</span>
                <span>{c.responseTime}ms</span>
                <span className="text-white/20">{c.statusCode || 'ERR'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
