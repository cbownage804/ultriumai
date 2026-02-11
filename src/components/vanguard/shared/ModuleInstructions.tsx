import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, ChevronDown, ChevronUp, Lightbulb, BookOpen, 
  ArrowRight, CheckCircle, Circle, Info 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Module Intro Banner ──────────────────────────────────────
interface ModuleIntroBannerProps {
  title: string;
  description: string;
  features: string[];
  accentColor?: string; // e.g. 'teal', 'orange', 'blue', 'cyan', 'purple'
  docsUrl?: string;
  docsLabel?: string; // custom label for the docs/download link
  dismissible?: boolean;
  storageKey?: string; // localStorage key to persist dismiss
}

const ACCENT_STYLES: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  teal: { border: 'border-teal-500/30', bg: 'bg-teal-500/5', text: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  orange: { border: 'border-orange-500/30', bg: 'bg-orange-500/5', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cyan: { border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/5', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  red: { border: 'border-red-500/30', bg: 'bg-red-500/5', text: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  green: { border: 'border-green-500/30', bg: 'bg-green-500/5', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export function ModuleIntroBanner({
  title,
  description,
  features,
  accentColor = 'cyan',
  docsUrl,
  docsLabel = 'View Documentation',
  dismissible = true,
  storageKey,
}: ModuleIntroBannerProps) {
  const key = storageKey || `module-intro-${title.toLowerCase().replace(/\s/g, '-')}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(key) === 'dismissed'; } catch { return false; }
  });

  if (dismissed) return null;

  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.cyan;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(key, 'dismissed'); } catch {}
  };

  return (
    <Card className={cn('relative', styles.border, styles.bg)}>
      <CardContent className="py-4 pr-10">
        <div className="flex items-start gap-3">
          <Info className={cn('h-5 w-5 mt-0.5 flex-shrink-0', styles.text)} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <Badge className={cn('text-xs', styles.badge)}>Guide</Badge>
            </div>
            <p className="text-sm text-white/60 mb-3">{description}</p>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs text-white/50 bg-white/5 rounded-full px-2.5 py-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {feature}
                </span>
              ))}
            </div>
            {docsUrl && (
              <Button variant="link" size="sm" className={cn('mt-2 p-0 h-auto', styles.text)} asChild>
                <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {docsLabel}
                </a>
              </Button>
            )}
          </div>
        </div>
        {dismissible && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-white/30 hover:text-white/60"
            onClick={handleDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Getting Started Steps ────────────────────────────────────
interface GettingStartedStep {
  title: string;
  description: string;
  completed?: boolean;
  action?: { label: string; onClick: () => void };
}

interface ModuleGettingStartedProps {
  moduleName: string;
  steps: GettingStartedStep[];
  accentColor?: string;
  onDismiss?: () => void;
}

export function ModuleGettingStarted({ moduleName, steps, accentColor = 'cyan', onDismiss }: ModuleGettingStartedProps) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = steps.filter(s => s.completed).length;
  const allDone = completedCount === steps.length;
  const styles = ACCENT_STYLES[accentColor] || ACCENT_STYLES.cyan;

  if (allDone && onDismiss) return null;

  return (
    <Card className={cn(styles.border, styles.bg)}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className={cn('h-5 w-5', styles.text)} />
            <h3 className="font-semibold text-white text-sm">Getting Started with {moduleName}</h3>
            <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
              {completedCount}/{steps.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-3 ml-7">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-white/20 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', step.completed ? 'text-white/40 line-through' : 'text-white')}>
                    {step.title}
                  </p>
                  <p className="text-xs text-white/40">{step.description}</p>
                  {step.action && !step.completed && (
                    <Button variant="link" size="sm" className={cn('p-0 h-auto mt-1 text-xs', styles.text)} onClick={step.action.onClick}>
                      {step.action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tooltip Help ─────────────────────────────────────────────
interface InlineHelpProps {
  text: string;
  className?: string;
  /** If provided, shows the icon inline with this label, and text as hover tooltip */
  label?: string;
}

export function InlineHelp({ text, className, label }: InlineHelpProps) {
  if (label) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help', className)}>
              {label}
              <Info className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[240px] text-xs">
            {text}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help', className)}>
            <Info className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px] text-xs">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
