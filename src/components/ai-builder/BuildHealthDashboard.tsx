import { useCompileTelemetry, type CompileTelemetrySummary } from '@/hooks/useCompileTelemetry';
import { useBuildAnalytics } from '@/hooks/useBuildAnalytics';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Activity, RefreshCw, Trash2, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface BuildHealthDashboardProps {
  onClose: () => void;
}

export function BuildHealthDashboard({ onClose }: BuildHealthDashboardProps) {
  const { getSummary, clearTelemetry } = useCompileTelemetry();
  const { getAnalytics, clearAnalytics } = useBuildAnalytics();
  const [summary, setSummary] = useState<CompileTelemetrySummary | null>(null);
  const [analytics, setAnalytics] = useState<ReturnType<typeof getAnalytics> | null>(null);

  useEffect(() => {
    setSummary(getSummary());
    setAnalytics(getAnalytics());
  }, [getSummary, getAnalytics]);

  const refresh = () => {
    setSummary(getSummary());
    setAnalytics(getAnalytics());
  };

  const handleClear = () => {
    clearTelemetry();
    clearAnalytics();
    refresh();
  };

  const successRate = summary?.successRate ?? 100;
  const rateColor = successRate >= 90 ? 'text-green-400' : successRate >= 70 ? 'text-yellow-400' : 'text-red-400';
  const rateBarClass = successRate >= 90 ? '' : successRate >= 70 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500';

  // Step 14: Compute timing breakdown and trend from last10
  const timingBreakdown = useMemo(() => {
    if (!summary || summary.last10.length === 0) return null;
    const entries = summary.last10;
    const fastest = Math.min(...entries.map(e => e.durationMs));
    const slowest = Math.max(...entries.map(e => e.durationMs));
    const median = [...entries].sort((a, b) => a.durationMs - b.durationMs)[Math.floor(entries.length / 2)]?.durationMs ?? 0;
    // Trend: compare first half vs second half avg
    const half = Math.floor(entries.length / 2);
    const firstHalf = entries.slice(0, half);
    const secondHalf = entries.slice(half);
    const firstAvg = firstHalf.reduce((s, e) => s + e.durationMs, 0) / (firstHalf.length || 1);
    const secondAvg = secondHalf.reduce((s, e) => s + e.durationMs, 0) / (secondHalf.length || 1);
    const trend = secondAvg < firstAvg ? 'improving' : secondAvg > firstAvg * 1.2 ? 'degrading' : 'stable';
    return { fastest, slowest, median, trend, firstAvg, secondAvg };
  }, [summary]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Build Health</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={refresh} className="h-7 w-7">
            <RefreshCw className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Success Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Compile Success Rate</span>
            <span className={`text-lg font-bold ${rateColor}`}>{successRate.toFixed(0)}%</span>
          </div>
          <Progress value={successRate} className={rateBarClass} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            label="Total Compiles"
            value={summary?.totalCompiles ?? 0}
          />
          <StatCard
            icon={<Clock className="w-3.5 h-3.5 text-blue-400" />}
            label="Avg Duration"
            value={`${((summary?.avgDurationMs ?? 0) / 1000).toFixed(1)}s`}
          />
          <StatCard
            icon={<Activity className="w-3.5 h-3.5 text-purple-400" />}
            label="Vite Success"
            value={`${(summary?.viteSuccessRate ?? 100).toFixed(0)}%`}
          />
          <StatCard
            icon={<CheckCircle className="w-3.5 h-3.5 text-green-400" />}
            label="Vite Only"
            value="✓"
          />
        </div>

        {/* Step 14: Timing Breakdown */}
        {timingBreakdown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timing Breakdown</h3>
              <div className="flex items-center gap-1">
                {timingBreakdown.trend === 'improving' ? (
                  <TrendingDown className="w-3 h-3 text-green-400" />
                ) : timingBreakdown.trend === 'degrading' ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : (
                  <Activity className="w-3 h-3 text-muted-foreground" />
                )}
                <span className={`text-[10px] capitalize ${
                  timingBreakdown.trend === 'improving' ? 'text-green-400' :
                  timingBreakdown.trend === 'degrading' ? 'text-red-400' : 'text-muted-foreground'
                }`}>{timingBreakdown.trend}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Fastest</p>
                <p className="text-xs font-semibold text-green-400">{(timingBreakdown.fastest / 1000).toFixed(1)}s</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Median</p>
                <p className="text-xs font-semibold text-foreground">{(timingBreakdown.median / 1000).toFixed(1)}s</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2 text-center">
                <p className="text-[9px] text-muted-foreground">Slowest</p>
                <p className="text-xs font-semibold text-red-400">{(timingBreakdown.slowest / 1000).toFixed(1)}s</p>
              </div>
            </div>
            {/* Mini bar chart of last 10 builds */}
            <div className="flex items-end gap-0.5 h-12 px-1">
              {(summary?.last10 ?? []).slice().reverse().map((entry, i) => {
                const maxDur = timingBreakdown.slowest || 1;
                const pct = Math.max((entry.durationMs / maxDur) * 100, 5);
                return (
                  <div key={entry.id} className="flex-1 flex flex-col items-center gap-0.5">
                    <div
                      className={`w-full rounded-t transition-all ${
                        entry.success ? 'bg-emerald-500/60' : 'bg-red-500/60'
                      }`}
                      style={{ height: `${pct}%` }}
                      title={`${(entry.durationMs / 1000).toFixed(1)}s — ${entry.success ? 'OK' : 'FAIL'}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Build Analytics */}
        {analytics && analytics.totalBuilds > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Build Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={<CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                label="Build Success"
                value={`${analytics.successRate.toFixed(0)}%`}
              />
              <StatCard
                icon={<Clock className="w-3.5 h-3.5 text-blue-400" />}
                label="Avg Build Time"
                value={`${(analytics.avgBuildTime / 1000).toFixed(1)}s`}
              />
              <StatCard
                icon={<XCircle className="w-3.5 h-3.5 text-red-400" />}
                label="Error Rate"
                value={`${analytics.errorRate.toFixed(0)}%`}
              />
              <StatCard
                icon={<Activity className="w-3.5 h-3.5 text-purple-400" />}
                label="Total Files"
                value={analytics.totalFilesGenerated}
              />
            </div>
          </div>
        )}

        {/* Top Failure Reasons */}
        {summary && summary.topFailureReasons.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Failure Reasons</h3>
            <div className="space-y-1.5">
              {summary.topFailureReasons.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-1.5">
                  <span className="text-xs text-foreground capitalize">{r.reason}</span>
                  <span className="text-xs text-muted-foreground">{r.count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Compiles */}
        {summary && summary.last10.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Compiles</h3>
            <div className="space-y-1">
              {summary.last10.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between bg-muted/30 rounded px-2.5 py-1.5 text-[11px]"
                >
                  <div className="flex items-center gap-1.5">
                    {entry.success ? (
                      <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                    )}
                    <span className="text-foreground font-mono">{entry.tier}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{entry.fileCount} files</span>
                    <span>{(entry.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!summary || summary.totalCompiles === 0) && (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No compile data yet</p>
            <p className="text-xs text-muted-foreground/60">Build a project to see metrics</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={handleClear}
          disabled={!summary || summary.totalCompiles === 0}
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Clear Telemetry
        </Button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
