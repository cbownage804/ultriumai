import { useState, useEffect } from 'react';
import { X, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ContextualUpgradePromptProps {
  /** What triggered the prompt */
  type: 'credit-warning' | 'feature-gate' | 'usage-limit';
  /** Human-readable message */
  message: string;
  /** CTA label */
  ctaLabel?: string;
  /** Where CTA navigates */
  ctaPath?: string;
  /** Dismissible? */
  dismissible?: boolean;
  /** Custom class */
  className?: string;
}

/**
 * Non-blocking contextual upgrade banner.
 * Use this instead of hard-blocking modals for gentle nudges.
 */
export function ContextualUpgradePrompt({
  type,
  message,
  ctaLabel = 'Upgrade',
  ctaPath = '/pricing/vanguard',
  dismissible = true,
  className,
}: ContextualUpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  const config = {
    'credit-warning': {
      icon: AlertTriangle,
      bg: 'bg-amber-500/10 border-amber-500/30',
      iconColor: 'text-amber-500',
      accent: 'from-amber-500 to-orange-500',
    },
    'feature-gate': {
      icon: Zap,
      bg: 'bg-primary/5 border-primary/30',
      iconColor: 'text-primary',
      accent: 'from-primary to-violet-500',
    },
    'usage-limit': {
      icon: TrendingUp,
      bg: 'bg-cyan-500/10 border-cyan-500/30',
      iconColor: 'text-cyan-500',
      accent: 'from-cyan-500 to-blue-500',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div className={cn(
      'relative flex items-center gap-3 rounded-lg border px-4 py-3 animate-fade-in',
      config.bg,
      className,
    )}>
      <Icon className={cn('h-5 w-5 shrink-0', config.iconColor)} />
      <p className="flex-1 text-sm text-foreground">{message}</p>
      <Button
        size="sm"
        className={cn('shrink-0 bg-gradient-to-r text-white shadow-lg', config.accent)}
        onClick={() => navigate(ctaPath)}
      >
        {ctaLabel}
      </Button>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-foreground/10 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

/**
 * Hook that checks credit usage and returns prompt props if thresholds are hit.
 */
export function useCreditThresholdPrompt(creditsUsed: number, creditsLimit: number) {
  const percentage = creditsLimit > 0 ? (creditsUsed / creditsLimit) * 100 : 0;

  if (percentage >= 100) {
    return {
      show: true,
      props: {
        type: 'credit-warning' as const,
        message: "You've used all your credits. Purchase more to continue using AI features.",
        ctaLabel: 'Buy Credits',
        ctaPath: '/credits',
        dismissible: false,
      },
    };
  }

  if (percentage >= 90) {
    return {
      show: true,
      props: {
        type: 'credit-warning' as const,
        message: `You've used ${Math.round(percentage)}% of your credits. Top up to avoid interruptions.`,
        ctaLabel: 'Buy Credits',
        ctaPath: '/credits',
      },
    };
  }

  if (percentage >= 75) {
    return {
      show: true,
      props: {
        type: 'usage-limit' as const,
        message: `You're at ${Math.round(percentage)}% of your credit limit. Consider upgrading for more capacity.`,
        ctaLabel: 'View Plans',
        ctaPath: '/pricing/ai-studio',
      },
    };
  }

  return { show: false, props: null };
}
