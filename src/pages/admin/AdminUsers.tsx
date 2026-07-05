import { useEffect, useMemo, useState } from 'react';
import { callAdmin, usePlatformRole } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminUser {
  id: string; email: string; created_at: string; last_sign_in_at?: string;
  banned_until?: string | null; platform_role?: string | null;
  tier?: string; subscribed?: boolean; rc_balance?: number;
}

export default function AdminUsers() {
  const { isSuperAdmin, has } = usePlatformRole();
  const [items, setItems] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<AdminUser | null>(null);
  const [detail, setDetail] = useState<any>(null);

  const load = () => callAdmin<{ items: AdminUser[] }>('users.list', { search: q }).then((r) => setItems(r.items)).catch((e) => toast.error(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!sel) return;
    setDetail(null);
    callAdmin('users.get', { id: sel.id }).then(setDetail).catch((e) => toast.error(e.message));
  }, [sel]);

  const filtered = useMemo(() => (items ?? []).filter((u) => u.email?.toLowerCase().includes(q.toLowerCase())), [items, q]);

  const act = async (action: string, body: Record<string, unknown>, success: string) => {
    try { await callAdmin(action, body); toast.success(success); load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <AdminPageHeader
        title="Users"
        subtitle={items ? `${items.length} accounts` : 'Loading…'}
        actions={
          <div className="flex gap-2 items-center">
            <Input placeholder="Search email…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
            <Button variant="outline" onClick={load}>Refresh</Button>
          </div>
        }
      />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {!items ? <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Platform Role</TableHead>
                    <TableHead>RC</TableHead>
                    <TableHead>Last sign-in</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => setSel(u)}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell><Badge variant="secondary">{u.tier ?? 'free'}</Badge></TableCell>
                      <TableCell>{u.platform_role ? <Badge>{u.platform_role}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell>{u.rc_balance ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : '—'}</TableCell>
                      <TableCell>
                        {u.banned_until && u.banned_until !== 'none' ? <Badge variant="destructive">Suspended</Badge> : <Badge variant="outline">Active</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.email}</SheetTitle>
                <SheetDescription>{sel.id}</SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="devices">Devices</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-3 mt-4">
                  {!detail ? <Skeleton className="h-32" /> : (
                    <>
                      <Row k="Tier" v={detail.subscription?.subscription_tier ?? 'free'} />
                      <Row k="Subscribed" v={String(detail.subscription?.subscribed ?? false)} />
                      <Row k="Subscription ends" v={detail.subscription?.subscription_end ?? '—'} />
                      <Row k="RC balance" v={detail.credits?.balance ?? 0} />
                      <Row k="Profile display name" v={detail.profile?.display_name ?? '—'} />
                      <Row k="Created" v={sel.created_at ? new Date(sel.created_at).toLocaleString() : '—'} />
                      <Row k="Last sign-in" v={sel.last_sign_in_at ? new Date(sel.last_sign_in_at).toLocaleString() : '—'} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="devices" className="mt-4">
                  {!detail ? <Skeleton className="h-24" /> : (
                    <div className="space-y-2">
                      {detail.devices.length === 0 ? <div className="text-sm text-muted-foreground">No devices.</div> :
                        detail.devices.map((d: any) => (
                          <div key={d.id} className="flex justify-between border border-border/60 rounded-md p-2 text-sm">
                            <div><div className="font-medium">{d.name ?? d.id}</div><div className="text-xs text-muted-foreground">{d.os}</div></div>
                            <div className="text-xs text-muted-foreground">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : '—'}</div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="mt-4 space-y-3">
                  {has('support') && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => act('users.reset_password', { id: sel.id, email: sel.email }, 'Reset link generated (see console)')}>Send Reset</Button>
                      <Button size="sm" variant="outline" onClick={() => act('users.suspend', { id: sel.id, unban: !!sel.banned_until }, sel.banned_until ? 'Unsuspended' : 'Suspended')}>
                        {sel.banned_until && sel.banned_until !== 'none' ? 'Unsuspend' : 'Suspend'}
                      </Button>
                    </div>
                  )}
                  {has('billing_ops') && (
                    <div className="flex gap-2 items-center">
                      <Input type="number" placeholder="RC delta (+/-)" id="rc-delta" className="w-40" />
                      <Button size="sm" onClick={() => {
                        const el = document.getElementById('rc-delta') as HTMLInputElement;
                        const n = Number(el?.value || 0);
                        if (!n) return;
                        act('users.grant_credits', { id: sel.id, delta: n, reason: 'admin grant' }, `${n > 0 ? '+' : ''}${n} RC applied`);
                      }}>Grant RC</Button>
                    </div>
                  )}
                  {isSuperAdmin && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
                      <Button size="sm" variant="secondary" onClick={async () => {
                        const r = await callAdmin<{ link: string }>('users.impersonate', { id: sel.id, email: sel.email });
                        if (r.link) { navigator.clipboard?.writeText(r.link); toast.success('Impersonation link copied'); }
                      }}>Impersonate</Button>
                      {(['support', 'billing_ops', 'platform_ops', 'super_admin'] as const).map((r) => (
                        <Button key={r} size="sm" variant="outline" onClick={() => act('users.grant_role', { id: sel.id, role: r }, `Granted ${r}`)}>Grant {r}</Button>
                      ))}
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm(`Permanently delete ${sel.email}? This cannot be undone.`)) {
                          act('users.delete', { id: sel.id }, 'User deleted');
                          setSel(null);
                        }
                      }}>Delete User</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex justify-between text-sm border-b border-border/40 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{String(v)}</span>
    </div>
  );
}
