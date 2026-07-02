/**
 * AgentVersionBadge — channel-aware version tag.
 * Compares the device's installed agent against the latest release for its
 * assigned channel (stable / beta / internal). Lets the user switch channels.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, ChevronDown, RefreshCw, PauseCircle } from 'lucide-react';
import { toast } from 'sonner';

type Channel = 'stable' | 'beta' | 'internal';
type Release = {
  version: string;
  installer_build: string | null;
  download_url: string | null;
  is_rollout_paused: boolean;
};

const CHANNEL_TONE: Record<Channel, string> = {
  stable: 'border-emerald-500/30 text-emerald-200',
  beta: 'border-amber-500/40 text-amber-200',
  internal: 'border-fuchsia-500/40 text-fuchsia-200',
};

export function AgentVersionBadge({
  current,
  deviceId,
  channel = 'stable',
  lastCheckedAt,
}: {
  current: string | null | undefined;
  deviceId?: string;
  channel?: Channel;
  lastCheckedAt?: string | null;
}) {
  const [releases, setReleases] = useState<Record<Channel, Release | null>>({
    stable: null,
    beta: null,
    internal: null,
  });
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const channels: Channel[] = ['stable', 'beta', 'internal'];
      const results = await Promise.all(
        channels.map(async (c) => {
          const { data } = await supabase.rpc('get_latest_agent_release', { _channel: c });
          const row = Array.isArray(data) ? data[0] : null;
          return [c, row as Release | null] as const;
        }),
      );
      if (cancelled) return;
      setReleases(Object.fromEntries(results) as Record<Channel, Release | null>);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latest = releases[channel];
  const behind = useMemo(() => (latest && current ? compare(current, latest.version) < 0 : false), [latest, current]);

  const switchChannel = async (next: Channel) => {
    if (!deviceId || next === channel) return;
    setSwitching(true);
    const { error } = await supabase
      .from('wrayth_devices')
      .update({ release_channel: next, last_update_check_at: new Date().toISOString() })
      .eq('id', deviceId);
    setSwitching(false);
    if (error) toast.error(`Could not switch channel: ${error.message}`);
    else toast.success(`Device moved to ${next} channel`);
  };

  if (!current) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className={`text-[10px] ${CHANNEL_TONE[channel]}`}>
        {channel} · v{current}
      </Badge>
      {latest && behind && (
        <Badge variant="outline" className="flex items-center gap-1 text-[10px] border-amber-500/40 text-amber-200">
          <Download className="h-2.5 w-2.5" /> v{latest.version} available
        </Badge>
      )}
      {latest && !behind && (
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-200">
          up to date
        </Badge>
      )}
      {latest?.is_rollout_paused && (
        <Badge variant="outline" className="flex items-center gap-1 text-[10px] border-red-500/40 text-red-200">
          <PauseCircle className="h-2.5 w-2.5" /> rollout paused
        </Badge>
      )}
      {lastCheckedAt && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <RefreshCw className="h-2.5 w-2.5" />
          checked {new Date(lastCheckedAt).toLocaleString()}
        </span>
      )}
      {deviceId && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" disabled={switching}>
              channel <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Assign release channel</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['stable', 'beta', 'internal'] as Channel[]).map((c) => {
              const r = releases[c];
              return (
                <DropdownMenuItem
                  key={c}
                  disabled={c === channel}
                  onClick={() => switchChannel(c)}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span className="capitalize font-medium">{c}{c === channel ? ' (current)' : ''}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {r ? `latest v${r.version}` : 'no releases yet'}
                    {r?.is_rollout_paused ? ' · paused' : ''}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function compare(a: string, b: string): number {
  const pa = a.replace(/[^\d.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/[^\d.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

export default AgentVersionBadge;
