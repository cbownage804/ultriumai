import { useState } from 'react';
import { X, Zap, Activity } from 'lucide-react';
import type { LoadTestConfig, LoadTestResult } from '@/hooks/useLoadTesting';

interface Props {
  open: boolean;
  onClose: () => void;
  results: LoadTestResult[];
  isRunning: boolean;
  onRun: (config: LoadTestConfig) => void;
}

export function LoadTestingPanel({ open, onClose, results, isRunning, onRun }: Props) {
  const [url, setUrl] = useState('https://example.com/api');
  const [users, setUsers] = useState(50);
  const [duration, setDuration] = useState(30);
  const [method, setMethod] = useState<LoadTestConfig['method']>('GET');

  if (!open) return null;
  const latest = results[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-h-[75vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-orange-400" /><span className="text-sm font-semibold text-white">Load Testing</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 py-3 border-b border-white/[0.06] space-y-2">
          <div className="flex gap-2">
            <select value={method} onChange={e => setMethod(e.target.value as LoadTestConfig['method'])} className="bg-white/5 border border-white/10 rounded text-[10px] text-white/60 px-2 py-1">
              <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option><option value="DELETE">DELETE</option>
            </select>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Target URL" className="flex-1 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 px-2 py-1" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1"><span className="text-[9px] text-white/30">Users:</span><input type="number" value={users} onChange={e => setUsers(Number(e.target.value))} className="w-14 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 px-1.5 py-0.5" /></div>
            <div className="flex items-center gap-1"><span className="text-[9px] text-white/30">Duration:</span><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-14 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 px-1.5 py-0.5" /><span className="text-[9px] text-white/30">s</span></div>
            <button onClick={() => onRun({ targetUrl: url, virtualUsers: users, durationSec: duration, rampUpSec: Math.round(duration * 0.2), method })} disabled={isRunning} className="ml-auto px-3 py-1.5 text-[11px] bg-orange-500/20 text-orange-300 rounded-lg hover:bg-orange-500/30 disabled:opacity-40">
              {isRunning ? 'Running...' : 'Start Test'}
            </button>
          </div>
        </div>

        {latest && (
          <div className="px-4 py-3 space-y-3 max-h-[45vh] overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded bg-white/[0.03] text-center"><div className="text-sm font-bold text-white/70">{latest.metrics.totalRequests.toLocaleString()}</div><div className="text-[9px] text-white/30">Requests</div></div>
              <div className="p-2 rounded bg-white/[0.03] text-center"><div className="text-sm font-bold text-cyan-400">{latest.metrics.avgResponseMs}ms</div><div className="text-[9px] text-white/30">Avg Response</div></div>
              <div className="p-2 rounded bg-white/[0.03] text-center"><div className="text-sm font-bold text-violet-400">{latest.metrics.requestsPerSec}</div><div className="text-[9px] text-white/30">Req/s</div></div>
              <div className="p-2 rounded bg-white/[0.03] text-center"><div className="text-sm font-bold text-red-400">{latest.metrics.errorRate}%</div><div className="text-[9px] text-white/30">Error Rate</div></div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-1.5 rounded bg-white/[0.02] text-center"><div className="text-[10px] text-white/50">P50: {latest.metrics.p50Ms}ms</div></div>
              <div className="p-1.5 rounded bg-white/[0.02] text-center"><div className="text-[10px] text-white/50">P95: {latest.metrics.p95Ms}ms</div></div>
              <div className="p-1.5 rounded bg-white/[0.02] text-center"><div className="text-[10px] text-white/50">P99: {latest.metrics.p99Ms}ms</div></div>
            </div>

            {/* Simple ASCII timeline */}
            <div className="p-2 rounded bg-white/[0.02] border border-white/[0.06]">
              <div className="text-[9px] text-white/30 mb-1">Response Time Timeline</div>
              <div className="flex items-end gap-px h-12">
                {latest.timeline.filter((_, i) => i % Math.max(1, Math.floor(latest.timeline.length / 40)) === 0).map((t, i) => (
                  <div key={i} className="flex-1 bg-cyan-500/40 rounded-t" style={{ height: `${Math.min(100, (t.avgMs / latest.metrics.maxMs) * 100)}%` }} title={`${t.second}s: ${t.avgMs}ms`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
