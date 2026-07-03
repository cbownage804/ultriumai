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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

interface PostureShape {
  disk_encryption?: { enabled?: boolean; percent_encrypted?: number };
  firewall?: { enabled?: boolean; all_profiles_enabled?: boolean };
  antivirus?: { enabled?: boolean; realtime_protection?: boolean; definitions_age_days?: number };
  rdp_security?: { rdp_enabled?: boolean; nla_enabled?: boolean; remote_assistance_enabled?: boolean };
  browser_passwords?: {
    chrome?: { manager_disabled_by_policy?: boolean };
    edge?: { manager_disabled_by_policy?: boolean };
  };
  defender_detail?: { cloud_protection?: boolean; pua_protection?: boolean };
  local_admins_detail?: Array<{ name: string; enabled?: boolean; is_builtin?: boolean }>;
  pending_updates?: number;
}

/**
 * For each action, decide whether the device is already in the target state.
 * Returns `true` when the action would be a no-op ("already on" / "already off").
 * Returns `false` when the action is still relevant.
 * Returns `null` when we don't have enough posture data to judge.
 */
function isAlreadySatisfied(
  action: ActionType,
  posture: PostureShape | null | undefined,
  params?: Record<string, unknown>,
): boolean | null {
  if (!posture) return null;
  switch (action) {
    case 'enable_bitlocker': {
      const e = posture.disk_encryption;
      if (!e) return null;
      if (e.enabled === true) return true;
      if (typeof e.percent_encrypted === 'number' && e.percent_encrypted >= 100) return true;
      return false;
    }
    case 'enable_firewall': {
      const f = posture.firewall;
      if (!f) return null;
      return f.all_profiles_enabled === true || f.enabled === true ? true : false;
    }
    case 'enable_defender': {
      const a = posture.antivirus;
      if (!a) return null;
      return a.enabled === true && a.realtime_protection !== false ? true : false;
    }
    case 'enable_defender_cloud': {
      const v = posture.defender_detail?.cloud_protection;
      return v === undefined ? null : v === true;
    }
    case 'enable_defender_pua': {
      const v = posture.defender_detail?.pua_protection;
      return v === undefined ? null : v === true;
    }
    case 'update_defender_signatures': {
      const d = posture.antivirus?.definitions_age_days;
      if (d === undefined) return null;
      return d <= 1;
    }
    case 'disable_rdp': {
      const v = posture.rdp_security?.rdp_enabled;
      return v === undefined ? null : v === false;
    }
    case 'enable_rdp_nla': {
      const r = posture.rdp_security;
      if (!r) return null;
      // Not applicable if RDP is off — mark satisfied so it collapses.
      if (r.rdp_enabled === false) return true;
      return r.nla_enabled === undefined ? null : r.nla_enabled === true;
    }
    case 'disable_remote_assistance': {
      const v = posture.rdp_security?.remote_assistance_enabled;
      return v === undefined ? null : v === false;
    }
    case 'disable_browser_password_manager': {
      const browser = (params?.browser as 'chrome' | 'edge' | undefined) ?? undefined;
      if (!browser) return null;
      const v = posture.browser_passwords?.[browser]?.manager_disabled_by_policy;
      return v === undefined ? null : v === true;
    }
    case 'disable_builtin_administrator': {
      const admins = posture.local_admins_detail;
      if (!admins || admins.length === 0) return null;
      const builtin = admins.find((a) => a.is_builtin);
      if (!builtin) return null;
      return builtin.enabled === false;
    }
    case 'install_windows_updates': {
      const n = posture.pending_updates;
      return n === undefined ? null : n === 0;
    }
    default:
      return null;
  }
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
  posture,
}: {
  deviceId: string;
  agentVersion?: string | null;
  disabled?: boolean;
  posture?: PostureShape | null;
}) {
  const [pending, setPending] = useState<ActionType | null>(null);
  const [recent, setRecent] = useState<ActionRow[]>([]);
  const [showAll, setShowAll] = useState(false);
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
        <DropdownMenuContent align="end" className="w-72 max-h-[min(70vh,32rem)] overflow-y-auto">
          {(() => {
            let hiddenCount = 0;

            const Item = ({
              action,
              icon: Icon,
              label,
              params,
              className,
              forceEnabled,
            }: {
              action: ActionType;
              icon: typeof ShieldCheck;
              label?: string;
              params?: Record<string, unknown>;
              className?: string;
              forceEnabled?: boolean;
            }) => {
              const satisfied = forceEnabled ? false : isAlreadySatisfied(action, posture, params);
              if (satisfied === true && !showAll) {
                hiddenCount += 1;
                return null;
              }
              const text = label ?? ACTION_LABELS[action];
              return (
                <DropdownMenuItem
                  onClick={(e) => {
                    if (satisfied === true) {
                      e.preventDefault();
                      return;
                    }
                    run(action, params);
                  }}
                  className={className}
                >
                  {satisfied === true ? (
                    <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                  ) : (
                    <Icon className="mr-2 h-4 w-4" />
                  )}
                  <span className={satisfied === true ? 'text-muted-foreground line-through' : ''}>
                    {text}
                  </span>
                  {satisfied === true && (
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-emerald-400/80">
                      done
                    </span>
                  )}
                </DropdownMenuItem>
              );
            };

            const sections = (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Protection
                </DropdownMenuLabel>
                <Item action="enable_bitlocker" icon={ShieldCheck} />
                <Item action="enable_firewall" icon={ShieldCheck} />
                <Item action="enable_defender" icon={ShieldCheck} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Scans</DropdownMenuLabel>
                <Item action="run_defender_quick_scan" icon={Sparkles} forceEnabled />
                <Item action="run_defender_full_scan" icon={Sparkles} forceEnabled />
                <Item action="enable_defender_pua" icon={ShieldCheck} />
                <Item action="enable_defender_cloud" icon={ShieldCheck} />
                <Item action="update_defender_signatures" icon={RefreshCw} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Remote access</DropdownMenuLabel>
                <Item action="disable_rdp" icon={ShieldCheck} />
                <Item action="enable_rdp_nla" icon={ShieldCheck} />
                <Item action="disable_remote_assistance" icon={ShieldCheck} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Passwords & accounts</DropdownMenuLabel>
                <Item
                  action="disable_browser_password_manager"
                  icon={ShieldCheck}
                  label="Disable Chrome password manager"
                  params={{ browser: 'chrome' }}
                />
                <Item
                  action="disable_browser_password_manager"
                  icon={ShieldCheck}
                  label="Disable Edge password manager"
                  params={{ browser: 'edge' }}
                />
                <Item action="disable_builtin_administrator" icon={ShieldCheck} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Maintenance</DropdownMenuLabel>
                <Item action="install_windows_updates" icon={RefreshCw} />
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
              </>
            );

            return (
              <>
                {sections}
                {(hiddenCount > 0 || showAll) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowAll((v) => !v);
                      }}
                      className="text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-400" />
                      {showAll
                        ? 'Hide already-configured items'
                        : `Show ${hiddenCount} already-configured item${hiddenCount === 1 ? '' : 's'}`}
                    </DropdownMenuItem>
                  </>
                )}
              </>
            );
          })()}
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
