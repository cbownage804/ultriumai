import { useCompileTelemetry, type CompileTelemetrySummary } from '@/hooks/useCompileTelemetry';
import { useBuildAnalytics } from '@/hooks/useBuildAnalytics';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Activity, RefreshCw, Trash2, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

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
            icon={<AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
            label="Worker Fallback"
            value={`${(summary?.workerFallbackRate ?? 0).toFixed(0)}%`}
          />
        </div>

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
