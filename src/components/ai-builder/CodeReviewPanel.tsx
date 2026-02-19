import { X, Shield, Zap, Eye, BookOpen, Wrench, AlertTriangle, CheckCircle2, Info, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodeReviewResult, CodeReviewFinding } from '@/hooks/useAICodeReview';
import { useState } from 'react';

interface CodeReviewPanelProps {
  open: boolean;
  onClose: () => void;
  review: CodeReviewResult | null;
  isReviewing: boolean;
  onRunReview: () => void;
  onGoToFile: (file: string, line?: number) => void;
  onFixWithAI: (finding: CodeReviewFinding) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  security: <Shield className="h-3.5 w-3.5" />,
  performance: <Zap className="h-3.5 w-3.5" />,
  accessibility: <Eye className="h-3.5 w-3.5" />,
  'best-practice': <BookOpen className="h-3.5 w-3.5" />,
  maintainability: <Wrench className="h-3.5 w-3.5" />,
};

const severityIcons: Record<string, React.ReactNode> = {
  error: <AlertTriangle className="h-3 w-3 text-red-400" />,
  warning: <AlertTriangle className="h-3 w-3 text-amber-400" />,
  info: <Info className="h-3 w-3 text-cyan-400" />,
};

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={3} stroke="rgba(255,255,255,0.06)" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={3} stroke={color} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export function CodeReviewPanel({ open, onClose, review, isReviewing, onRunReview, onGoToFile, onFixWithAI }: CodeReviewPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  if (!open) return null;

  const filteredFindings = review?.findings.filter(f => filterSeverity === 'all' || f.severity === filterSeverity) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[560px] max-h-[80vh] bg-[#111113] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-sm font-semibold text-white">AI Code Review</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Security, performance, accessibility, and best practices</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRunReview} disabled={isReviewing} className="px-3 py-1.5 rounded-md bg-violet-500/20 text-violet-300 text-[11px] font-medium hover:bg-violet-500/30 disabled:opacity-30">
              {isReviewing ? 'Reviewing...' : 'Run Review'}
            </button>
            <button onClick={onClose} className="h-6 w-6 rounded flex items-center justify-center text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
          </div>
        </div>

        {review ? (
          <div className="overflow-y-auto max-h-[65vh]">
            {/* Score overview */}
            <div className="p-4 flex items-center gap-6 border-b border-white/[0.06]">
              <ScoreRing score={review.score} size={56} />
              <div className="flex-1">
                <p className="text-[11px] text-white/50">{review.summary}</p>
                <div className="flex items-center gap-3 mt-2">
                  {Object.entries(review.categoryScores).map(([cat, score]) => (
                    <div key={cat} className="flex items-center gap-1">
                      <span className={cn("opacity-50", score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-red-400")}>
                        {categoryIcons[cat]}
                      </span>
                      <span className="text-[10px] text-white/30">{score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Severity filters */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
              {(['all', 'error', 'warning', 'info'] as const).map(s => {
                const count = s === 'all' ? review.findings.length : review.findings.filter(f => f.severity === s).length;
                return (
                  <button key={s} onClick={() => setFilterSeverity(s)} className={cn("px-2 py-1 rounded text-[10px] font-medium transition-colors", filterSeverity === s ? "bg-white/10 text-white" : "text-white/30 hover:text-white/50")}>
                    {s === 'all' ? `All (${count})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${count})`}
                  </button>
                );
              })}
            </div>

            {/* Findings */}
            <div className="p-4 space-y-1.5">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400/30 mx-auto mb-2" />
                  <p className="text-xs text-white/30">No issues found!</p>
                </div>
              ) : (
                filteredFindings.map(finding => (
                  <div key={finding.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors group">
                    {severityIcons[finding.severity]}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-white/70">{finding.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/20">{finding.category}</span>
                      </div>
                      <p className="text-[10px] text-white/30 mt-0.5">{finding.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => onGoToFile(finding.file, finding.line)} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 font-mono">
                          {finding.file}{finding.line ? `:${finding.line}` : ''}
                        </button>
                        <button onClick={() => onFixWithAI(finding)} className="text-[10px] text-violet-400/60 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          Fix with AI →
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-white/20">
            <Shield className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-xs">Click "Run Review" to analyze your code</p>
          </div>
        )}
      </div>
    </div>
  );
}
