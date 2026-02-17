import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, MessageSquareMore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface QuestionOption {
  label: string;
  description: string;
}

export interface Question {
  id: string;
  question: string;
  header: string;
  options: QuestionOption[];
  multiSelect: boolean;
  allowOther?: boolean;
}

export interface QuestionAnswers {
  [questionId: string]: {
    selected: string[];
    otherText?: string;
  };
}

interface QuestionsCardProps {
  questions: Question[];
  onSubmit: (answers: QuestionAnswers) => void;
  onSkip: () => void;
}

export function QuestionsCard({ questions, onSubmit, onSkip }: QuestionsCardProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswers>(() => {
    const initial: QuestionAnswers = {};
    questions.forEach(q => { initial[q.id] = { selected: [] }; });
    return initial;
  });

  const current = questions[currentIdx];
  if (!current) return null;

  const currentAnswer = answers[current.id] || { selected: [] };
  const isOtherSelected = currentAnswer.selected.includes('__other__');

  const toggleOption = (label: string) => {
    setAnswers(prev => {
      const qa = prev[current.id] || { selected: [] };
      let selected: string[];
      if (current.multiSelect) {
        selected = qa.selected.includes(label)
          ? qa.selected.filter(s => s !== label)
          : [...qa.selected, label];
      } else {
        selected = qa.selected.includes(label) ? [] : [label];
      }
      return { ...prev, [current.id]: { ...qa, selected } };
    });
  };

  const setOtherText = (text: string) => {
    setAnswers(prev => ({
      ...prev,
      [current.id]: { ...prev[current.id], otherText: text },
    }));
  };

  const canGoNext = currentIdx < questions.length - 1;
  const canGoPrev = currentIdx > 0;
  const isLast = currentIdx === questions.length - 1;

  const handleReview = () => {
    // Clean up answers: remove __other__ from selected and merge otherText
    const cleaned: QuestionAnswers = {};
    for (const [qid, qa] of Object.entries(answers)) {
      cleaned[qid] = {
        selected: qa.selected.filter(s => s !== '__other__'),
        otherText: qa.otherText,
      };
      if (qa.selected.includes('__other__') && qa.otherText?.trim()) {
        cleaned[qid].selected.push(qa.otherText.trim());
      }
    }
    onSubmit(cleaned);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.08] bg-[#111118] overflow-hidden shadow-xl shadow-black/30"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
        <MessageSquareMore className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Questions</span>
      </div>

      {/* Question */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className="text-sm font-medium text-foreground leading-snug">{current.question}</p>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
            {current.multiSelect ? 'Select multiple answers' : 'Select one'}
          </span>
        </div>

        {/* Options */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="space-y-2"
          >
            {current.options.map((option) => {
              const isSelected = currentAnswer.selected.includes(option.label);
              return (
                <button
                  key={option.label}
                  onClick={() => toggleOption(option.label)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg border transition-all duration-150',
                    'hover:bg-white/[0.04]',
                    isSelected
                      ? 'border-primary/40 bg-primary/[0.06]'
                      : 'border-white/[0.06] bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-0.5 h-4 w-4 shrink-0 rounded border transition-colors',
                      current.multiSelect ? 'rounded' : 'rounded-full',
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-white/20 bg-transparent'
                    )}>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-full w-full flex items-center justify-center"
                        >
                          <div className={cn(
                            'bg-primary-foreground',
                            current.multiSelect
                              ? 'h-2 w-1 border-r border-b border-primary-foreground rotate-45 -mt-0.5 ml-0.5'
                              : 'h-2 w-2 rounded-full'
                          )} />
                        </motion.div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-foreground' : 'text-foreground/80'
                      )}>
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Other option */}
            {current.allowOther !== false && (
              <div className={cn(
                'w-full px-4 py-3 rounded-lg border transition-all duration-150',
                isOtherSelected
                  ? 'border-primary/40 bg-primary/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02]'
              )}>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleOption('__other__')} className="shrink-0">
                    <div className={cn(
                      'h-4 w-4 rounded border transition-colors',
                      isOtherSelected
                        ? 'bg-primary border-primary'
                        : 'border-white/20 bg-transparent'
                    )}>
                      {isOtherSelected && (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-primary-foreground rounded-full" />
                        </div>
                      )}
                    </div>
                  </button>
                  <Input
                    value={currentAnswer.otherText || ''}
                    onChange={(e) => {
                      setOtherText(e.target.value);
                      if (!isOtherSelected && e.target.value) toggleOption('__other__');
                    }}
                    placeholder="Other"
                    className="h-7 text-sm bg-transparent border-none px-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
            disabled={!canGoPrev}
            className={cn(
              'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
              canGoPrev
                ? 'text-foreground/60 hover:text-foreground hover:bg-white/[0.06]'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
            disabled={!canGoNext}
            className={cn(
              'h-8 w-8 rounded-md flex items-center justify-center transition-colors',
              canGoNext
                ? 'text-foreground/60 hover:text-foreground hover:bg-white/[0.06]'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={isLast ? handleReview : () => setCurrentIdx(i => i + 1)}
            className="text-xs px-4"
          >
            {isLast ? 'Review' : 'Next'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
