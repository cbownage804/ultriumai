/**
 * DeviceTransparencyCard — per-device version of AgentTrustCard.
 *
 * Instead of a generic "here's what the agent could collect" list, this
 * shows exactly which signals Ray has actually observed on THIS device
 * in the most recent posture capture. Each row is ✓ (present in the
 * latest snapshot) or ✗ (never collected / not applicable) so the owner
 * of the machine can audit Ray's field of view at a glance.
 */
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Check, X, EyeOff, Clock } from 'lucide-react';

interface Props {
  posture: Record<string, any> | null;
  capturedAt: string | null;
}

function ago(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

// Returns true when the posture object clearly has data for this signal.
function has(posture: any, path: string[]): boolean {
  if (!posture) return false;
  let cur: any = posture;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object' || !(key in cur)) return false;
    cur = cur[key];
  }
  return cur !== null && cur !== undefined && !(Array.isArray(cur) && cur.length === 0);
}

interface SignalRow { label: string; present: boolean }

export function DeviceTransparencyCard({ posture, capturedAt }: Props) {
  const collectedSignals: SignalRow[] = [
    { label: 'Windows edition, build, uptime', present: has(posture, ['os_edition']) || has(posture, ['os_build']) || has(posture, ['uptime_hours']) },
    { label: 'BitLocker / disk encryption state', present: has(posture, ['disk_encryption', 'enabled']) },
    { label: 'Firewall (all three profiles)', present: has(posture, ['firewall', 'enabled']) || has(posture, ['firewall', 'profiles']) },
    { label: 'Defender status & signature age', present: has(posture, ['antivirus', 'enabled']) },
    { label: 'Defender cloud / PUA / last scan', present: has(posture, ['defender_detail']) },
    { label: 'TPM present + ready', present: has(posture, ['tpm', 'present']) },
    { label: 'Secure Boot enabled', present: has(posture, ['secure_boot', 'enabled']) },
    { label: 'UAC enforcement', present: has(posture, ['uac', 'enabled']) },
    { label: 'RDP enabled + NLA required', present: has(posture, ['rdp_security']) || has(posture, ['remote_desktop']) },
    { label: 'Local administrator accounts', present: has(posture, ['local_admins_detail']) || has(posture, ['local_admins', 'count']) },
    { label: 'Chrome / Edge password-manager policy', present: has(posture, ['browser_passwords']) },
    { label: 'Installed software names & versions', present: has(posture, ['installed_software']) || has(posture, ['software_count']) },
    { label: 'Autoruns and non-Microsoft services', present: has(posture, ['autoruns']) || has(posture, ['services']) },
    { label: 'Listening TCP ports', present: has(posture, ['listening_ports']) },
    { label: 'Browser extension IDs', present: has(posture, ['browser_extensions']) },
    { label: 'Pending Windows Updates by category', present: has(posture, ['update_categories']) || has(posture, ['pending_updates']) },
    { label: 'Disk & memory capacity', present: has(posture, ['disk']) || has(posture, ['memory']) },
  ];

  const neverCollects = [
    'The contents of any file on disk',
    'Plaintext values of saved browser passwords',
    'Screen captures, keystrokes, or clipboard contents',
    'Personal documents, email, chat, or browser history',
    'Camera or microphone access',
  ];

  const collectedCount = collectedSignals.filter((s) => s.present).length;

  return (
    <Card className="border-border/60 bg-card/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-300" /> What Ray actually sees on this device
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Snapshot captured {ago(capturedAt)}</span>
          <span className="text-muted-foreground/80">·</span>
          <span>{collectedCount} of {collectedSignals.length} signals observed in the latest check-in</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 text-[12px]">
        <div>
          <div className="flex items-center gap-1.5 font-medium text-emerald-200 mb-2">
            <Check className="h-3.5 w-3.5" /> Collected on this device
          </div>
          <ul className="space-y-1">
            {collectedSignals.map((s) => (
              <li key={s.label} className="flex items-start gap-2">
                {s.present ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300 mt-0.5 shrink-0" />
                ) : (
                  <X className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                )}
                <span className={s.present ? 'text-foreground/90' : 'text-muted-foreground/60 line-through decoration-muted-foreground/40'}>
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-medium text-red-200 mb-2">
            <EyeOff className="h-3.5 w-3.5" /> Never collected
          </div>
          <ul className="space-y-1 text-muted-foreground">
            {neverCollects.map((n) => (
              <li key={n} className="flex items-start gap-2">
                <X className="h-3.5 w-3.5 text-red-300/70 mt-0.5 shrink-0" />
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground/80 leading-relaxed">
            Grey items above are simply signals the agent hasn't reported yet — either because the feature isn't
            present on this OS build or because the check-in hasn't run recently. They are not being suppressed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default DeviceTransparencyCard;
