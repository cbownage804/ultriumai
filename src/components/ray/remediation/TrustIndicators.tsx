/**
 * TrustIndicators — a compact strip shown on every remediation card and
 * timeline row. Ray's honesty layer: source, confidence, risk, rollback.
 */
import { ShieldCheck, RotateCw, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Remediation } from '@/lib/ray/remediations/types';

interface Props {
  remediation: Remediation;
  confidence?: number | null;
  className?: string;
}

export function TrustIndicators({ remediation: r, confidence, className }: Props) {
  const conf = confidence ?? r.confidenceHint;
  const riskClass =
    r.risk === 'high'
      ? 'text-red-300'
      : r.risk === 'medium'
        ? 'text-amber-200'
        : 'text-emerald-200';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground',
        className,
      )}
    >
      {conf != null && (
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-violet-300" />
          <span className="text-foreground/80">Confidence</span>
          <span className="text-foreground">{Math.round(conf)}%</span>
        </span>
      )}
      {r.sourceLabel && (
        <span className="inline-flex items-center gap-1">
          <Radio className="h-3 w-3 text-blue-300" />
          <span className="text-foreground/80">Source</span>
          <span className="text-foreground">{r.sourceLabel}</span>
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <span className="text-foreground/80">Risk</span>
        <span className={cn('uppercase font-medium', riskClass)}>{r.risk}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <RotateCw className={cn('h-3 w-3', r.reversible ? 'text-emerald-300' : 'text-muted-foreground')} />
        <span className="text-foreground/80">Rollback</span>
        <span className={cn(r.reversible ? 'text-emerald-200' : 'text-muted-foreground')}>
          {r.reversible ? 'Yes' : 'No'}
        </span>
      </span>
    </div>
  );
}
