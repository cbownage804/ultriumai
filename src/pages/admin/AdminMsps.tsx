import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export default function AdminMsps() {
  const [items, setItems] = useState<any[] | null>(null);
  const [sel, setSel] = useState<any | null>(null);
  const [detail, setDetail] = useState<any>(null);
  useEffect(() => { callAdmin<{ items: any[] }>('msps.list').then((r) => setItems(r.items)).catch(() => setItems([])); }, []);
  useEffect(() => { if (!sel) return; setDetail(null); callAdmin('msps.get', { id: sel.id }).then(setDetail); }, [sel]);

  return (
    <div>
      <AdminPageHeader title="MSPs & Clients" subtitle={items ? `${items.length} MSPs` : 'Loading…'} />
      <div className="p-6 grid gap-4 md:grid-cols-2">
        {!items ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />) :
          items.length === 0 ? <div className="col-span-2 text-sm text-muted-foreground">No MSPs registered.</div> :
          items.map((m) => (
            <Card key={m.id} className="cursor-pointer hover:border-primary/50 transition" onClick={() => setSel(m)}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">{(m.clients?.length ?? 0)} clients</div>
                </div>
                <Badge variant={m.status === 'active' ? 'default' : 'secondary'}>{m.plan ?? m.status ?? '—'}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(m.clients ?? []).slice(0, 4).map((c: any) => (
                    <div key={c.id} className="flex justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.status ?? '—'}</span>
                    </div>
                  ))}
                  {(m.clients?.length ?? 0) > 4 && <div className="text-xs text-muted-foreground">+{m.clients.length - 4} more</div>}
                </div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      {sel && (
        <div className="fixed inset-0 bg-background/95 z-50 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setSel(null)}>← Back</Button>
              <h2 className="text-2xl font-semibold">{sel.name}</h2>
            </div>
            {!detail ? <Skeleton className="h-64" /> : (
              <div className="space-y-6">
                <Card>
                  <CardHeader><CardTitle>Clients ({detail.clients.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {detail.clients.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between border-b border-border/40 py-2">
                        <div><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.status}</div></div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card><CardHeader><CardTitle className="text-base">Staff ({detail.staff.length})</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">{detail.staff.map((s: any) => <div key={s.id}>{s.email ?? s.user_id}</div>)}</CardContent>
                  </Card>
                  <Card><CardHeader><CardTitle className="text-base">Recent revenue</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      {detail.revenue.slice(0, 6).map((r: any) => (
                        <div key={r.id} className="flex justify-between"><span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span><span>${Number(r.amount ?? 0).toFixed(2)}</span></div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
