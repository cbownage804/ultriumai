/**
 * AskRayCommandBox — the conversational replacement for the "Ask Ray to fix
 * something" dropdown. A free-text prompt with quick-action chips.
 *
 * Free text opens Ray's chat panel with the message prefilled (via the
 * `ray:panel-open` event bus already handled by FloatingRayChat).
 * Chips do the same, but seeded with an intent Ray recognizes ("harden this
 * PC", "why is my score low?", etc.) so the conversation starts on rails.
 */
import { useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { DevicePosture } from './DeviceSecurityTabs';

interface Props {
  deviceId: string;
  hostname?: string;
  posture: DevicePosture | null;
  disabled?: boolean;
}

function sendToRay(message: string, deviceId: string, hostname?: string) {
  window.dispatchEvent(
    new CustomEvent('ray:panel-open', {
      detail: {
        message,
        context: {
          kind: 'device',
          id: deviceId,
          title: hostname ? `Device: ${hostname}` : `Device ${deviceId.slice(0, 8)}`,
        },
      },
    }),
  );
}

function buildChips(posture: DevicePosture | null): Array<{ label: string; prompt: string }> {
  const chips: Array<{ label: string; prompt: string }> = [];
  chips.push({ label: 'Harden this PC', prompt: 'Walk me through hardening this PC. What should we fix first?' });
  chips.push({ label: 'Why is my score low?', prompt: 'Explain why the security score on this device is where it is, and what the biggest wins would be.' });
  if (posture?.pending_updates && posture.pending_updates > 0) {
    chips.push({ label: 'Update Windows', prompt: 'Install pending Windows updates on this device.' });
  }
  if (posture?.disk_encryption?.enabled === false) {
    chips.push({ label: 'Enable BitLocker', prompt: 'Turn on BitLocker for the system drive on this device.' });
  }
  if (posture?.antivirus?.enabled === false || posture?.antivirus?.realtime_protection === false) {
    chips.push({ label: 'Review Defender', prompt: 'Review Microsoft Defender on this device and fix anything that\u2019s off.' });
  }
  chips.push({ label: 'Fix everything', prompt: 'Run every safe fix you can on this device to bring it up to baseline.' });
  chips.push({ label: 'Is this machine audit-ready?', prompt: 'Is this device compliant for a typical cyber-insurance or audit check?' });
  return chips;
}

export function AskRayCommandBox({ deviceId, hostname, posture, disabled }: Props) {
  const [value, setValue] = useState('');
  const chips = buildChips(posture);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    sendToRay(text, deviceId, hostname);
    setValue('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent p-3"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-violet-300" />
        <span className="text-[10px] uppercase tracking-[0.22em] text-violet-200/80">Ask Ray</span>
      </div>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Waiting for this device to come back online\u2026' : 'Tell Ray what you\u2019d like to do\u2026'}
          rows={2}
          className="resize-none border-violet-500/20 bg-background/50 pr-12 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-violet-400/40"
        />
        <Button
          size="sm"
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-violet-500 p-0 text-white hover:bg-violet-400 disabled:opacity-40"
          aria-label="Send to Ray"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c.label}
            disabled={disabled}
            onClick={() => sendToRay(c.prompt, deviceId, hostname)}
            className="rounded-full border border-violet-500/25 bg-violet-500/5 px-2.5 py-1 text-[11px] text-violet-100/90 hover:border-violet-400/50 hover:bg-violet-500/15 disabled:opacity-40 transition-colors"
          >
            {c.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default AskRayCommandBox;
