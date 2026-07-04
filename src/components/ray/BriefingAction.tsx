/**
 * BriefingAction — the pluggable Fix / Investigate primitive used by every
 * Command Center briefing card. Today both variants just route to the module
 * that owns the workflow. When the Remediation Engine ships, Fix will
 * transparently dispatch instead of navigating, without any page changes.
 *
 * Contract for the future engine:
 *   • kind === 'fix'         → attempt in-place dispatch first, fall back to href
 *   • kind === 'investigate' → always navigate to href
 *   • remediationSlug (optional) — future engine keys off this to resolve
 *     the concrete action. Safe to omit today.
 */
import { Link } from 'react-router-dom';
import { ArrowRight, ScanSearch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BriefingActionKind = 'fix' | 'investigate';

export interface BriefingActionProps {
  kind: BriefingActionKind;
  /** Deep link into the existing module workflow. Required today. */
  href: string;
  /** Reserved for the future Remediation Engine. Ignored today. */
  remediationSlug?: string;
  /** Optional context the engine can attach to the action later. */
  context?: Record<string, unknown>;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
  disabled?: boolean;
}

export function BriefingAction({
  kind,
  href,
  label,
  size = 'sm',
  variant = 'outline',
  className,
  disabled,
}: BriefingActionProps) {
  const Icon = kind === 'fix' ? Sparkles : ScanSearch;
  const text = label ?? (kind === 'fix' ? 'Fix' : 'Investigate');

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      disabled={disabled}
      className={cn(
        kind === 'fix' && 'border-violet-400/40 hover:border-violet-400/70 hover:bg-violet-500/10',
        className,
      )}
    >
      <Link to={href} className="inline-flex items-center gap-1.5">
        <Icon
          className={cn(
            'h-3.5 w-3.5',
            kind === 'fix' ? 'text-violet-300' : 'text-muted-foreground',
          )}
        />
        {text}
        <ArrowRight className="h-3 w-3 opacity-60" />
      </Link>
    </Button>
  );
}

export default BriefingAction;
