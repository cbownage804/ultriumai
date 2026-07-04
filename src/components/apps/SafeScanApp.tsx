/**
 * ScanApp — Ray's device-scanning surface.
 *
 * Two-column onboarding: pitch + install CTA on the left, structured
 * "what Ray sees" vs "what it never touches" on the right. Below that,
 * the live list of enrolled devices.
 */
import { Card, CardContent } from '@/components/ui/card';
import {
  ShieldCheck, Eye, EyeOff, Sparkles, MonitorDot, Activity,
  ScanSearch, ClipboardList, Compass, MessageCircle, Gauge, CalendarCheck,
} from 'lucide-react';
import { InstallAgentDialog } from '@/components/ray/InstallAgentDialog';
// EnrolledDevicesList now lives on /app/devices — a single source of truth
// for the fleet. SafeScan focuses on the install pitch.

interface ScanAppProps {
  isWhiteLabeled?: boolean;
  brandName?: string;
  hideHeader?: boolean;
}

const UNLOCKS: Array<{ icon: React.ComponentType<{ className?: string }>; label: string }> = [
  { icon: MonitorDot,    label: 'Live device monitoring' },
  { icon: Gauge,         label: 'Security score' },
  { icon: ScanSearch,    label: 'Threat investigations' },
  { icon: Activity,      label: 'Device timeline' },
  { icon: Compass,       label: 'Guided remediation' },
  { icon: Sparkles,      label: 'AI recommendations' },
  { icon: ClipboardList, label: 'Continuous posture analysis' },
  { icon: CalendarCheck, label: 'Weekly security briefings' },
];

const SIGNALS: string[] = [
  'Windows Updates', 'Microsoft Defender', 'BitLocker', 'TPM',
  'Secure Boot', 'Firewall', 'Local admins', 'Browser posture',
  'Software inventory', 'Timeline',
];

const NEVER: string[] = [
  'Files', 'Password contents', 'Emails', 'Screens',
  'Keystrokes', 'Camera', 'Microphone',
];

export function ScanApp({ brandName = 'Wrayth' }: ScanAppProps) {
  return (
    <div className="space-y-6">
      {/* Hero: two-column pitch */}
      <div className="relative overflow-hidden rounded-lg border border-[hsl(262_60%_64%/0.25)] bg-gradient-to-br from-[hsl(262_60%_20%/0.25)] via-card to-card">
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[hsl(262_70%_55%/0.18)] blur-[80px]" />
        <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-8 p-6 lg:p-8">
          {/* Left: pitch */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[hsl(262_60%_78%)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Connect this device to Ray
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
                Give Ray eyes on this device.
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                Ray can only investigate what it can see. The {brandName} Agent is Ray's secure
                device sensor — it continuously reports posture signals so Ray can score risk,
                explain what changed, and tell you exactly what deserves attention.
              </p>
              <p className="text-xs text-muted-foreground/80">
                Windows today. macOS and Linux next.
              </p>
            </div>

            <InstallAgentDialog />

            {/* Unlocks */}
            <div className="pt-3 mt-1 border-t border-border/50">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                Once installed, you unlock
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {UNLOCKS.map(u => {
                  const Icon = u.icon;
                  return (
                    <div key={u.label} className="flex items-center gap-2 text-xs">
                      <Icon className="h-3.5 w-3.5 text-[hsl(262_60%_78%)] shrink-0" />
                      <span className="text-foreground/90 truncate">{u.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: signals vs privacy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <Card className="border-[hsl(140_60%_50%/0.25)] bg-[hsl(140_60%_20%/0.06)]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-[hsl(140_60%_70%)]" />
                  <div className="text-xs uppercase tracking-[0.22em] text-[hsl(140_60%_70%)]">
                    What Ray sees
                  </div>
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {SIGNALS.map(s => (
                    <li key={s} className="flex items-center gap-1.5 text-foreground/90">
                      <span className="text-[hsl(140_60%_65%)]">✓</span>
                      <span className="truncate">{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    What it never touches
                  </div>
                </div>
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {NEVER.map(n => (
                    <li key={n} className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-muted-foreground/70">✕</span>
                      <span className="truncate">{n}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-border/60 flex items-start gap-2 text-[11px] text-muted-foreground">
                  <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>Security signals only. Never personal content.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      
    </div>
  );
}

export default ScanApp;
