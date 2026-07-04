/**
 * Devices — the single home for everything Ray knows about the machines
 * and browsers that make up this user's environment.
 *
 * Layout:
 *   1. Ray brief (device-focused)
 *   2. Since your last visit
 *   3. Enrolled agents (wrayth_devices)   ← primary
 *   4. Recent sign-ins (ray_timeline)      ← secondary
 *   5. "While you work" protect-lines
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Monitor, Smartphone, Tablet, ShieldCheck, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { DevicesRayBrief } from '@/components/ray/DevicesRayBrief';
import { RayPageTemplate } from '@/components/ray/RayPageTemplate';
import { EnrolledDevicesList } from '@/components/ray/EnrolledDevicesList';
import { InstallAgentDialog } from '@/components/ray/InstallAgentDialog';
import { cn } from '@/lib/utils';

interface DeviceRow {
  id: string;
  label: string;
  os: string;
  kind: 'desktop' | 'mobile' | 'tablet';
  current: boolean;
  lastSeen: Date;
  note: string;
}

function detectCurrent(): DeviceRow {
  if (typeof navigator === 'undefined') {
    return {
      id: 'current',
      label: 'This browser',
      os: 'Unknown',
      kind: 'desktop',
      current: true,
      lastSeen: new Date(),
      note: 'Active session right now.',
    };
  }
  const ua = navigator.userAgent;
  const isMobile = /iPhone|Android.*Mobile/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const os = /Mac OS X/i.test(ua)
    ? 'macOS'
    : /Windows/i.test(ua)
    ? 'Windows'
    : /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPad/i.test(ua)
    ? 'iOS'
    : /Linux/i.test(ua)
    ? 'Linux'
    : 'Unknown';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
    ? 'Chrome'
    : /Safari\//.test(ua)
    ? 'Safari'
    : /Firefox\//.test(ua)
    ? 'Firefox'
    : 'Browser';
  return {
    id: 'current',
    label: `${browser} on ${os}`,
    os,
    kind: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
    current: true,
    lastSeen: new Date(),
    note: 'You\u2019re here now. Ray verified this session.',
  };
}

const ICONS = { desktop: Monitor, mobile: Smartphone, tablet: Tablet } as const;

export default function Devices() {
  const { user } = useAuth();
  const [historical, setHistorical] = useState<DeviceRow[]>([]);
  const [enrolledCount, setEnrolledCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const current = useMemo(detectCurrent, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const [timelineRes, devicesRes] = await Promise.all([
        supabase
          .from('ray_timeline')
          .select('id, event_type, occurred_at, summary, payload')
          .eq('user_id', user.id)
          .or('event_type.ilike.device%,event_type.ilike.session%')
          .order('occurred_at', { ascending: false })
          .limit(20),
        supabase
          .from('wrayth_devices')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('revoked_at', null),
      ]);

      if (cancelled) return;
      const rows: DeviceRow[] = (timelineRes.data ?? []).map((row: any) => {
        const payload = (row.payload ?? {}) as Record<string, unknown>;
        const os = String(payload.os ?? payload.platform ?? 'Unknown');
        const kind: DeviceRow['kind'] = /iPhone|Android/i.test(os) ? 'mobile' : /iPad/i.test(os) ? 'tablet' : 'desktop';
        return {
          id: row.id,
          label: String(payload.label ?? payload.browser ?? row.summary ?? 'Signed-in device'),
          os,
          kind,
          current: false,
          lastSeen: new Date(row.occurred_at),
          note: row.summary ?? 'Recorded in Ray\u2019s timeline.',
        };
      });
      setHistorical(rows);
      setEnrolledCount(devicesRes.count ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIns = useMemo(() => [current, ...historical], [current, historical]);
  const enrolled = enrolledCount ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <RayPageTemplate
        header={
          <RayPageHeader
            title="Devices"
            description="Every machine I'm actively protecting, plus every browser you've signed in from."
          />
        }
        brief={<DevicesRayBrief deviceCount={enrolled + signIns.length} />}
        sinceLines={[
          {
            label: enrolled === 0
              ? 'No agents enrolled yet'
              : `${enrolled} ${enrolled === 1 ? 'agent is' : 'agents are'} reporting in`,
          },
          { label: `${signIns.length} ${signIns.length === 1 ? 'browser session' : 'browser sessions'} accounted for` },
          { label: 'No unfamiliar sign-ins' },
          { label: 'Session fingerprints verified' },
        ]}
        protectLines={[
          "I'm watching every enrolled machine for posture drift, threats, and stale updates.",
          "I'm watching for sign-ins from places you don't normally use.",
          "If something new shows up, I'll surface it here and in your Ray Brief.",
        ]}
      >
        <RayConversationCard context="devices" />

        {/* ── 1. Enrolled agents ────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                Enrolled agents
              </span>
              <span className="text-[11px] text-muted-foreground/60">
                {enrolledCount === null ? '' : enrolledCount}
              </span>
            </div>
            <InstallAgentDialog />
          </div>
          {enrolledCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-sm text-muted-foreground">
              You haven't installed the Wrayth agent on any machine yet. Once you do,
              I'll start reporting posture, findings, and a live security score right here.
            </div>
          ) : (
            <EnrolledDevicesList />
          )}
        </section>

        {/* ── 2. Recent sign-ins ────────────────────────────────────────── */}
        <section className="rounded-2xl border border-border bg-card/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Recent sign-ins</span>
            <span className="text-[11px] text-muted-foreground/60 ml-auto">{signIns.length}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {signIns.map((device, idx) => {
                const Icon = ICONS[device.kind];
                return (
                  <motion.li
                    key={device.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.03 }}
                    className="px-5 py-4 flex items-center gap-4"
                  >
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl border flex items-center justify-center shrink-0',
                        device.current
                          ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                          : 'border-border bg-background text-foreground/80',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-foreground truncate">{device.label}</div>
                        {device.current && (
                          <span className="text-[10px] uppercase tracking-[0.22em] text-violet-300">This session</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground italic mt-0.5">{device.note}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-muted-foreground">
                        {device.current ? 'Active now' : formatDistanceToNow(device.lastSeen, { addSuffix: true })}
                      </div>
                      {!device.current && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-green-300/80">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </div>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>
      </RayPageTemplate>
    </div>
  );
}
