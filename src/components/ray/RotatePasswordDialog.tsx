/**
 * RotatePasswordDialog — Ray's one-click rotate flow.
 *
 * Given a vault entry, Ray generates a strong replacement, deep-links the
 * user to the site so they can paste it, and — on confirmation — re-encrypts
 * the entry with the new password. The whole loop stays inside Wrayth.
 */
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, RefreshCw, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { useVault, type PasswordEntry } from '@/hooks/useSafePass';
import { generateSecurePassword } from '@/utils/crypto';
import { toast } from 'sonner';

interface Props {
  entry: PasswordEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onRotated?: () => void;
}

function urlFor(entry: PasswordEntry): string | null {
  const raw = entry.url?.trim();
  if (!raw) return null;
  try {
    const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    new URL(withProto);
    return withProto;
  } catch {
    return null;
  }
}

export function RotatePasswordDialog({ entry, open, onOpenChange, onRotated }: Props) {
  const { rotateEntryPassword } = useVault();
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword(generateSecurePassword({ length: 20, includeSymbols: true, includeNumbers: true, includeUppercase: true, includeLowercase: true }));
      setCopied(false);
      setOpened(false);
    }
  }, [open]);

  if (!entry) return null;
  const target = urlFor(entry);

  const regenerate = () => {
    setNewPassword(generateSecurePassword({ length: 20, includeSymbols: true, includeNumbers: true, includeUppercase: true, includeLowercase: true }));
    setCopied(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      toast.success('Copied. Paste it into the site.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const openSite = () => {
    if (!target) return;
    window.open(target, '_blank', 'noopener,noreferrer');
    setOpened(true);
  };

  const confirm = async () => {
    setBusy(true);
    const ok = await rotateEntryPassword(entry, newPassword);
    setBusy(false);
    if (ok) {
      onOpenChange(false);
      onRotated?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <Sparkles className="h-3 w-3" /> Ray rotates for you
          </div>
          <DialogTitle className="text-lg font-light">Rotate {entry.title}</DialogTitle>
          <DialogDescription className="text-sm">
            I generated a strong replacement. Open the site, paste it, and I'll re-encrypt your vault the moment you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background/40 p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">New password</div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={newPassword}
                className="font-mono text-sm bg-background/60"
              />
              <Button variant="outline" size="icon" onClick={regenerate} title="Regenerate">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={copy} title="Copy">
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <StepNum n={1} done={copied} />
              <span className="text-muted-foreground">Copy Ray's new password.</span>
            </li>
            <li className="flex items-start gap-2">
              <StepNum n={2} done={opened} />
              <span className="text-muted-foreground flex-1">
                {target ? (
                  <button onClick={openSite} className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200">
                    Open {new URL(target).hostname} <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span>Open the site in your browser and change the password.</span>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <StepNum n={3} done={false} />
              <span className="text-muted-foreground">Come back and confirm — I'll store the new one.</span>
            </li>
          </ol>
        </div>

        <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={confirm} disabled={busy || !newPassword} className="bg-violet-500 text-white hover:bg-violet-500/90 gap-2">
            <ShieldCheck className="h-4 w-4" />
            {busy ? 'Saving…' : 'Mark rotated'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepNum({ n, done }: { n: number; done: boolean }) {
  return (
    <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${done ? 'border-green-400/50 bg-green-500/10 text-green-300' : 'border-border/60 bg-background/40 text-muted-foreground'}`}>
      {done ? <Check className="h-3 w-3" /> : n}
    </span>
  );
}

export default RotatePasswordDialog;
