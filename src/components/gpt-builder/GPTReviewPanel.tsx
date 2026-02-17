import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  X, AlertTriangle, AlertCircle, Info, Shield, CheckCircle2, Loader2, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GPTReviewFinding {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  suggestion?: string;
}

interface GPTReviewResult {
  score: number;
  findings: GPTReviewFinding[];
  summary: string;
}

interface GPTReviewPanelProps {
  open: boolean;
  onClose: () => void;
  config: any;
}

export function GPTReviewPanel({ open, onClose, config }: GPTReviewPanelProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<GPTReviewResult | null>(null);

  const runReview = useCallback(() => {
    setIsReviewing(true);
    const findings: GPTReviewFinding[] = [];
    let id = 0;
    const mkId = () => `gf-${++id}`;

    // Check system prompt
    if (!config.system_prompt || config.system_prompt.length < 20) {
      findings.push({ id: mkId(), severity: 'critical', title: 'Weak system prompt', description: 'System prompt is missing or too short to guide the AI effectively', suggestion: 'Add a detailed system prompt with role, tone, and behavior guidelines' });
    } else if (config.system_prompt.length < 100) {
      findings.push({ id: mkId(), severity: 'warning', title: 'Short system prompt', description: 'Consider adding more detail to improve response quality', suggestion: 'Include examples, constraints, and personality guidelines' });
    }

    // Check name
    if (!config.name || config.name.length < 3) {
      findings.push({ id: mkId(), severity: 'critical', title: 'Missing name', description: 'Your GPT needs a clear, descriptive name', suggestion: 'Add a name that describes what the GPT does' });
    }

    // Check description
    if (!config.description) {
      findings.push({ id: mkId(), severity: 'warning', title: 'No description', description: 'A description helps users understand what your GPT does', suggestion: 'Add a 1-2 sentence description' });
    }

    // Check starter questions
    if (!config.starter_questions || config.starter_questions.filter((q: string) => q.trim()).length === 0) {
      findings.push({ id: mkId(), severity: 'warning', title: 'No starter questions', description: 'Starter questions help users get started quickly', suggestion: 'Add 3-4 example questions users can click to try' });
    }

    // Check avatar
    if (!config.avatar_url) {
      findings.push({ id: mkId(), severity: 'info', title: 'No avatar', description: 'A custom avatar makes your GPT more recognizable', suggestion: 'Upload a custom avatar image' });
    }

    // Check placeholder prompt
    if (!config.placeholder_prompt) {
      findings.push({ id: mkId(), severity: 'info', title: 'Default placeholder', description: 'Custom placeholder text guides user input', suggestion: 'Set a descriptive placeholder like "Ask me about..."' });
    }

    // Check for potential prompt injection vulnerabilities
    if (config.system_prompt && !/ignore|override|disregard/i.test(config.system_prompt)) {
      // Good - no anti-pattern
    } else if (config.system_prompt) {
      findings.push({ id: mkId(), severity: 'warning', title: 'Prompt injection risk', description: 'System prompt mentions "ignore/override/disregard" which may confuse the AI', suggestion: 'Use positive framing instead of telling the AI what NOT to do' });
    }

    // Score
    const critical = findings.filter(f => f.severity === 'critical').length;
    const warnings = findings.filter(f => f.severity === 'warning').length;
    const score = Math.max(0, Math.min(100, 100 - (critical * 25) - (warnings * 10) - (findings.filter(f => f.severity === 'info').length * 2)));

    const summary = findings.length === 0
      ? '✅ Your GPT configuration looks great! Ready to ship.'
      : `Found ${findings.length} item(s) to improve. Health: ${score}/100.`;

    setResult({ score, findings, summary });
    setIsReviewing(false);
  }, [config]);

  // Auto-run on open
  const hasRun = useState(false);
  if (open && !result && !isReviewing && !hasRun[0]) {
    hasRun[1](true);
    setTimeout(runReview, 100);
  }
  if (!open && hasRun[0]) hasRun[1](false);

  const severityConfig = {
    critical: { icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20', badge: 'bg-red-500/20 text-red-300' },
    warning: { icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', badge: 'bg-amber-500/20 text-amber-300' },
    info: { icon: Info, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300' },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setResult(null); } }}>
      <DialogContent className="bg-[#0c0c0e] border-white/[0.08] text-white max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Shield className="h-5 w-5 text-primary" />
            GPT Review
            {result && (
              <Button variant="ghost" size="sm" onClick={runReview} className="ml-auto h-7 px-2 text-white/40">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {isReviewing && (
              <div className="flex flex-col items-center py-8 text-white/30">
                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                <p className="text-sm">Reviewing configuration...</p>
              </div>
            )}

            {result && (
              <>
                {/* Score */}
                <div className="flex flex-col items-center gap-1 py-3">
                  <div className={cn('text-3xl font-bold', result.score >= 80 ? 'text-emerald-400' : result.score >= 60 ? 'text-amber-400' : 'text-red-400')}>
                    {result.score}
                  </div>
                  <div className="text-xs text-white/40">
                    {result.score >= 80 ? 'Ready to ship' : result.score >= 60 ? 'Needs improvement' : 'Critical issues'}
                  </div>
                  <Progress value={result.score} className="h-1.5 w-40 mt-1" />
                </div>

                <p className="text-sm text-white/50 text-center">{result.summary}</p>

                {/* Findings */}
                {result.findings.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-emerald-400 text-sm">
                    <CheckCircle2 className="h-4 w-4" /> All checks passed!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {result.findings.map(f => {
                      const sev = severityConfig[f.severity];
                      const Icon = sev.icon;
                      return (
                        <div key={f.id} className={cn('p-3 rounded-lg border', sev.color)}>
                          <div className="flex items-start gap-2">
                            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white/90">{f.title}</span>
                                <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 border-0', sev.badge)}>
                                  {f.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-white/50 mt-1">{f.description}</p>
                              {f.suggestion && (
                                <p className="text-xs text-emerald-400/70 mt-1.5 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                  {f.suggestion}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
