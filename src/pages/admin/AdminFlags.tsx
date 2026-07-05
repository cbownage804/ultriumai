import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function AdminFlags() {
  const [items, setItems] = useState<any[] | null>(null);
  const load = () => callAdmin<{ items: any[] }>('ops.flags.list').then((r) => setItems(r.items)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const toggle = async (id: string, enabled: boolean) => {
    try { await callAdmin('ops.flags.toggle', { id, enabled }); toast.success('Flag updated'); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <div>
      <AdminPageHeader title="Feature Flags" subtitle="Toggle platform-wide capabilities" />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {!items ? <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> :
              items.length === 0 ? <div className="p-6 text-sm text-muted-foreground">No feature flags configured.</div> :
              <div className="divide-y divide-border/40">
                {items.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{f.flag_name ?? f.flag_key}</div>
                      <div className="text-xs text-muted-foreground">{f.description ?? f.flag_key}</div>
                    </div>
                    <Switch checked={!!f.is_enabled} onCheckedChange={(v) => toggle(f.id, v)} />
                  </div>
                ))}
              </div>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
