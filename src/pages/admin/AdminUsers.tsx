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
import { Sparkles, ShieldCheck, ShieldOff } from 'lucide-react';

import { formatOrgName, formatTier, tierBadgeVariant, relativeTime } from '@/lib/admin/labels';

interface AdminUser {
  id: string; email: string; created_at: string; last_sign_in_at?: string;
  banned_until?: string | null; platform_role?: string | null;
  tier?: string; subscribed?: boolean; rc_balance?: number;
  org_name?: string | null; org_id?: string | null;
  mfa_enabled?: boolean; device_count?: number;
}

interface UserDetail {
  user: any;
  profile: any;
  subscription: any;
  credits: any;
  devices: Array<{ id: string; name: string | null; os: string | null; last_seen_at: string | null; status: string | null }>;
  threats: Array<{ id: string; title: string; severity: string; status: string; created_at: string }>;
  remediations: Array<{ id: string; action_type: string; provider: string; status: string; created_at: string; duration_ms: number | null; reversible?: boolean }>;
  investigations: Array<{ id: string; input_label: string | null; status: string; verdict: string | null; confidence: string | null; created_at: string }>;
  audit: Array<{ id: string; action: string; actor_user_id: string | null; created_at: string; metadata: any }>;
  mfa_enabled: boolean;
  ray_brief: string;
}

export default function AdminUsers() {
  const { isSuperAdmin, has } = usePlatformRole();
  const [items, setItems] = useState<AdminUser[] | null>(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<AdminUser | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const load = () => callAdmin<{ items: AdminUser[] }>('users.list', { search: q }).then((r) => setItems(r.items)).catch((e) => toast.error(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!sel) return;
    setDetail(null);
    callAdmin<UserDetail>('users.get', { id: sel.id }).then(setDetail).catch((e) => toast.error(e.message));
  }, [sel]);

  const filtered = useMemo(() => (items ?? []).filter((u) => {
    const hay = [u.email, u.org_name, u.platform_role].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q.toLowerCase());
  }), [items, q]);

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
            <Input placeholder="Search email, org, role…" value={q} onChange={(e) => setQ(e.target.value)} className="w-72" />
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
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Platform Role</TableHead>
                    <TableHead className="text-center">MFA</TableHead>
                    <TableHead className="text-right">Devices</TableHead>
                    <TableHead className="text-right">RC</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id} className="cursor-pointer" onClick={() => setSel(u)}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell className="text-sm">{formatOrgName(u.org_name, 'personal')}</TableCell>
                      <TableCell><Badge variant={tierBadgeVariant(u.tier)}>{formatTier(u.tier)}</Badge></TableCell>
                      <TableCell>{u.platform_role ? <Badge>{u.platform_role}</Badge> : <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell className="text-center">
                        {u.mfa_enabled
                          ? <ShieldCheck className="h-4 w-4 text-primary inline" aria-label="MFA enabled" />
                          : <ShieldOff className="h-4 w-4 text-muted-foreground inline" aria-label="MFA not enrolled" />}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{u.device_count ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{u.rc_balance ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeTime(u.last_sign_in_at)}</TableCell>
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
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          {sel && (
            <>
              <SheetHeader>
                <SheetTitle>{sel.email}</SheetTitle>
                <SheetDescription>{sel.id}</SheetDescription>
              </SheetHeader>

              {detail?.ray_brief && (
                <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3 flex gap-2 items-start">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-[10px] uppercase tracking-widest text-primary/80 mb-1">Ray Brief</div>
                    {detail.ray_brief}
                  </div>
                </div>
              )}

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="devices">Devices</TabsTrigger>
                  <TabsTrigger value="investigations">Investigations</TabsTrigger>
                  <TabsTrigger value="threats">Threats</TabsTrigger>
                  <TabsTrigger value="remediations">Remediations</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                  <TabsTrigger value="audit">Audit</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-2 mt-4">
                  {!detail ? <Skeleton className="h-32" /> : (
                    <>
                      <Row k="Plan" v={formatTier(detail.subscription?.subscription_tier)} />
                      <Row k="Subscribed" v={String(detail.subscription?.subscribed ?? false)} />
                      <Row k="MFA" v={detail.mfa_enabled ? 'Enrolled' : 'Not enrolled'} />
                      <Row k="RC balance" v={detail.credits?.balance ?? 0} />
                      <Row k="Devices" v={detail.devices.length} />
                      <Row k="Active investigations" v={detail.investigations.filter(i => i.status !== 'completed' && i.status !== 'closed').length} />
                      <Row k="Active threats" v={detail.threats.filter(t => t.status !== 'resolved' && t.status !== 'closed').length} />
                      <Row k="Profile display name" v={detail.profile?.full_name ?? '—'} />
                      <Row k="Created" v={sel.created_at ? new Date(sel.created_at).toLocaleString() : '—'} />
                      <Row k="Last sign-in" v={sel.last_sign_in_at ? new Date(sel.last_sign_in_at).toLocaleString() : '—'} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="devices" className="mt-4">
                  {!detail ? <Skeleton className="h-24" /> :
                    detail.devices.length === 0 ? <Empty msg="No devices enrolled to this user." /> : (
                      <div className="space-y-2">
                        {detail.devices.map((d) => (
                          <div key={d.id} className="flex justify-between border border-border/60 rounded-md p-2 text-sm">
                            <div><div className="font-medium">{d.name ?? d.id}</div><div className="text-xs text-muted-foreground">{d.os ?? '—'}</div></div>
                            <div className="text-xs text-muted-foreground">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : '—'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="investigations" className="mt-4">
                  {!detail ? <Skeleton className="h-24" /> :
                    detail.investigations.length === 0 ? <Empty msg="No investigations opened by or for this user." /> : (
                      <div className="space-y-2">
                        {detail.investigations.map((i) => (
                          <div key={i.id} className="border border-border/60 rounded-md p-2 text-sm space-y-1">
                            <div className="flex justify-between gap-2">
                              <div className="font-medium truncate">{i.input_label ?? i.id.slice(0, 8)}</div>
                              <Badge variant={i.status === 'completed' ? 'default' : 'outline'}>{i.status}</Badge>
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {i.verdict && <Badge variant={i.verdict === 'malicious' ? 'destructive' : 'secondary'}>{i.verdict}</Badge>}
                              <span>{relativeTime(i.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="threats" className="mt-4">
                  {!detail ? <Skeleton className="h-24" /> :
                    detail.threats.length === 0 ? <Empty msg="No security alerts for this user." /> : (
                      <div className="space-y-2">
                        {detail.threats.map((t) => (
                          <div key={t.id} className="border border-border/60 rounded-md p-2 text-sm">
                            <div className="flex justify-between gap-2">
                              <div className="font-medium truncate">{t.title}</div>
                              <Badge variant={t.severity === 'critical' || t.severity === 'high' ? 'destructive' : 'secondary'}>{t.severity}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">{t.status} · {relativeTime(t.created_at)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="remediations" className="mt-4">
                  {!detail ? <Skeleton className="h-24" /> :
                    detail.remediations.length === 0 ? <Empty msg="Ray hasn't run any remediations for this user." /> : (
                      <div className="space-y-2">
                        {detail.remediations.map((r) => (
                          <div key={r.id} className="border border-border/60 rounded-md p-2 text-sm">
                            <div className="flex justify-between gap-2">
                              <div className="font-medium">{r.action_type}</div>
                              <Badge variant={r.status === 'completed' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>{r.status}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground flex gap-2">
                              <span>{r.provider}</span>
                              {r.duration_ms ? <span>{(r.duration_ms / 1000).toFixed(1)}s</span> : null}
                              {r.reversible && <Badge variant="outline">Rollback available</Badge>}
                              <span>{relativeTime(r.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </TabsContent>

                <TabsContent value="billing" className="mt-4 space-y-2">
                  {!detail ? <Skeleton className="h-24" /> : (
                    <>
                      <Row k="Plan" v={formatTier(detail.subscription?.subscription_tier)} />
                      <Row k="Subscribed" v={String(detail.subscription?.subscribed ?? false)} />
                      <Row k="Subscription ends" v={detail.subscription?.subscription_end ? new Date(detail.subscription.subscription_end).toLocaleDateString() : '—'} />
                      <Row k="Stripe customer" v={detail.subscription?.stripe_customer_id ?? '—'} />
                      <Row k="RC balance" v={detail.credits?.balance ?? 0} />
                    </>
                  )}
                </TabsContent>

                <TabsContent value="audit" className="mt-4">
                  {!detail ? <Skeleton className="h-24" /> :
                    detail.audit.length === 0 ? <Empty msg="No admin actions recorded against this user." /> : (
                      <div className="space-y-1">
                        {detail.audit.map((a) => (
                          <div key={a.id} className="border-b border-border/40 py-1.5 text-sm flex justify-between gap-2">
                            <span className="font-medium">{a.action}</span>
                            <span className="text-xs text-muted-foreground">{relativeTime(a.created_at)}</span>
                          </div>
                        ))}
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

function Empty({ msg }: { msg: string }) {
  return <div className="text-sm text-muted-foreground text-center py-6">{msg}</div>;
}
