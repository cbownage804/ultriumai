/**
 * VaultUnlockDialog — Ray's front door to the encrypted vault.
 *
 * Wraps MasterPasswordSetup in unlock mode and adds Ray's capability
 * preamble so users understand *why* they're unlocking. Used by the
 * dashboard's VaultLockedCard and by Exposure/Threats banners when
 * cross-domain reasoning needs decrypted data.
 *
 * The dialog is fully self-contained: pass in a trigger element and it
 * handles open/close, unlock success, and toast messaging.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MasterPasswordSetup } from '@/components/safepass/MasterPasswordSetup';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Check } from 'lucide-react';

interface Props {
  trigger: React.ReactNode;
  /** Optional context line — e.g. "so I can check whether this breach affects you". */
  reason?: string;
  /** Override the default capability bullets shown in the preamble. */
  capabilities?: string[];
}

const DEFAULT_CAPABILITIES = [
  'Match saved passwords against known breaches',
  'Detect reused passwords',
  'Measure password strength',
  'Recommend safer replacements',
  'Connect breached identities to real accounts',
];

export function VaultUnlockDialog({ trigger, reason, capabilities }: Props) {
  const bullets = capabilities && capabilities.length > 0 ? capabilities : DEFAULT_CAPABILITIES;
  const [open, setOpen] = useState(false);
  const { unlockWithPassword } = useMasterPassword();
  const { toast } = useToast();

  const handleUnlock = async (password: string) => {
    const result = await unlockWithPassword(password);
    if (result.success) {
      setOpen(false);
      toast({ title: 'Unlocked', description: 'Ray has your passwords ready.' });
    } else {
      toast({
        title: 'Unlock failed',
        description: result.error || 'Incorrect master password',
        variant: 'destructive',
      });
    }
  };

  const preamble = (
    <div className="rounded-xl border border-violet-400/25 bg-violet-500/[0.05] p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
        <Sparkles className="h-3 w-3" />
        Ray can now
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-foreground/90">
        {bullets.map((c) => (
          <li key={c} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-violet-300 shrink-0" />
            {c}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Your master password never leaves this device.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 bg-transparent border-0 shadow-none">
        <div className="space-y-4">
          {reason && (
            <div className="rounded-xl border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
              <span className="text-foreground">Ray says:</span> {reason}
            </div>
          )}
          {preamble}
          <MasterPasswordSetup
            isCreating={false}
            onMasterPasswordSet={handleUnlock}
            onCancel={() => setOpen(false)}
            title="Unlock Vault"
            description="Enter your master password to give Ray access."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
