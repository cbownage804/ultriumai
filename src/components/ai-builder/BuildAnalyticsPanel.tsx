import { useMemo } from 'react';
import { X, BarChart3, Zap, Clock, CheckCircle, AlertTriangle, FileCode, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { useBuildAnalytics } from '@/hooks/useBuildAnalytics';

interface BuildAnalyticsPanelProps {
  open: boolean;
  onClose: () => void;
  analytics: ReturnType<ReturnType<typeof useBuildAnalytics>['getAnalytics']>;
}

export function BuildAnalyticsPanel({ open, onClose, analytics }: BuildAnalyticsPanelProps) {
  if (!open) return null;

  const maxHourCount = Math.max(1, ...analytics.buildsByHour.map(b => b.count));
  const maxDayCredits = Math.max(1, ...analytics.creditsByDay.map(d => d.credits));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#0d0d14] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0d0d14]/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Build Analytics</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6">
          <KPICard icon={<BarChart3 className="h-4 w-4" />} label="Total Builds" value={analytics.totalBuilds.toString()} color="text-primary" />
          <KPICard icon={<CheckCircle className="h-4 w-4" />} label="Success Rate" value={`${analytics.successRate.toFixed(0)}%`} color={analytics.successRate > 80 ? 'text-emerald-400' : 'text-amber-400'} />
          <KPICard icon={<Clock className="h-4 w-4" />} label="Avg Build Time" value={`${(analytics.avgBuildTime / 1000).toFixed(1)}s`} color="text-sky-400" />
          <KPICard icon={<Zap className="h-4 w-4" />} label="Credits Used" value={analytics.totalCreditsUsed.toString()} color="text-amber-400" />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pb-6">
          <KPICard icon={<FileCode className="h-4 w-4" />} label="Files Generated" value={analytics.totalFilesGenerated.toString()} color="text-violet-400" />
          <KPICard icon={<TrendingUp className="h-4 w-4" />} label="Avg Quality" value={`${analytics.avgValidationScore.toFixed(0)}/100`} color={analytics.avgValidationScore > 75 ? 'text-emerald-400' : 'text-amber-400'} />
          <KPICard icon={<AlertTriangle className="h-4 w-4" />} label="Error Rate" value={`${analytics.errorRate.toFixed(0)}%`} color={analytics.errorRate < 20 ? 'text-emerald-400' : 'text-red-400'} />
          <KPICard icon={<Zap className="h-4 w-4" />} label="Credits/Build" value={analytics.avgCreditsPerBuild.toFixed(1)} color="text-amber-400" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 pb-6">
          {/* Build Activity by Hour */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Build Activity by Hour</h3>
            <div className="flex items-end gap-0.5 h-20">
              {analytics.buildsByHour.map((b) => (
                <div key={b.hour} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t bg-primary/60 transition-all duration-300 min-h-[2px]"
                    style={{ height: `${(b.count / maxHourCount) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/50">12am</span>
              <span className="text-[9px] text-muted-foreground/50">6am</span>
              <span className="text-[9px] text-muted-foreground/50">12pm</span>
              <span className="text-[9px] text-muted-foreground/50">6pm</span>
              <span className="text-[9px] text-muted-foreground/50">11pm</span>
            </div>
          </div>

          {/* Credits by Day */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Daily Credit Usage</h3>
            {analytics.creditsByDay.length > 0 ? (
              <>
                <div className="flex items-end gap-1 h-20">
                  {analytics.creditsByDay.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t bg-amber-400/50 transition-all duration-300 min-h-[2px]"
                        style={{ height: `${(d.credits / maxDayCredits) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground/50">{analytics.creditsByDay[0]?.date.slice(5)}</span>
                  <span className="text-[9px] text-muted-foreground/50">{analytics.creditsByDay[analytics.creditsByDay.length - 1]?.date.slice(5)}</span>
                </div>
              </>
            ) : (
              <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/40">No data yet</div>
            )}
          </div>
        </div>

        {/* Recent Builds */}
        <div className="px-6 pb-6">
          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Recent Builds</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {analytics.recentMetrics.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 text-center py-4">No builds recorded yet</p>
            ) : (
              analytics.recentMetrics.slice(0, 10).map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                  <div className={cn('h-2 w-2 rounded-full shrink-0', m.success ? 'bg-emerald-400' : 'bg-red-400')} />
                  <span className="text-muted-foreground capitalize w-12">{m.type}</span>
                  <span className="text-foreground/60 flex-1">{m.filesGenerated} files</span>
                  <span className="text-muted-foreground/50 font-mono">{(m.durationMs / 1000).toFixed(1)}s</span>
                  <span className="text-amber-400/60 font-mono flex items-center gap-0.5">
                    <Zap className="h-2.5 w-2.5" />{m.creditsUsed}
                  </span>
                  <span className={cn('font-mono', m.validationScore > 75 ? 'text-emerald-400/60' : 'text-amber-400/60')}>
                    {m.validationScore}/100
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn('opacity-60', color)}>{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
    </div>
  );
}
