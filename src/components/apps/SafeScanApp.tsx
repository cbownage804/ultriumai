/**
 * ScanApp — Ray's device-scanning surface.
 *
 * Ships the real Wrayth device agent: users install a small Windows
 * reporter, and their machine posture appears in the enrolled-devices
 * list below. The agent binary is built by GitHub Actions and served
 * from the latest release on cbownage804/ultriumai.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';
import { InstallAgentDialog } from '@/components/ray/InstallAgentDialog';
import { EnrolledDevicesList } from '@/components/ray/EnrolledDevicesList';

interface ScanAppProps {
  isWhiteLabeled?: boolean;
  brandName?: string;
  hideHeader?: boolean;
}

export function ScanApp({ brandName = 'Wrayth' }: ScanAppProps) {
  return (
    <div className="space-y-4">
      <Card className="border-violet-500/10 bg-card/60">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-500/10 p-2">
              <ShieldCheck className="h-5 w-5 text-violet-300" />
            </div>
            <CardTitle className="text-lg font-medium text-foreground">
              Let Ray watch this machine
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            The {brandName} agent is a small, read-only reporter. Once
            installed, Ray checks your patch level, encryption, firewall,
            and antivirus every hour and flags anything worth fixing.
          </p>
          <p className="text-xs text-muted-foreground/80 max-w-xl">
            Windows today. macOS and Linux next. It never sees your files,
            screens, or keystrokes.
          </p>
          <InstallAgentDialog />
        </CardContent>
      </Card>

      <EnrolledDevicesList />
    </div>
  );
}

export default ScanApp;

