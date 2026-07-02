/**
 * AgentVersionBadge — shows whether the installed agent is up to date, using
 * the wrayth_agent_release table as the source of truth. When any of the
 * user's devices are behind the latest release, we surface a compact notice.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';

export function AgentVersionBadge({ current }: { current: string | null | undefined }) {
  const [latest, setLatest] = useState<{ version: string; installer_build: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('wrayth_agent_release')
        .select('version, installer_build')
        .eq('is_latest', true)
        .order('released_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setLatest(data);
    })();
  }, []);

  if (!latest || !current) return null;
  const behind = compare(current, latest.version) < 0;
  if (!behind) {
    return <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-200">agent up to date</Badge>;
  }
  return (
    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-200 flex items-center gap-1">
      <Download className="h-2.5 w-2.5" /> update available (v{latest.version})
    </Badge>
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
