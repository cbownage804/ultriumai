/**
 * DeviceIntelPanel — collapsible intel section for one enrolled Wrayth device.
 * Shows the escrowed BitLocker recovery key, a short list of installed
 * software (with CVE hints computed server-side into findings), and any
 * drift Ray has spotted since the last check-in.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Package,
  Play,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface SoftwareEntry { name: string; version?: string; publisher?: string }
interface AutorunEntry { location: string; name: string; command: string }
interface ServiceEntry { name: string; display_name?: string; path?: string }
interface Posture {
  installed_software?: SoftwareEntry[];
  autoruns?: AutorunEntry[];
  non_ms_services?: ServiceEntry[];
  browser_extensions?: Array<{ browser: string; name?: string; version?: string }>;
  listening_ports?: Array<{ port: number; process?: string; address: string }>;
}

export function DeviceIntelPanel({
  deviceId,
  posture,
}: {
  deviceId: string;
  posture: Posture | null;
}) {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [recovery, setRecovery] = useState<{
    key: string;
    id: string;
    capturedAt: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from('wrayth_device_actions')
        .select('id, result, completed_at, status, action_type')
        .eq('device_id', deviceId)
        .eq('action_type', 'enable_bitlocker')
        .eq('status', 'succeeded')
        .order('completed_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row = (data ?? [])[0] as
        | { result: { recovery_password?: string; recovery_key_id?: string } | null; completed_at: string }
        | undefined;
      const key = row?.result?.recovery_password;
      if (key) {
        setRecovery({
          key,
          id: row?.result?.recovery_key_id ?? '',
          capturedAt: row?.completed_at ?? '',
        });
      } else {
        setRecovery(null);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const copyKey = async () => {
    if (!recovery?.key) return;
    try {
      await navigator.clipboard.writeText(recovery.key);
      toast.success('Recovery key copied', {
        description: 'Store it somewhere safe — a password manager is ideal.',
      });
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  };

  const software = posture?.installed_software ?? [];
  const autoruns = posture?.autoruns ?? [];
  const services = posture?.non_ms_services ?? [];
  const extensions = posture?.browser_extensions ?? [];
  const ports = posture?.listening_ports ?? [];

  const hasSomething =
    recovery !== null ||
    software.length > 0 ||
    autoruns.length > 0 ||
    services.length > 0 ||
    extensions.length > 0 ||
    ports.length > 0;
  if (!hasSomething) return null;

  return (
    <div className="rounded-md border border-border/60 bg-background/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <span className="font-medium uppercase tracking-wide">Deep intel</span>
        <span className="ml-auto flex items-center gap-2">
          {recovery && (
            <Badge className="bg-emerald-500/15 text-emerald-200 border-emerald-500/30 text-[10px]">
              recovery key escrowed
            </Badge>
          )}
          <span>
            {software.length} apps · {autoruns.length} autoruns · {services.length} svcs
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-border/60 p-3">
          {recovery && (
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-100">
                <KeyRound className="h-3.5 w-3.5" />
                BitLocker recovery key
              </div>
              <div className="mb-2 text-[11px] text-emerald-200/80">
                Captured {recovery.capturedAt ? new Date(recovery.capturedAt).toLocaleString() : 'recently'}.
                {' '}Save it — you'll need it if Windows can't unlock this drive on boot.
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-background/60 px-2 py-1 font-mono text-[11px] text-emerald-100">
                  {showKey ? recovery.key : '•••••• ••••••-•••••• (hidden)'}
                </code>
                <Button size="sm" variant="ghost" onClick={() => setShowKey((s) => !s)}>
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={copyKey}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              {recovery.id && (
                <div className="mt-1 text-[10px] text-emerald-200/60">Key ID: {recovery.id}</div>
              )}
            </div>
          )}

          {software.length > 0 && (
            <IntelList
              icon={Package}
              title={`Installed software (${software.length})`}
              rows={software.slice(0, 20).map((s) => ({
                primary: s.name,
                secondary: [s.version, s.publisher].filter(Boolean).join(' · '),
              }))}
              overflow={Math.max(0, software.length - 20)}
            />
          )}
          {autoruns.length > 0 && (
            <IntelList
              icon={Play}
              title={`Startup items (${autoruns.length})`}
              rows={autoruns.slice(0, 12).map((a) => ({
                primary: a.name,
                secondary: a.command,
              }))}
              overflow={Math.max(0, autoruns.length - 12)}
            />
          )}
          {services.length > 0 && (
            <IntelList
              icon={Zap}
              title={`Non-Microsoft services (${services.length})`}
              rows={services.slice(0, 12).map((s) => ({
                primary: s.display_name || s.name,
                secondary: s.path ?? '',
              }))}
              overflow={Math.max(0, services.length - 12)}
            />
          )}
          {extensions.length > 0 && (
            <IntelList
              icon={Package}
              title={`Browser extensions (${extensions.length})`}
              rows={extensions.slice(0, 12).map((e) => ({
                primary: `${e.name || 'Unnamed'} · ${e.browser}`,
                secondary: e.version ?? '',
              }))}
              overflow={Math.max(0, extensions.length - 12)}
            />
          )}
          {ports.length > 0 && (
            <IntelList
              icon={Zap}
              title={`Listening ports (${ports.length})`}
              rows={ports.slice(0, 12).map((p) => ({
                primary: `${p.address}:${p.port}`,
                secondary: p.process ?? '',
              }))}
              overflow={Math.max(0, ports.length - 12)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function IntelList({
  icon: Icon,
  title,
  rows,
  overflow,
}: {
  icon: typeof Package;
  title: string;
  rows: Array<{ primary: string; secondary: string }>;
  overflow: number;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {title}
      </div>
      <div className="max-h-56 space-y-0.5 overflow-y-auto rounded border border-border/40 bg-background/40 p-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="truncate font-medium text-foreground/90">{r.primary}</span>
            {r.secondary && (
              <span className="ml-auto max-w-[60%] truncate text-muted-foreground">
                {r.secondary}
              </span>
            )}
          </div>
        ))}
        {overflow > 0 && (
          <div className="pt-1 text-[10px] text-muted-foreground">+{overflow} more</div>
        )}
      </div>
    </div>
  );
}

export default DeviceIntelPanel;
