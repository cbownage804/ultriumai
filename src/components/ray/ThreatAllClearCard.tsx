/**
 * ThreatAllClearCard — "you're clear" panel for the Threat Center.
 * Shows the sources Ray is actively checking so the empty state feels
 * like real work happened, not a placeholder.
 */
import { ShieldCheck, Check } from 'lucide-react';

const SOURCES = [
  'Microsoft',
  'Google',
  'GitHub',
  'Browser posture',
  'Breach feeds',
];

export function ThreatAllClearCard() {
  return (
    <section className="wrayth-chamfer border border-emerald-500/25 bg-emerald-500/[0.04] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">
            You're clear
          </div>
          <h3 className="mt-1 text-base font-medium text-foreground">
            Ray hasn't detected any active threats affecting your monitored accounts.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">Last checked:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <li
                key={s}
                className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-2.5 py-0.5 text-xs text-emerald-200/90"
              >
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground/80">
            Everything looks good. I'll surface anything new the moment it changes.
          </p>
        </div>
      </div>
    </section>
  );
}

export default ThreatAllClearCard;
