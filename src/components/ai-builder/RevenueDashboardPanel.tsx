import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Code, Database, TrendingUp, TrendingDown } from 'lucide-react';
import type { RevenueEntry, RevenueMetric } from '@/hooks/useRevenueDashboard';

interface Props {
  open: boolean;
  onClose: () => void;
  entries: RevenueEntry[];
  dateRange: '7d' | '30d' | '90d' | '1y';
  setDateRange: (r: '7d' | '30d' | '90d' | '1y') => void;
  metrics: RevenueMetric[];
  revenueBySource: { source: string; amount: number }[];
  dailyRevenue: { date: string; amount: number }[];
  seedDemoData: () => void;
  generateDashboardComponent: () => string;
  onInsertCode: (code: string) => void;
}

export function RevenueDashboardPanel({ open, onClose, entries, dateRange, setDateRange, metrics, revenueBySource, dailyRevenue, seedDemoData, generateDashboardComponent, onInsertCode }: Props) {
  const fmt = (v: number, f: string) => f === 'currency' ? '$' + (v / 100).toFixed(2) : f === 'percent' ? v.toFixed(1) + '%' : v.toLocaleString();
  const ranges: ('7d' | '30d' | '90d' | '1y')[] = ['7d', '30d', '90d', '1y'];
  const maxDaily = Math.max(...dailyRevenue.map(d => d.amount), 1);

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-[#0d0d0f] border-white/10 text-white">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-400" /> Revenue Dashboard</DialogTitle></DialogHeader>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {ranges.map(r => (
              <Button key={r} size="sm" variant={dateRange === r ? 'secondary' : 'ghost'} className="h-6 text-[10px] px-2" onClick={() => setDateRange(r)}>{r}</Button>
            ))}
          </div>
          {entries.length === 0 && (
            <Button size="sm" variant="outline" className="border-white/10 text-white h-6 text-[10px]" onClick={seedDemoData}><Database className="h-3 w-3 mr-1" />Load Demo Data</Button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {metrics.map(m => (
            <div key={m.label} className="bg-white/5 rounded-lg p-3">
              <p className="text-[10px] text-white/40">{m.label}</p>
              <p className="text-lg font-bold">{fmt(m.value, m.format)}</p>
              <div className={`flex items-center gap-1 text-[10px] ${m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(m.change).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_180px] gap-4">
          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
            <p className="text-xs text-white/50 mb-3">Daily Revenue</p>
            <div className="flex items-end gap-[2px] h-[140px]">
              {dailyRevenue.slice(-30).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div className="w-full bg-blue-500/70 rounded-t-sm transition-all hover:bg-blue-400" style={{ height: `${(d.amount / maxDaily) * 100}%`, minHeight: d.amount > 0 ? '2px' : '0' }} />
                  <div className="absolute bottom-full mb-1 bg-black/80 text-[9px] px-1 rounded hidden group-hover:block whitespace-nowrap">
                    {d.date}: ${(d.amount / 100).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.02] border border-white/10 rounded-lg p-3">
            <p className="text-xs text-white/50 mb-3">By Source</p>
            <div className="space-y-2">
              {revenueBySource.map(s => {
                const total = revenueBySource.reduce((sum, x) => sum + x.amount, 0);
                const pct = total > 0 ? (s.amount / total) * 100 : 0;
                const colors: Record<string, string> = { subscription: '#3b82f6', one_time: '#22c55e', addon: '#f59e0b', overage: '#ef4444' };
                return (
                  <div key={s.source}>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-white/50">{s.source}</span><span>${(s.amount / 100).toFixed(0)}</span></div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[s.source] || '#6b7280' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-2 border-t border-white/10 pt-3">
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs" onClick={() => onInsertCode(generateDashboardComponent())}><Code className="h-3 w-3 mr-1" />Dashboard Component</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
