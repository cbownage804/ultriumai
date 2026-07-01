/**
 * PasswordProtectionCard — the single, goal-oriented onboarding card
 * shown while the user's vault is empty.
 *
 * Replaces every "set up password monitoring" style CTA. The user's
 * goal is to *protect their passwords*; monitoring, breach detection,
 * and AI guidance flow naturally once credentials are in the vault.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Download, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SOURCES = [
  'Chrome', 'Edge', 'Firefox', 'Bitwarden',
  '1Password', 'LastPass', 'Dashlane', 'Keeper', 'CSV',
];

interface Props {
  compact?: boolean;
}

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
        Wrayth is a complete, zero-knowledge password manager. Bring your
        passwords in and Ray will encrypt them, watch for breaches, and
        surface anything that needs attention — automatically.
      </p>

      <div className="relative mt-5 flex flex-wrap items-center gap-3">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-violet-500 hover:bg-violet-400 text-white border-0"
        >
          <Link to="/app/passwords/import">
            <Download className="mr-2 h-4 w-4" />
            Import passwords
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-full border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]"
        >
          <Link to="/app/passwords?add=1">
            <KeyRound className="mr-2 h-4 w-4" />
            Save your first password
          </Link>
        </Button>
      </div>

      {!compact && (
        <div className="relative mt-5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span className="mr-1 uppercase tracking-[0.18em] text-slate-500">Import from</span>
          {SOURCES.map((s) => (
            <span
              key={s}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export default PasswordProtectionCard;
