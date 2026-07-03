/**
 * RayThinking — the "actually investigating" affordance shown while Ray is
 * computing an answer. Instead of a bare spinner, we reveal 2-4 short
 * reasoning steps chosen from the user's own message so it feels like Ray
 * is examining the right thing.
 *
 * The steps are cosmetic (Ray isn't reporting real tool calls yet) but
 * they're picked from what the user actually asked, so a message about
 * Windows updates never surfaces "Reviewing local admins…"
 */
import { useEffect, useMemo, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step { label: string }

interface Intent {
  header: string;
  steps: Step[];
}

// Very light keyword routing — enough to pick a plausible plan.
function intentFor(msg: string | null | undefined): Intent {
  const m = (msg ?? '').toLowerCase();
  if (!m) return { header: 'Thinking…', steps: [{ label: 'Reading your request' }, { label: 'Comparing against your posture' }] };

  if (/update|kb\d|patch|driver/.test(m)) {
    return {
      header: 'Reviewing Windows Updates…',
      steps: [
        { label: 'Enumerating pending updates' },
        { label: 'Separating security from optional' },
        { label: 'Comparing against Microsoft guidance' },
      ],
    };
  }
  if (/port|firewall|network|listening|rdp/.test(m)) {
    return {
      header: 'Reviewing the network surface…',
      steps: [
        { label: 'Reading firewall profiles' },
        { label: 'Listing listening TCP ports' },
        { label: 'Flagging anything unusual' },
      ],
    };
  }
  if (/defender|antivirus|malware|tamper/.test(m)) {
    return {
      header: 'Reviewing Microsoft Defender…',
      steps: [
        { label: 'Checking real-time and cloud protection' },
        { label: 'Reading signature age' },
        { label: 'Looking at recent scan history' },
      ],
    };
  }
  if (/admin|account|user|password/.test(m)) {
    return {
      header: 'Reviewing accounts…',
      steps: [
        { label: 'Enumerating local administrators' },
        { label: 'Checking built-in account state' },
        { label: 'Flagging risky posture' },
      ],
    };
  }
  if (/bitlocker|encrypt|recovery/.test(m)) {
    return {
      header: 'Reviewing disk encryption…',
      steps: [
        { label: 'Reading BitLocker status' },
        { label: 'Locating recovery keys' },
        { label: 'Confirming escrow backup' },
      ],
    };
  }
  if (/score|harden|audit|compliance|insurance/.test(m)) {
    return {
      header: 'Assessing this device…',
      steps: [
        { label: 'Reading current posture' },
        { label: 'Calculating what would move the score most' },
        { label: 'Ranking safe vs risky changes' },
      ],
    };
  }
  if (/compare|other device|difference|different/.test(m)) {
    return {
      header: 'Comparing your devices…',
      steps: [
        { label: 'Loading peer devices' },
        { label: 'Diffing posture signals' },
        { label: 'Ranking outliers' },
      ],
    };
  }
  if (/fix|install|enable|turn on|apply|remediate/.test(m)) {
    return {
      header: 'Planning the fix…',
      steps: [
        { label: 'Confirming the current state' },
        { label: 'Choosing the safest action' },
        { label: 'Preparing the command' },
      ],
    };
  }
  return {
    header: 'Investigating…',
    steps: [
      { label: 'Reading your request carefully' },
      { label: 'Pulling the relevant posture' },
      { label: 'Composing an answer' },
    ],
  };
}

export function RayThinking({ userMessage }: { userMessage: string | null | undefined }) {
  const intent = useMemo(() => intentFor(userMessage), [userMessage]);
  const [revealed, setRevealed] = useState(1);

  useEffect(() => {
    setRevealed(1);
    if (intent.steps.length <= 1) return;
    const iv = setInterval(() => {
      setRevealed((n) => (n < intent.steps.length ? n + 1 : n));
    }, 550);
    return () => clearInterval(iv);
  }, [intent]);

  return (
    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-violet-100/90">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-300" />
        <span>{intent.header}</span>
      </div>
      <ul className="mt-1.5 space-y-1 pl-5 text-[12px] text-muted-foreground">
        <AnimatePresence initial={false}>
          {intent.steps.slice(0, revealed).map((s, i) => {
            const done = i < revealed - 1;
            return (
              <motion.li
                key={s.label}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5"
              >
                {done ? (
                  <Check className="h-3 w-3 text-emerald-300" />
                ) : (
                  <Loader2 className="h-3 w-3 animate-spin text-violet-300/80" />
                )}
                <span className={done ? 'text-foreground/70' : ''}>{s.label}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export default RayThinking;
