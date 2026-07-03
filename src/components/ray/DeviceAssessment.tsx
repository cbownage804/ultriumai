/**
 * DeviceAssessment — Ray's plain-English verdict on one device, shown at
 * the top of the device card. Includes the 1-2 sentence summary and an
 * itemized "why isn't it 100?" score breakdown that expands on demand.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { assessDevice } from '@/lib/ray/deviceAssessment';
import type { DevicePosture } from './DeviceSecurityTabs';

const TONE_STYLES = {
  good: { border: 'border-emerald-500/30', bg: 'from-emerald-500/8 to-transparent', text: 'text-emerald-100', icon: ShieldCheck, iconColor: 'text-emerald-300' },
  warn: { border: 'border-yellow-500/30', bg: 'from-yellow-500/8 to-transparent', text: 'text-yellow-50', icon: ShieldAlert, iconColor: 'text-yellow-300' },
  bad:  { border: 'border-red-500/30', bg: 'from-red-500/10 to-transparent', text: 'text-red-50', icon: ShieldX, iconColor: 'text-red-300' },
  neutral: { border: 'border-border/60', bg: 'from-background/40 to-transparent', text: 'text-foreground/90', icon: Sparkles, iconColor: 'text-violet-300' },
} as const;

export function DeviceAssessment({ posture }: { posture: DevicePosture | null }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const assessment = assessDevice(posture);
  if (!assessment) return null;

  const style = TONE_STYLES[assessment.tone];
  const Icon = style.icon;

  return (
    <div className={`rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} p-3.5`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${style.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80 mb-1">
            Ray's assessment
          </div>
          <div className={`text-sm font-medium ${style.text} leading-snug`}>
            {assessment.headline}
          </div>
          <div className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {assessment.detail}
          </div>
        </div>
        {assessment.score !== null && (
          <div className="shrink-0 text-right">
            <div className={`text-2xl font-semibold tabular-nums ${style.text}`}>
              {assessment.score}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</div>
          </div>
        )}
      </div>

      {assessment.deductions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <button
            onClick={() => setShowBreakdown((v) => !v)}
            className="flex w-full items-center justify-between text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>
              Why isn't it 100? <span className="text-foreground/80">{assessment.deductions.length} item{assessment.deductions.length === 1 ? '' : 's'}</span>
            </span>
            {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <AnimatePresence initial={false}>
            {showBreakdown && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {assessment.deductions
                  .slice()
                  .sort((a, b) => b.points - a.points)
                  .map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="w-9 shrink-0 text-right font-mono tabular-nums text-red-300/90">
                        −{d.points}
                      </span>
                      <span className="flex-1 text-foreground/85">{d.reason}</span>
                      {d.fix && (
                        <span className="text-[10px] italic text-violet-300/80">{d.fix}</span>
                      )}
                    </li>
                  ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/** Small inline one-liner used at the top of each tab. */
export function TabNarrative({ tone, text }: { tone: 'good' | 'warn' | 'bad' | 'neutral'; text: string }) {
  const color =
    tone === 'good' ? 'text-emerald-200/90 border-emerald-500/25 bg-emerald-500/5'
    : tone === 'warn' ? 'text-yellow-100/90 border-yellow-500/25 bg-yellow-500/5'
    : tone === 'bad' ? 'text-red-100/90 border-red-500/25 bg-red-500/5'
    : 'text-muted-foreground border-border/40 bg-background/30';
  return (
    <div className={`rounded-md border px-3 py-2 text-[11px] italic ${color}`}>
      <span className="not-italic mr-1.5 text-[10px] uppercase tracking-wider opacity-70">Ray</span>
      {text}
    </div>
  );
}

export default DeviceAssessment;
