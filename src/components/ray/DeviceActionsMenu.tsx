/**
 * DeviceActionsMenu — one-tap action approvals for an enrolled device.
 * Ray proposes; you approve in a single click; the agent executes as SYSTEM.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  | 'disable_firewall'
  | 'enable_defender'
  | 'run_defender_quick_scan'
  | 'run_defender_full_scan'
  | 'install_windows_updates'
  | 'lock_screen'
  | 'sign_out_user'
  | 'disable_rdp'
  | 'enable_rdp'
  | 'enable_rdp_nla'
  | 'disable_rdp_nla'
  | 'disable_remote_assistance'
  | 'enable_remote_assistance'
  | 'disable_browser_password_manager'
  | 'enable_browser_password_manager'
  | 'disable_builtin_administrator'
  | 'enable_builtin_administrator'
  | 'enable_defender_pua'
  | 'disable_defender_pua'
  | 'enable_defender_cloud'
  | 'disable_defender_cloud'
  | 'update_defender_signatures';

const ACTION_LABELS: Record<ActionType, string> = {
  enable_bitlocker: 'Turn on BitLocker (encrypt C:)',
  enable_firewall: 'Turn on Windows Firewall',
  disable_firewall: 'Turn off Windows Firewall',
  enable_defender: 'Turn on Defender + update signatures',
  run_defender_quick_scan: 'Run Defender quick scan',
  run_defender_full_scan: 'Run Defender full scan',
  install_windows_updates: 'Install pending Windows updates',
  lock_screen: 'Lock the screen',
  sign_out_user: 'Sign the user out',
  disable_rdp: 'Disable Remote Desktop',
  enable_rdp: 'Enable Remote Desktop',
  enable_rdp_nla: 'Require Network Level Auth for RDP',
  disable_rdp_nla: 'Remove NLA requirement for RDP',
  disable_remote_assistance: 'Disable Remote Assistance',
  enable_remote_assistance: 'Enable Remote Assistance',
  disable_browser_password_manager: 'Disable browser password manager',
  enable_browser_password_manager: 'Re-enable browser password manager',
  disable_builtin_administrator: 'Disable built-in Administrator',
  enable_builtin_administrator: 'Enable built-in Administrator',
  enable_defender_pua: 'Enable Defender PUA protection',
  disable_defender_pua: 'Disable Defender PUA protection',
  enable_defender_cloud: 'Enable Defender cloud protection',
  disable_defender_cloud: 'Disable Defender cloud protection',
  update_defender_signatures: 'Update Defender signatures',
};

const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  enable_bitlocker:
    'Encrypts the system drive (C:) with BitLocker so data is unreadable if the device is lost or stolen.',
  enable_firewall:
    'Turns on the Windows Defender Firewall for all network profiles, blocking unauthorized inbound connections.',
  disable_firewall:
    'Turns OFF the Windows Defender Firewall on all profiles. Only do this for short-term troubleshooting.',
  enable_defender:
    'Activates Microsoft Defender Antivirus, enables real-time protection, and downloads the latest threat signatures.',
  run_defender_quick_scan:
    'Runs a fast scan of common malware locations to catch active threats without slowing the machine.',
  run_defender_full_scan:
    'Scans every file on the system. Slower but more thorough than a quick scan.',
  install_windows_updates:
    'Downloads and installs all pending Windows security patches and feature updates.',
  lock_screen:
    'Immediately locks the Windows session. The signed-in user must enter their password to unlock.',
  sign_out_user:
    'Signs the currently signed-in user out of Windows. Unsaved work may be lost.',
  disable_rdp:
    'Turns off Remote Desktop so no one can connect to this machine from the network.',
  enable_rdp:
    'Turns Remote Desktop back on and re-enables the RDP firewall rules.',
  enable_rdp_nla:
    'Requires Network Level Authentication for Remote Desktop, blocking weaker legacy connections.',
  disable_rdp_nla:
    'Removes the NLA requirement from Remote Desktop. Less secure — legacy clients can connect.',
  disable_remote_assistance:
    'Disables Remote Assistance so outside helpers cannot take control of the desktop.',
  enable_remote_assistance:
    'Re-enables Windows Remote Assistance invitations.',
  disable_browser_password_manager:
    'Blocks the browser from saving or autofilling passwords via enterprise policy.',
  enable_browser_password_manager:
    'Removes the enterprise policy so the browser\'s built-in password manager works normally again.',
  disable_builtin_administrator:
    'Disables the built-in Windows Administrator account to reduce the attack surface.',
  enable_builtin_administrator:
    'Re-enables the built-in Windows Administrator account. Usually not recommended.',
  enable_defender_pua:
    'Turns on Potentially Unwanted Application (PUA) blocking to catch adware and bundleware.',
  disable_defender_pua:
    'Turns off Defender\'s PUA (adware/bundleware) blocking.',
  enable_defender_cloud:
    'Enables cloud-delivered protection so Defender can check unknown files against Microsoft\'s cloud in real time.',
  disable_defender_cloud:
    'Turns off Defender cloud-delivered protection. Detection of brand-new threats will be slower.',
  update_defender_signatures:
    'Downloads the newest malware definitions so Defender can recognize the latest threats.',
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
    firefox?: { manager_disabled_by_policy?: boolean };
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
  const [confirmAction, setConfirmAction] = useState<{
    action: ActionType;
    params?: Record<string, unknown>;
    label: string;
    description: string;
  } | null>(null);
  const sessionLockSupported = versionAtLeast(agentVersion, '0.1.1');

  const HIGH_RISK: Set<ActionType> = new Set([
    'disable_firewall',
    'enable_rdp',
    'disable_rdp_nla',
    'enable_builtin_administrator',
    'disable_builtin_administrator',
    'disable_rdp',
    'install_windows_updates',
  ]);


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

  const run = async (
    action_type: ActionType,
    params?: Record<string, unknown>,
    opts?: { confirmed?: boolean },
  ) => {
    if (action_type === 'lock_screen' && !sessionLockSupported) {
      toast.error('Update the Wrayth agent first', {
        description: 'Screen lock needs agent v0.1.1+ so the command runs in the signed-in Windows session.',
      });
      return;
    }
    setPending(action_type);
    try {
      const { error } = await supabase.functions.invoke('agent-action-request', {
        body: {
          device_id: deviceId,
          action_type,
          params: params ?? {},
          confirmed: opts?.confirmed ?? false,
        },
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

  const requestAction = (
    action: ActionType,
    params?: Record<string, unknown>,
    label?: string,
  ) => {
    if (HIGH_RISK.has(action)) {
      setConfirmAction({
        action,
        params,
        label: label ?? ACTION_LABELS[action],
        description: ACTION_DESCRIPTIONS[action],
      });
      return;
    }
    run(action, params);
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
        <DropdownMenuContent align="end" className="w-80 max-h-[min(70vh,32rem)] overflow-y-auto">
          {(() => {
            let hiddenCount = 0;

            // Simple one-off action (no toggle state).
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
                  title={ACTION_DESCRIPTIONS[action]}
                  onClick={(e) => {
                    if (satisfied === true) {
                      e.preventDefault();
                      return;
                    }
                    requestAction(action, params, label);
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

            // Toggle row for reversible settings. Shows a Switch reflecting current
            // posture. Flipping it sends the corresponding enable/disable action.
            const Toggle = ({
              label,
              tooltip,
              enableAction,
              disableAction,
              enableParams,
              disableParams,
              satisfied,
            }: {
              label: string;
              tooltip: string;
              enableAction: ActionType;
              disableAction: ActionType;
              enableParams?: Record<string, unknown>;
              disableParams?: Record<string, unknown>;
              // true = currently in the "enabled" (desired-on) state,
              // false = currently off, null = unknown
              satisfied: boolean | null;
            }) => {
              const unknown = satisfied === null;
              // Hide unreported rows by default so the menu doesn't look broken.
              if (unknown && !showAll) {
                hiddenCount += 1;
                return null;
              }
              const checked = satisfied === true;
              const stateLabel = unknown ? 'Not reported' : checked ? 'On' : 'Off';
              const stateClass = unknown
                ? 'bg-muted/40 text-muted-foreground/80 border-border/60'
                : checked
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/25';
              return (
                <div
                  title={tooltip}
                  className="flex items-center justify-between gap-3 px-2 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-foreground/90">{label}</div>
                    <div
                      className={`mt-0.5 inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide ${stateClass}`}
                    >
                      {stateLabel}
                    </div>
                  </div>
                  <Switch
                    checked={checked}
                    disabled={pending !== null || unknown}
                    className={
                      unknown
                        ? 'h-6 w-11 opacity-60'
                        : checked
                          ? 'h-6 w-11 bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_0_3px_hsl(var(--background)),0_0_12px_hsl(160_84%_50%/0.45)] data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-emerald-400'
                          : 'h-6 w-11 data-[state=unchecked]:bg-rose-500/25'
                    }
                    onCheckedChange={(next) => {
                      if (unknown) return;
                      if (next) {
                        requestAction(enableAction, enableParams, label);
                      } else {
                        requestAction(disableAction, disableParams, label);
                      }
                    }}
                  />
                </div>
              );
            };


            const chromeSat = isAlreadySatisfied('disable_browser_password_manager', posture, { browser: 'chrome' });
            const edgeSat = isAlreadySatisfied('disable_browser_password_manager', posture, { browser: 'edge' });
            const firefoxSat = isAlreadySatisfied('disable_browser_password_manager', posture, { browser: 'firefox' });

            const sections = (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Protection
                </DropdownMenuLabel>
                <Item action="enable_bitlocker" icon={ShieldCheck} />
                <Toggle
                  label="Windows Firewall"
                  tooltip={ACTION_DESCRIPTIONS.enable_firewall}
                  enableAction="enable_firewall"
                  disableAction="disable_firewall"
                  satisfied={isAlreadySatisfied('enable_firewall', posture)}
                />
                <Item action="enable_defender" icon={ShieldCheck} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Defender</DropdownMenuLabel>
                <Item action="run_defender_quick_scan" icon={Sparkles} forceEnabled />
                <Item action="run_defender_full_scan" icon={Sparkles} forceEnabled />
                <Toggle
                  label="Defender PUA protection"
                  tooltip={ACTION_DESCRIPTIONS.enable_defender_pua}
                  enableAction="enable_defender_pua"
                  disableAction="disable_defender_pua"
                  satisfied={isAlreadySatisfied('enable_defender_pua', posture)}
                />
                <Toggle
                  label="Defender cloud protection"
                  tooltip={ACTION_DESCRIPTIONS.enable_defender_cloud}
                  enableAction="enable_defender_cloud"
                  disableAction="disable_defender_cloud"
                  satisfied={isAlreadySatisfied('enable_defender_cloud', posture)}
                />
                <Item action="update_defender_signatures" icon={RefreshCw} />
                {(posture?.rdp_security || showAll) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Remote access</DropdownMenuLabel>
                    <Toggle
                      label="Remote Desktop (RDP)"
                      tooltip="On = RDP allowed. Off = incoming Remote Desktop connections blocked."
                      enableAction="enable_rdp"
                      disableAction="disable_rdp"
                      satisfied={
                        posture?.rdp_security?.rdp_enabled === undefined
                          ? null
                          : posture.rdp_security.rdp_enabled === true
                      }
                    />
                    <Toggle
                      label="Require NLA for RDP"
                      tooltip={ACTION_DESCRIPTIONS.enable_rdp_nla}
                      enableAction="enable_rdp_nla"
                      disableAction="disable_rdp_nla"
                      satisfied={isAlreadySatisfied('enable_rdp_nla', posture)}
                    />
                    <Toggle
                      label="Remote Assistance allowed"
                      tooltip="On = users can invite helpers. Off = Remote Assistance blocked."
                      enableAction="enable_remote_assistance"
                      disableAction="disable_remote_assistance"
                      satisfied={
                        posture?.rdp_security?.remote_assistance_enabled === undefined
                          ? null
                          : posture.rdp_security.remote_assistance_enabled === true
                      }
                    />
                  </>
                )}
                {(posture?.browser_passwords || showAll) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Browser password managers</DropdownMenuLabel>
                    <Toggle
                      label="Chrome password manager disabled"
                      tooltip={ACTION_DESCRIPTIONS.disable_browser_password_manager}
                      enableAction="disable_browser_password_manager"
                      disableAction="enable_browser_password_manager"
                      enableParams={{ browser: 'chrome' }}
                      disableParams={{ browser: 'chrome' }}
                      satisfied={chromeSat}
                    />
                    <Toggle
                      label="Edge password manager disabled"
                      tooltip={ACTION_DESCRIPTIONS.disable_browser_password_manager}
                      enableAction="disable_browser_password_manager"
                      disableAction="enable_browser_password_manager"
                      enableParams={{ browser: 'edge' }}
                      disableParams={{ browser: 'edge' }}
                      satisfied={edgeSat}
                    />
                    <Toggle
                      label="Firefox password manager disabled"
                      tooltip={ACTION_DESCRIPTIONS.disable_browser_password_manager}
                      enableAction="disable_browser_password_manager"
                      disableAction="enable_browser_password_manager"
                      enableParams={{ browser: 'firefox' }}
                      disableParams={{ browser: 'firefox' }}
                      satisfied={firefoxSat}
                    />
                  </>
                )}
                {(posture?.local_admins_detail || showAll) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Local accounts</DropdownMenuLabel>
                    <Toggle
                      label="Built-in Administrator disabled"
                      tooltip={ACTION_DESCRIPTIONS.disable_builtin_administrator}
                      enableAction="disable_builtin_administrator"
                      disableAction="enable_builtin_administrator"
                      satisfied={isAlreadySatisfied('disable_builtin_administrator', posture)}
                    />
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Maintenance</DropdownMenuLabel>
                <Item action="install_windows_updates" icon={RefreshCw} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  If it's lost
                </DropdownMenuLabel>
                <DropdownMenuItem
                  title={ACTION_DESCRIPTIONS.lock_screen}
                  disabled={!sessionLockSupported}
                  onClick={() => requestAction('lock_screen')}
                >
                  <Lock className="mr-2 h-4 w-4" /> {ACTION_LABELS.lock_screen}
                </DropdownMenuItem>
                <DropdownMenuItem
                  title={ACTION_DESCRIPTIONS.sign_out_user}
                  onClick={() => requestAction('sign_out_user')}
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
                        ? 'Hide already-configured & unreported items'
                        : `Show ${hiddenCount} configured / unreported item${hiddenCount === 1 ? '' : 's'}`}
                    </DropdownMenuItem>
                  </>
                )}
              </>
            );
          })()}
        </DropdownMenuContent>

      </DropdownMenu>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.label}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
              <br />
              <br />
              This is a high-impact change. Are you sure you want Ray to run it on this device?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmAction) return;
                const { action, params } = confirmAction;
                setConfirmAction(null);
                run(action, params, { confirmed: true });
              }}
            >
              Yes, run it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


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
