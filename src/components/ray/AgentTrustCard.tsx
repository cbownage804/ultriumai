/**
 * AgentTrustCard — explains exactly what the Wrayth agent can and cannot see.
 * Renders as normal JSX so builder-provided copy stays reviewable.
 *
 * This card is maintained by the Wrayth team as a plain-language summary of
 * the agent's data collection. It is not a certification.
 */
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ShieldCheck, EyeOff, Eye } from 'lucide-react';

export function AgentTrustCard() {
  const collects = [
    'Windows edition, build, uptime, and last boot time',
    'Whether BitLocker, Firewall, Defender, TPM, Secure Boot, UAC and RDP are enabled',
    'Defender signature age, PUA / cloud protection state, last scan time',
    'RDP configuration including whether Network Level Auth is required',
    'Local administrator account names and whether each is enabled or the built-in',
    'Chrome and Edge password-manager policy state and the number of saved logins (count only)',
    'Installed software names and versions, autoruns, non-Microsoft services',
    'Listening TCP ports and browser extension IDs',
    'Pending Windows Update counts grouped by category',
  ];
  const neverCollects = [
    'The contents of any file on disk',
    'The plaintext value of any saved browser password',
    'Screen captures, keystrokes, or clipboard contents',
    'Personal documents, email, chat, or browser history',
    'Camera or microphone access',
  ];
  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-300" /> What the Wrayth agent can see
        </CardTitle>
        <CardDescription>
          Maintained by the Wrayth team. This page describes current agent behavior — it is not an independent certification.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
        <div>
          <div className="flex items-center gap-1.5 font-medium text-emerald-200 mb-2"><Eye className="h-3.5 w-3.5" /> Collects</div>
          <ul className="space-y-1 text-muted-foreground list-disc ml-5">
            {collects.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-medium text-red-200 mb-2"><EyeOff className="h-3.5 w-3.5" /> Never collects</div>
          <ul className="space-y-1 text-muted-foreground list-disc ml-5">
            {neverCollects.map((c) => <li key={c}>{c}</li>)}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export default AgentTrustCard;
