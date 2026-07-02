/**
 * InstallAgentDialog — walks the user through installing the Wrayth
 * device agent on their Windows machine.
 *
 * Flow: click Install → we mint a one-time enrollment code via the
 * agent-enroll edge function, generate a downloadable `wrayth-config.json`
 * blob, and point the user at the GitHub Release for `WraythAgent.exe`.
 * When the agent redeems the code the enrollment row flips, which we
 * detect via a lightweight poll so the dialog can celebrate.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  MonitorDown,
  ShieldCheck,
} from 'lucide-react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SETUP_DOWNLOAD_URL =
  'https://github.com/cbownage804/ultriumai/releases/latest/download/WraythSetup.exe';
const RAW_EXE_DOWNLOAD_URL =
  'https://github.com/cbownage804/ultriumai/releases/latest/download/WraythAgent.exe';

interface EnrollState {
  code: string;
  enrollmentId: string;
  expiresAt: string;
}

export function InstallAgentDialog({
  trigger,
}: {
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<number | null>(null);

  const reset = () => {
    setEnroll(null);
    setConfirmed(false);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) reset();
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [open]);

  const startEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-enroll');
      if (error) throw error;
      setEnroll({
        code: data.code,
        enrollmentId: data.enrollment_id,
        expiresAt: data.expires_at,
      });
      // Poll enrollment status every 4s until redeemed or dialog closes.
      pollRef.current = window.setInterval(async () => {
        const { data: row } = await supabase
          .from('wrayth_device_enrollments')
          .select('redeemed_at, device_id')
          .eq('id', data.enrollment_id)
          .maybeSingle();
        if (row?.redeemed_at) {
          setConfirmed(true);
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
          toast.success('Device connected', {
            description: "Ray is now watching this machine.",
          });
        }
      }, 4000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error("I couldn't mint an enrollment code", { description: msg });
    } finally {
      setLoading(false);
    }
  };

  const downloadConfig = () => {
    if (!enroll) return;
    const body = {
      api_base: SUPABASE_URL,
      enrollment_code: enroll.code,
    };
    const blob = new Blob([JSON.stringify(body, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wrayth-config.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-violet-600 hover:bg-violet-500 text-white">
            <MonitorDown className="mr-2 h-4 w-4" />
            Install agent
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-violet-400" />
            Install the Wrayth agent
          </DialogTitle>
          <DialogDescription>
            A tiny read-only reporter that lets Ray watch this machine's
            hygiene. It never runs code, never sees your files.
          </DialogDescription>
        </DialogHeader>

        {!enroll ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground space-y-2">
              <p><strong className="text-foreground">What it reads:</strong> BitLocker status, firewall state, Defender health, pending updates, uptime, installed browsers.</p>
              <p><strong className="text-foreground">What it doesn't:</strong> files, screens, keystrokes, browsing history.</p>
              <p><strong className="text-foreground">Where it runs:</strong> as your user, no admin required.</p>
            </div>
            <Button onClick={startEnroll} disabled={loading} className="w-full">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing your install…</>
              ) : (
                <>Get my install bundle</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <ol className="space-y-3 text-sm">
              <li className="rounded-lg border border-border/60 p-3">
                <div className="font-medium text-foreground mb-2">1. Download the agent</div>
                <Button asChild variant="outline" size="sm">
                  <a href={AGENT_DOWNLOAD_URL} target="_blank" rel="noreferrer">
                    <Download className="mr-2 h-4 w-4" /> WraythAgent.exe
                  </a>
                </Button>
              </li>
              <li className="rounded-lg border border-border/60 p-3">
                <div className="font-medium text-foreground mb-2">2. Download your config</div>
                <p className="text-xs text-muted-foreground mb-2">
                  Contains your one-time enrollment code. Save it in the same
                  folder as the EXE.
                </p>
                <Button onClick={downloadConfig} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> wrayth-config.json
                </Button>
                <div className="mt-2 text-[11px] text-muted-foreground/80">
                  Code (also inside the file): <code className="rounded bg-muted px-1 py-0.5">{enroll.code}</code>
                </div>
              </li>
              <li className="rounded-lg border border-border/60 p-3">
                <div className="font-medium text-foreground mb-2">3. Double-click WraythAgent.exe</div>
                <p className="text-xs text-muted-foreground">
                  It'll enroll silently and start checking in every hour.
                </p>
              </li>
            </ol>

            {confirmed ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-5 w-5" />
                Connected. This device just checked in.
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Waiting for first check-in…
                <Badge variant="outline" className="ml-auto">expires 15 min</Badge>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InstallAgentDialog;
