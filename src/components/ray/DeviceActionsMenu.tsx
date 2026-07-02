/**
 * DeviceActionsMenu — one-tap action approvals for an enrolled device.
 * Ray proposes; you approve in a single click; the agent executes as SYSTEM.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle2,
  ChevronDown,
  Lock,
  LogOut,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ActionType =
  | 'enable_bitlocker'
  | 'enable_firewall'
  | 'enable_defender'
  | 'run_defender_quick_scan'
  | 'run_defender_full_scan'
  | 'install_windows_updates'
  | 'lock_screen'
  | 'sign_out_user'
  | 'disable_rdp'
  | 'enable_rdp_nla'
  | 'disable_remote_assistance'
  | 'disable_browser_password_manager'
  | 'disable_builtin_administrator'
  | 'enable_defender_pua'
  | 'enable_defender_cloud'
  | 'update_defender_signatures';

const ACTION_LABELS: Record<ActionType, string> = {
  enable_bitlocker: 'Turn on BitLocker (encrypt C:)',
  enable_firewall: 'Turn on Windows Firewall',
  enable_defender: 'Turn on Defender + update signatures',
  run_defender_quick_scan: 'Run Defender quick scan',
  run_defender_full_scan: 'Run Defender full scan',
  install_windows_updates: 'Install pending Windows updates',
  lock_screen: 'Lock the screen',
  sign_out_user: 'Sign the user out',
  disable_rdp: 'Disable Remote Desktop',
  enable_rdp_nla: 'Require Network Level Auth for RDP',
  disable_remote_assistance: 'Disable Remote Assistance',
  disable_browser_password_manager: 'Disable browser password manager',
  disable_builtin_administrator: 'Disable built-in Administrator',
  enable_defender_pua: 'Enable Defender PUA protection',
  enable_defender_cloud: 'Enable Defender cloud protection',
  update_defender_signatures: 'Update Defender signatures',
};

interface ActionRow {
  id: string;
  action_type: ActionType;
  status: string;
  requested_at: string;
  completed_at: string | null;
  error: string | null;
}

function versionAtLeast(version: string | null | undefined, minimum: string): boolean {
  const parse = (value: string | null | undefined) =>
    String(value ?? '0')
      .replace(/^v/i, '')
      .split('.')
      .map((part) => Number.parseInt(part, 10) || 0);
  const current = parse(version);
  const required = parse(minimum);
  for (let i = 0; i < Math.max(current.length, required.length); i += 1) {
    const a = current[i] ?? 0;
    const b = required[i] ?? 0;
    if (a > b) return true;
    if (a < b) return false;
  }
  return true;
}

export function DeviceActionsMenu({
  deviceId,
  agentVersion,
  disabled,
}: {
  deviceId: string;
  agentVersion?: string | null;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState<ActionType | null>(null);
  const [recent, setRecent] = useState<ActionRow[]>([]);
  const sessionLockSupported = versionAtLeast(agentVersion, '0.1.1');

  const load = async () => {
    const { data } = await supabase
      .from('wrayth_device_actions')
      .select('id, action_type, status, requested_at, completed_at, error')
      .eq('device_id', deviceId)
      .order('requested_at', { ascending: false })
      .limit(5);
    setRecent((data as ActionRow[]) ?? []);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`wrayth-actions-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wrayth_device_actions',
          filter: `device_id=eq.${deviceId}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const run = async (action_type: ActionType, params?: Record<string, unknown>) => {
    if (action_type === 'lock_screen' && !sessionLockSupported) {
      toast.error('Update the Wrayth agent first', {
        description: 'Screen lock needs agent v0.1.1+ so the command runs in the signed-in Windows session.',
      });
      return;
    }
    setPending(action_type);
    try {
      const { error } = await supabase.functions.invoke('agent-action-request', {
        body: { device_id: deviceId, action_type, params: params ?? {} },
      });
      if (error) throw error;
      toast.success('Approved — I sent it to the agent.', {
        description: 'It runs on the next check-in (usually within 30 seconds).',
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error("I couldn't send that action", { description: msg });
    } finally {
      setPending(null);
    }
  };

  const statusIcon = (s: string) => {
    if (s === 'succeeded') return <CheckCircle2 className="h-3 w-3 text-emerald-300" />;
    if (s === 'failed') return <XCircle className="h-3 w-3 text-red-300" />;
    if (s === 'running' || s === 'dispatched')
      return <Loader2 className="h-3 w-3 animate-spin text-violet-300" />;
    return <Sparkles className="h-3 w-3 text-violet-300" />;
  };

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || pending !== null}
            className="border-violet-500/40 text-violet-100 hover:bg-violet-500/10"
          >
            {pending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
            )}
            Ask Ray to fix something
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Protection
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => run('enable_bitlocker')}>
            <ShieldCheck className="mr-2 h-4 w-4" /> {ACTION_LABELS.enable_bitlocker}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run('enable_firewall')}>
            <ShieldCheck className="mr-2 h-4 w-4" /> {ACTION_LABELS.enable_firewall}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run('enable_defender')}>
            <ShieldCheck className="mr-2 h-4 w-4" /> {ACTION_LABELS.enable_defender}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Scans</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => run('run_defender_quick_scan')}>
            <Sparkles className="mr-2 h-4 w-4" /> {ACTION_LABELS.run_defender_quick_scan}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run('run_defender_full_scan')}>
            <Sparkles className="mr-2 h-4 w-4" /> {ACTION_LABELS.run_defender_full_scan}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Maintenance</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => run('install_windows_updates')}>
            <RefreshCw className="mr-2 h-4 w-4" /> {ACTION_LABELS.install_windows_updates}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            If it's lost
          </DropdownMenuLabel>
          <DropdownMenuItem disabled={!sessionLockSupported} onClick={() => run('lock_screen')}>
            <Lock className="mr-2 h-4 w-4" /> {ACTION_LABELS.lock_screen}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run('sign_out_user')}
            className="text-red-300 focus:text-red-200"
          >
            <LogOut className="mr-2 h-4 w-4" /> {ACTION_LABELS.sign_out_user}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {recent.length > 0 && (
        <div className="space-y-1 rounded-md border border-border/60 bg-background/40 p-2">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Recent actions
          </div>
          {recent.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs text-muted-foreground">
              {statusIcon(a.status)}
              <span className="truncate text-foreground/80">
                {ACTION_LABELS[a.action_type] ?? a.action_type}
              </span>
              <span className="ml-auto shrink-0">{a.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeviceActionsMenu;
