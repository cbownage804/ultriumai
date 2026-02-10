import { GPTConfig } from '@/types/gptConfig';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText, MessageCircle, BookOpen, Zap, Palette, Globe, Brain, Target
} from 'lucide-react';

interface GPTConfigIndicatorsProps {
  config: GPTConfig;
}

interface IndicatorDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  check: (c: GPTConfig) => boolean;
  detail: (c: GPTConfig) => string;
}

const INDICATORS: IndicatorDef[] = [
  {
    id: 'prompt',
    label: 'System Prompt',
    icon: <FileText className="h-3 w-3" />,
    check: c => c.system_prompt.length > 20,
    detail: c => c.system_prompt ? `${c.system_prompt.length} chars` : 'Not set',
  },
  {
    id: 'identity',
    label: 'Name & Description',
    icon: <Target className="h-3 w-3" />,
    check: c => !!c.name && !!c.description,
    detail: c => c.name || 'Not set',
  },
  {
    id: 'welcome',
    label: 'Welcome & Starters',
    icon: <MessageCircle className="h-3 w-3" />,
    check: c => !!c.welcome_message || c.starter_questions.length > 0,
    detail: c => {
      const parts: string[] = [];
      if (c.welcome_message) parts.push('Welcome msg');
      if (c.starter_questions.length) parts.push(`${c.starter_questions.length} starters`);
      return parts.length ? parts.join(' + ') : 'None';
    },
  },
  {
    id: 'knowledge',
    label: 'Knowledge Sources',
    icon: <BookOpen className="h-3 w-3" />,
    check: c => c.knowledge_sources.length > 0,
    detail: c => c.knowledge_sources.length ? `${c.knowledge_sources.length} sources` : 'None',
  },
  {
    id: 'actions',
    label: 'Actions & Tools',
    icon: <Zap className="h-3 w-3" />,
    check: c => c.actions.some(a => a.enabled) || c.enable_web_search,
    detail: c => {
      const count = c.actions.filter(a => a.enabled).length + (c.enable_web_search ? 1 : 0);
      return count ? `${count} active` : 'None';
    },
  },
  {
    id: 'model',
    label: 'AI Model',
    icon: <Brain className="h-3 w-3" />,
    check: c => !!c.preferred_model,
    detail: c => {
      const name = c.preferred_model.split('/').pop() || c.preferred_model;
      return name.replace(/-/g, ' ').replace(/preview/i, '').trim();
    },
  },
];

export function GPTConfigIndicators({ config }: GPTConfigIndicatorsProps) {
  const completedCount = INDICATORS.filter(i => i.check(config)).length;

  return (
    <div className="flex items-center gap-1">
      {INDICATORS.map((ind, i) => {
        const active = ind.check(config);
        return (
          <Tooltip key={ind.id}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  'h-5 w-5 rounded-md flex items-center justify-center transition-all',
                  active
                    ? 'bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/20'
                    : 'bg-white/[0.03] text-white/15 border border-white/[0.04]'
                )}
              >
                {ind.icon}
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  active ? 'bg-emerald-400' : 'bg-white/20'
                )} />
                <span className="font-medium">{ind.label}</span>
              </div>
              <p className="text-white/50 mt-0.5">{ind.detail(config)}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      <span className="text-[10px] text-white/20 ml-1 tabular-nums">
        {completedCount}/{INDICATORS.length}
      </span>
    </div>
  );
}
