/**
 * AskRayCommandBox — the conversational replacement for the "Ask Ray to fix
 * something" dropdown. Layout is now:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ Tell Ray what you'd like to do…            ➜│
 *   └──────────────────────────────────────────────┘
 *   [✨ Fix Safe Issues] [🛡 Explain My Score] …
 *
 * The chip strip auto-hides as soon as the user starts typing so the
 * conversation feels like a real prompt, not a menu wall. The placeholder
 * and the chip set are context-aware — they change with the active tab on
 * DeviceSecurityTabs (Updates, Network, Accounts, …). Chips are quick
 * commands: pressing one sends a natural-language instruction to Ray.
 */
import { useMemo, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUp, Sparkles, ShieldCheck, Search, Wrench, GitCompare, Lock, Wifi,
  Users, Download, Package, KeyRound, Server,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { DevicePosture } from './DeviceSecurityTabs';

interface Props {
  deviceId: string;
  hostname?: string;
  posture: DevicePosture | null;
  disabled?: boolean;
  /** Currently open tab on DeviceSecurityTabs; drives context-aware chips + placeholder. */
  activeTab?: string;
}

interface Chip { label: string; prompt: string; icon: LucideIcon }

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

// Baseline chips visible on every tab — the "one conversational interface"
// replacements for the legacy dropdown actions.
function baseChips(posture: DevicePosture | null): Chip[] {
  const chips: Chip[] = [
    { label: 'Fix Safe Issues',   icon: Sparkles,    prompt: 'Fix every safe issue on this device.' },
    { label: 'Explain My Score',  icon: ShieldCheck, prompt: 'Explain why the security score on this device is where it is, and what the biggest wins would be.' },
    { label: 'Security Check',    icon: Search,      prompt: 'Run a full security check on this device and tell me what stands out.' },
    { label: 'Harden This PC',    icon: Wrench,      prompt: 'Walk me through hardening this PC. What should we fix first, in order?' },
    { label: 'Compare Devices',   icon: GitCompare,  prompt: 'Compare this device to my other devices. What is different or worse here?' },
  ];
  if (posture?.disk_encryption?.enabled === false) {
    chips.push({ label: 'Enable BitLocker', icon: Lock, prompt: 'Turn on BitLocker for the system drive on this device.' });
  }
  return chips;
}

// Context-aware chips per DeviceSecurityTabs tab. These override the baseline
// when the user is focused on a specific area of the device.
function tabChips(tab: string | undefined, posture: DevicePosture | null): Chip[] {
  switch (tab) {
    case 'updates':
      return [
        { label: 'Install Pending Updates', icon: Download,   prompt: 'Install every pending Windows update on this device, including drivers.' },
        { label: 'Explain Each Update',     icon: Search,     prompt: 'For each pending Windows update on this device, tell me what it does and whether it is urgent.' },
        { label: 'What is safe to install?', icon: ShieldCheck, prompt: 'Which of the pending Windows updates on this device are safe to install unattended?' },
        { label: 'Fix Safe Issues',         icon: Sparkles,   prompt: 'Fix every safe issue on this device, starting with updates.' },
      ];
    case 'network':
      return [
        { label: 'Explain My Firewall',   icon: ShieldCheck, prompt: 'Explain the current firewall configuration on this device and whether it is safe.' },
        { label: 'Review Open Ports',     icon: Server,      prompt: 'Review the listening TCP ports on this device and flag anything unusual.' },
        { label: 'RDP Hardening',         icon: Wifi,        prompt: 'Review RDP on this device — is it exposed, is NLA required, and should we tighten it?' },
        { label: 'Fix Safe Issues',       icon: Sparkles,    prompt: 'Fix every safe network issue on this device.' },
      ];
    case 'accounts':
      return [
        { label: 'Review Local Admins',   icon: Users,       prompt: 'List every local administrator account on this device and tell me which ones should be removed or disabled.' },
        { label: 'Explain This Account',  icon: Search,      prompt: 'For each local account on this device, explain what it is for and whether it is safe to keep enabled.' },
        { label: 'Password Managers',     icon: KeyRound,    prompt: 'Review browser password manager use on this device. Should we disable Chrome/Edge password storage?' },
        { label: 'Harden Accounts',       icon: Wrench,      prompt: 'Harden the local accounts on this device to baseline.' },
      ];
    case 'defender':
      return [
        { label: 'Review Defender',       icon: ShieldCheck, prompt: 'Review Microsoft Defender on this device and fix anything that is off, including cloud and PUA protection.' },
        { label: 'Run a Quick Scan',      icon: Search,      prompt: 'Kick off a Microsoft Defender quick scan on this device.' },
        { label: 'Turn On Tamper Protection', icon: Lock,    prompt: 'Explain how to enable Microsoft Defender Tamper Protection on this device.' },
        { label: 'Fix Safe Issues',       icon: Sparkles,    prompt: 'Fix every safe Defender issue on this device.' },
      ];
    case 'software':
      return [
        { label: 'What is dangerous here?', icon: Search,   prompt: 'Look at the installed software on this device and flag anything risky, abandoned, or out of policy.' },
        { label: 'Outdated Software',      icon: Download,  prompt: 'Which installed programs on this device are out of date and should be upgraded?' },
        { label: 'Explain Autoruns',       icon: Package,   prompt: 'Explain the autoruns and non-Microsoft services on this device. Anything I should worry about?' },
        { label: 'Fix Safe Issues',        icon: Sparkles,  prompt: 'Fix every safe software issue on this device.' },
      ];
    case 'system':
      return [
        { label: 'Explain My Score',   icon: ShieldCheck, prompt: 'Explain the security score for this device and how to improve it.' },
        { label: 'Enable BitLocker',   icon: Lock,        prompt: 'Turn on BitLocker for the system drive on this device.' },
        { label: 'Harden This PC',     icon: Wrench,      prompt: 'Walk me through hardening this PC end-to-end.' },
        { label: 'Fix Safe Issues',    icon: Sparkles,    prompt: 'Fix every safe issue on this device.' },
      ];
    case 'keys':
      return [
        { label: 'Explain BitLocker Recovery', icon: KeyRound, prompt: 'Explain how BitLocker recovery keys work on this device and where mine are stored.' },
        { label: 'Where is my key backed up?', icon: Search,   prompt: 'Where are the BitLocker recovery keys for this device backed up right now?' },
        { label: 'Rotate Recovery Key',        icon: Wrench,   prompt: 'Rotate the BitLocker recovery key on this device.' },
      ];
    case 'posture':
    default:
      return baseChips(posture);
  }
}

function placeholderFor(tab: string | undefined, disabled: boolean): string {
  if (disabled) return 'Waiting for this device to come back online\u2026';
  switch (tab) {
    case 'updates':  return 'Ask Ray about Windows Updates\u2026';
    case 'network':  return 'Ask Ray about this network configuration\u2026';
    case 'accounts': return 'Ask Ray about local administrators\u2026';
    case 'defender': return 'Ask Ray about Microsoft Defender\u2026';
    case 'software': return 'Ask Ray about installed software\u2026';
    case 'system':   return 'Ask Ray about this system\u2026';
    case 'keys':     return 'Ask Ray about BitLocker recovery keys\u2026';
    default:         return 'Tell Ray what you\u2019d like to do\u2026';
  }
}

export function AskRayCommandBox({ deviceId, hostname, posture, disabled, activeTab }: Props) {
  const [value, setValue] = useState('');
  const chips = useMemo(() => tabChips(activeTab, posture), [activeTab, posture]);
  const isTyping = value.length > 0;

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
          placeholder={placeholderFor(activeTab, !!disabled)}
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

      {/* Chips vanish as soon as the user starts typing so the prompt feels
          like a conversation, not a menu. They come back when the box is empty. */}
      {!isTyping && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="mt-2.5"
        >
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-1.5">
            Quick actions
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  disabled={disabled}
                  onClick={() => sendToRay(c.prompt, deviceId, hostname)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/5 px-2.5 py-1 text-[11px] text-violet-100/90 hover:border-violet-400/50 hover:bg-violet-500/15 disabled:opacity-40 transition-colors"
                >
                  <Icon className="h-3 w-3" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default AskRayCommandBox;
