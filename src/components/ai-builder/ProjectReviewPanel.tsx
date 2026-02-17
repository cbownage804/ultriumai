import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X, AlertTriangle, AlertCircle, Info, Shield, Zap, Eye, Code,
  Accessibility, Bug, CheckCircle2, Loader2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReviewResult, ReviewFinding } from './useProjectReview';

interface ProjectReviewPanelProps {
  isReviewing: boolean;
  result: ReviewResult | null;
  onClose: () => void;
  onRerun?: () => void;
  onDismiss?: (id: string) => void;
  onGoToFile?: (file: string, line?: number) => void;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  error: { icon: Bug, label: 'Errors', color: 'text-red-400' },
  'best-practice': { icon: Code, label: 'Best Practices', color: 'text-blue-400' },
  'ui-ux': { icon: Eye, label: 'UI/UX', color: 'text-purple-400' },
  performance: { icon: Zap, label: 'Performance', color: 'text-amber-400' },
  security: { icon: Shield, label: 'Security', color: 'text-red-500' },
  accessibility: { icon: Accessibility, label: 'Accessibility', color: 'text-green-400' },
};

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20', badge: 'bg-red-500/20 text-red-300' },
  warning: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/20 text-amber-300' },
  info: { icon: Info, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300' },
};

function FindingCard({ finding, onDismiss, onGoToFile }: { finding: ReviewFinding; onDismiss?: (id: string) => void; onGoToFile?: (file: string, line?: number) => void }) {
  const severity = SEVERITY_CONFIG[finding.severity];
  const category = CATEGORY_CONFIG[finding.category];
  const SeverityIcon = severity.icon;

  return (
    <div className={cn('p-3 rounded-lg border transition-colors', severity.color)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <SeverityIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white/90">{finding.title}</span>
              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', severity.badge)}>
                {finding.severity}
              </Badge>
              {category && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-white/10 text-white/40">
                  {category.label}
                </Badge>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">{finding.description}</p>
            {finding.file && (
              <button
                onClick={() => onGoToFile?.(finding.file!, finding.line)}
                className="text-[11px] text-primary/70 hover:text-primary mt-1 font-mono"
              >
                {finding.file}{finding.line ? `:${finding.line}` : ''}
              </button>
            )}
            {finding.suggestion && (
              <p className="text-xs text-emerald-400/70 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 shrink-0" />
                {finding.suggestion}
              </p>
            )}
          </div>
        </div>
        {onDismiss && (
          <button onClick={() => onDismiss(finding.id)} className="text-white/20 hover:text-white/50 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const bgColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Needs Work' : 'Critical Issues';

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className={cn('text-4xl font-bold', color)}>{score}</div>
      <div className="text-xs text-white/40">{label}</div>
      <div className="w-full max-w-[200px]">
        <Progress value={score} className="h-2" style={{ '--progress-color': bgColor } as any} />
      </div>
    </div>
  );
}

export const ProjectReviewPanel = memo(function ProjectReviewPanel({
  isReviewing,
  result,
  onClose,
  onRerun,
  onDismiss,
  onGoToFile,
}: ProjectReviewPanelProps) {
  const groupedFindings = useMemo(() => {
    if (!result) return {};
    return result.findings.reduce((acc, f) => {
      const key = f.severity;
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {} as Record<string, ReviewFinding[]>);
  }, [result]);

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] border-l border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-white/80">Project Review</span>
          {isReviewing && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/30" />}
        </div>
        <div className="flex items-center gap-1">
          {onRerun && (
            <Button variant="ghost" size="sm" onClick={onRerun} disabled={isReviewing} className="h-7 px-2 text-white/40 hover:text-white/70">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-white/40 hover:text-white/70">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isReviewing && !result && (
            <div className="flex flex-col items-center justify-center py-12 text-white/30">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Reviewing your project...</p>
              <p className="text-xs text-white/20 mt-1">Checking code, best practices, accessibility & more</p>
            </div>
          )}

          {result && (
            <>
              <ScoreGauge score={result.score} />

              {/* Summary */}
              <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <p className="text-sm text-white/60">{result.summary}</p>
                <p className="text-[11px] text-white/20 mt-2">
                  Reviewed at {result.reviewedAt.toLocaleTimeString()}
                </p>
              </div>

              {/* Stats bar */}
              <div className="flex items-center gap-3 text-xs">
                {result.findings.filter(f => f.severity === 'critical').length > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    {result.findings.filter(f => f.severity === 'critical').length} critical
                  </span>
                )}
                {result.findings.filter(f => f.severity === 'warning').length > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="h-3 w-3" />
                    {result.findings.filter(f => f.severity === 'warning').length} warnings
                  </span>
                )}
                {result.findings.filter(f => f.severity === 'info').length > 0 && (
                  <span className="flex items-center gap-1 text-blue-400">
                    <Info className="h-3 w-3" />
                    {result.findings.filter(f => f.severity === 'info').length} info
                  </span>
                )}
                {result.findings.length === 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All checks passed!
                  </span>
                )}
              </div>

              {/* Findings by severity */}
              {(['critical', 'warning', 'info'] as const).map(sev => {
                const items = groupedFindings[sev];
                if (!items?.length) return null;
                return (
                  <div key={sev} className="space-y-2">
                    <h4 className="text-xs font-medium text-white/30 uppercase tracking-wider">
                      {sev === 'critical' ? '🔴 Critical' : sev === 'warning' ? '🟡 Warnings' : '🔵 Info'}
                    </h4>
                    {items.map(f => (
                      <FindingCard key={f.id} finding={f} onDismiss={onDismiss} onGoToFile={onGoToFile} />
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
