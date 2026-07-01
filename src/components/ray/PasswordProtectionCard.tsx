/**
 * PasswordProtectionCard — the single, goal-oriented onboarding card
 * shown while the user's vault is empty.
 *
 * Replaces every "set up password monitoring" style CTA. The user's
 * goal is to *protect their passwords*; monitoring, breach detection,
 * and AI guidance flow naturally once credentials are in the vault.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Chrome, FileText, KeyRound, Loader2, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  compact?: boolean;
}

const IMPORT_SOURCES: { label: string; to: string; Icon: typeof Chrome }[] = [
  { label: 'Import from Chrome', to: '/app/passwords/import?source=chrome', Icon: Chrome },
  { label: 'Import from Bitwarden', to: '/app/passwords/import?source=bitwarden', Icon: Wallet },
  { label: 'Import CSV', to: '/app/passwords/import?source=csv', Icon: FileText },
];

export function PasswordProtectionCard({ compact = false }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
      />
      <div className="relative flex items-center gap-2 text-violet-300/90 text-[11px] uppercase tracking-[0.18em]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Start here
      </div>
      <h2 className="relative mt-2 text-2xl sm:text-3xl font-semibold text-white tracking-tight">
        Protect your passwords with Wrayth
      </h2>
      <p className="relative mt-2 max-w-2xl text-sm text-slate-300">
        Store your passwords here so I can automatically detect breaches,
        weak passwords, reused passwords, and help secure every account.
      </p>

      {!compact && (
        <div className="relative mt-5 grid gap-2 sm:grid-cols-3">
          {IMPORT_SOURCES.map(({ label, to, Icon }) => (
            <Button
              key={label}
              asChild
              variant="outline"
              className="justify-start rounded-xl border-white/10 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08] h-11"
            >
              <Link to={to}>
                <Icon className="mr-2 h-4 w-4 text-violet-300" />
                {label}
              </Link>
            </Button>
          ))}
        </div>
      )}

      <div className="relative mt-4 flex flex-wrap items-center gap-3">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-violet-500 hover:bg-violet-400 text-white border-0"
        >
          <Link to="/app/passwords?add=1">
            <KeyRound className="mr-2 h-4 w-4" />
            Save first password
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </motion.section>
  );
}

/**
 * PasswordHealthyCard — the calm "nothing to do" state. Replaces
 * onboarding entirely once the vault is analyzed and clean.
 */
export function PasswordHealthyCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.03] p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 text-emerald-300/90 text-[11px] uppercase tracking-[0.18em]">
        <ShieldCheck className="h-3.5 w-3.5" />
        Vault healthy
      </div>
      <p className="mt-2 text-base sm:text-lg font-light text-foreground">
        Your passwords are protected.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        I'll notify you whenever something changes.
      </p>
    </motion.section>
  );
}

/**
 * PasswordAnalyzingCard — a *transient* status shown for a few seconds
 * after import, then it self-dismisses. We never leave a permanent
 * "analyzing" banner sitting on Home — that starts to feel like fake
 * activity. Sequence: analyzing (3.5s) → finished (2.5s) → hidden.
 */
export function PasswordAnalyzingCard({ count }: { count: number }) {
  const [phase, setPhase] = useState<'analyzing' | 'finished' | 'gone'>('analyzing');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('finished'), 3500);
    const t2 = setTimeout(() => setPhase('gone'), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (phase === 'gone') return null;

  const isDone = phase === 'finished';
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.4 }}
      className={
        'relative overflow-hidden rounded-2xl border p-5 sm:p-6 ' +
        (isDone
          ? 'border-emerald-400/15 bg-emerald-500/[0.03]'
          : 'border-violet-400/15 bg-violet-500/[0.04]')
      }
    >
      <div
        className={
          'flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] ' +
          (isDone ? 'text-emerald-300/90' : 'text-violet-300/90')
        }
      >
        {isDone ? <ShieldCheck className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isDone ? 'Review complete' : 'Analyzing'}
      </div>
      <p className="mt-2 text-base sm:text-lg font-light text-foreground">
        {isDone
          ? 'Ray finished reviewing your passwords.'
          : `Reviewing ${count.toLocaleString()} ${count === 1 ? 'password' : 'passwords'}.`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isDone
          ? 'Everything looks healthy.'
          : "I'm checking for breaches, weak passwords, and reuse."}
      </p>
    </motion.section>
  );
}

export default PasswordProtectionCard;
