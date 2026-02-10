import { useMemo } from 'react';
import { GPTConfig } from '@/types/gptConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Sparkles, AlertTriangle, CheckCircle2, Info,
  Target, MessageCircle, Shield, Zap
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GPTPromptScorerProps {
  config: GPTConfig;
}

interface ScoreCriterion {
  id: string;
  label: string;
  icon: React.ReactNode;
  check: (config: GPTConfig) => { score: number; tip: string };
  weight: number;
}

const CRITERIA: ScoreCriterion[] = [
  {
    id: 'length',
    label: 'Detail',
    icon: <Target className="h-3 w-3" />,
    weight: 25,
    check: (c) => {
      const len = c.system_prompt.length;
      if (len === 0) return { score: 0, tip: 'Add a system prompt to define behavior' };
      if (len < 50) return { score: 20, tip: 'Very short — add more detail about role, tone, and boundaries' };
      if (len < 150) return { score: 50, tip: 'Good start — consider adding examples and edge cases' };
      if (len < 400) return { score: 80, tip: 'Solid detail level' };
      return { score: 100, tip: 'Comprehensive prompt ✓' };
    },
  },
  {
    id: 'identity',
    label: 'Identity',
    icon: <MessageCircle className="h-3 w-3" />,
    weight: 25,
    check: (c) => {
      let score = 0;
      const tips: string[] = [];
      if (c.name) score += 30; else tips.push('name');
      if (c.description) score += 20; else tips.push('description');
      if (c.welcome_message) score += 25; else tips.push('welcome message');
      if (c.communication_style) score += 25; else tips.push('communication style');
      if (tips.length === 0) return { score: 100, tip: 'Full identity configured ✓' };
      return { score, tip: `Add ${tips.join(', ')}` };
    },
  },
  {
    id: 'guardrails',
    label: 'Guardrails',
    icon: <Shield className="h-3 w-3" />,
    weight: 25,
    check: (c) => {
      const prompt = c.system_prompt.toLowerCase();
      let score = 0;
      const tips: string[] = [];
      const hasNegation = /don't|do not|never|avoid|refuse|must not/i.test(prompt);
      const hasBoundary = /only|limited to|scope|boundary|stay within/i.test(prompt);
      const hasEscalation = /escalate|human|support team|redirect|transfer/i.test(prompt);
      const hasTone = /tone|voice|style|manner|professional|friendly|formal/i.test(prompt);
      if (hasNegation) score += 25; else tips.push('negative boundaries (what NOT to do)');
      if (hasBoundary) score += 25; else tips.push('scope limitations');
      if (hasEscalation) score += 25; else tips.push('escalation paths');
      if (hasTone) score += 25; else tips.push('tone/voice guidance');
      if (tips.length === 0) return { score: 100, tip: 'Strong guardrails ✓' };
      return { score, tip: `Consider adding: ${tips.slice(0, 2).join(', ')}` };
    },
  },
  {
    id: 'engagement',
    label: 'Engagement',
    icon: <Zap className="h-3 w-3" />,
    weight: 25,
    check: (c) => {
      let score = 0;
      const tips: string[] = [];
      if (c.starter_questions.length >= 2) score += 40;
      else if (c.starter_questions.length >= 1) score += 20;
      else tips.push('starter questions');
      if (c.avatar_url) score += 20; else tips.push('avatar');
      if (c.theme_color && c.theme_color !== '#6366f1') score += 20; else tips.push('custom theme color');
      if (c.enable_web_search || c.actions.some(a => a.enabled)) score += 20; else tips.push('actions/tools');
      if (tips.length === 0) return { score: 100, tip: 'Highly engaging setup ✓' };
      return { score, tip: `Add ${tips.slice(0, 2).join(', ')}` };
    },
  },
];

function getGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-400' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-400' };
  if (score >= 45) return { label: 'Fair', color: 'text-amber-400', bg: 'bg-amber-400' };
  if (score >= 20) return { label: 'Needs Work', color: 'text-orange-400', bg: 'bg-orange-400' };
  return { label: 'Not Started', color: 'text-white/30', bg: 'bg-white/20' };
}

export function GPTPromptScorer({ config }: GPTPromptScorerProps) {
  const results = useMemo(() => {
    return CRITERIA.map(c => ({
      ...c,
      result: c.check(config),
    }));
  }, [config]);

  const totalScore = useMemo(() => {
    return Math.round(
      results.reduce((sum, r) => sum + (r.result.score * r.weight) / 100, 0)
    );
  }, [results]);

  const grade = getGrade(totalScore);

  // Find the lowest-scoring criterion for the top tip
  const weakest = results.reduce((min, r) => r.result.score < min.result.score ? r : min, results[0]);

  return (
    <div className="space-y-3">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-white/30" />
          <span className="text-[11px] uppercase tracking-wider text-white/30 font-medium">Prompt Score</span>
        </div>
        <motion.div
          key={totalScore}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn('text-lg font-bold tabular-nums', grade.color)}
        >
          {totalScore}
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', grade.bg)}
          initial={{ width: 0 }}
          animate={{ width: `${totalScore}%` }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        />
      </div>

      {/* Grade Label */}
      <div className="flex items-center justify-between">
        <span className={cn('text-[10px] font-medium', grade.color)}>{grade.label}</span>
        <span className="text-[10px] text-white/20">{totalScore}/100</span>
      </div>

      {/* Criteria Breakdown */}
      <div className="grid grid-cols-2 gap-1.5">
        {results.map(r => (
          <Tooltip key={r.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors cursor-default',
                  r.result.score >= 80
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : r.result.score >= 45
                    ? 'border-amber-500/15 bg-amber-500/5'
                    : 'border-white/[0.06] bg-white/[0.02]'
                )}
              >
                <span className={cn(
                  'shrink-0',
                  r.result.score >= 80 ? 'text-emerald-400/60' : r.result.score >= 45 ? 'text-amber-400/60' : 'text-white/20'
                )}>
                  {r.icon}
                </span>
                <span className="text-[10px] text-white/50 truncate">{r.label}</span>
                <span className={cn(
                  'text-[10px] font-medium ml-auto tabular-nums',
                  r.result.score >= 80 ? 'text-emerald-400/70' : r.result.score >= 45 ? 'text-amber-400/70' : 'text-white/25'
                )}>
                  {r.result.score}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[11px] max-w-[200px]">
              {r.result.tip}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Top Tip */}
      <AnimatePresence mode="wait">
        {totalScore < 90 && weakest.result.score < 80 && (
          <motion.div
            key={weakest.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]"
          >
            <Info className="h-3 w-3 text-blue-400/60 shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/40 leading-relaxed">
              <span className="text-white/60 font-medium">Tip:</span> {weakest.result.tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
