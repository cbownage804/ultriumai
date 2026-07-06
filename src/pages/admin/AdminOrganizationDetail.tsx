/**
 * Admin → Organization Detail (Phase 3A).
 *
 * Complete workspace for a single tenant: Overview, Users, Devices,
 * Remediations, Activity, Billing. All data is loaded server-side via
 * `admin-api::orgs.get` — never faked.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard } from '@/components/admin/AdminPrimitives';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { formatOrgName, formatOwnerLabel, formatTier, relativeTime, tierBadgeVariant } from '@/lib/admin/labels';

interface OrgDetail {
  org: {
    id: string;
    name: string | null;
    slug: string | null;
    owner_id: string | null;
    owner_email: string | null;
    owner_display_name: string | null;
    tier: string | null;
    billing_email: string | null;
    created_at: string | null;
    last_activity_at: string | null;
  } | null;
  members: Array<{ user_id: string; email: string | null; role: string; status: string; joined_at: string | null; last_sign_in_at: string | null }>;
  devices: Array<{ id: string; hostname: string | null; agent_version: string | null; status: string | null; last_checkin: string | null }>;
  remediations: Array<{ id: string; action_type: string; provider: string; status: string; created_at: string; duration_ms: number | null; reversible?: boolean }>;
  timeline: Array<{ id: string; occurred_at: string; category: string; summary: string; severity: string }>;
  investigations: Array<{ id: string; input_label: string | null; status: string; verdict: string | null; confidence: string | null; created_at: string }>;
  health: {
    overall_score: number; score_delta: number;
    identity_score: number; device_score: number; threat_score: number;
    exposure_score: number; compliance_score: number;
  } | null;
  active_threats: number;
  ray_brief: string;
  billing: {
    stripe_customer_id: string | null;
    subscription_end: string | null;
    seats: number;
    max_seats: number | null;
    rc_balance: number;
  };
}

const EMPTY_HINT = 'No data yet — will populate as the tenant becomes active.';

export default function AdminOrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setErr(null);
    setDetail(null);
    callAdmin<OrgDetail>('orgs.get', { id })
      .then(setDetail)
      .catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const org = detail?.org ?? null;
  const displayName = formatOrgName(org?.name);

  return (
    <div>
      <AdminPageHeader
        title={displayName}
        subtitle={org?.slug ?? id ?? ''}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/organizations')}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> All organizations
            </Button>
            <Button variant="outline" size="sm" onClick={load}>Refresh</Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {err && <p className="text-sm text-destructive">{err}</p>}

        {!detail ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <>
            {/* Ray brief */}
            {detail.ray_brief && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex gap-3 items-start">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="text-[10px] uppercase tracking-widest text-primary/80 mb-1">Ray Brief</div>
                    {detail.ray_brief}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Header meta strip */}
            <div className="grid gap-4 md:grid-cols-4">
              <AdminMetricCard label="Plan" value={<Badge variant={tierBadgeVariant(org?.tier)}>{formatTier(org?.tier)}</Badge>} />
              <AdminMetricCard label="Owner" value={<span className="text-base font-semibold">{formatOwnerLabel(org?.owner_email, org?.owner_display_name)}</span>} />
              <AdminMetricCard label="Members" value={detail.members.length + 1} hint={`${detail.members.filter(m => m.status === 'active').length} active`} />
              <AdminMetricCard label="Devices" value={detail.devices.length} hint={`${detail.devices.filter(d => d.status === 'online' || d.status === 'active').length} online`} />
            </div>

            {/* Security posture */}
            <div className="grid gap-4 md:grid-cols-4">
              <AdminMetricCard label="Security score" value={detail.health?.overall_score ?? '—'} hint={detail.health ? `${detail.health.score_delta > 0 ? '+' : ''}${detail.health.score_delta} this week` : 'Awaiting first snapshot'} />
              <AdminMetricCard label="Active threats" value={detail.active_threats} hint={detail.active_threats === 0 ? 'All clear' : 'Needs review'} />
              <AdminMetricCard label="Investigations" value={detail.investigations.length} hint={`${detail.investigations.filter(i => i.status !== 'completed' && i.status !== 'closed').length} open`} />
              <AdminMetricCard label="Remediations" value={detail.remediations.length} hint={`${detail.remediations.filter(r => r.status === 'completed').length} completed`} />
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="investigations">Investigations</TabsTrigger>
                <TabsTrigger value="remediations">Remediations</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>


              <TabsContent value="overview" className="mt-4">
                <Card>
                  <CardContent className="p-6 space-y-3 text-sm">
                    <Row k="Organization ID" v={org?.id ?? '—'} />
                    <Row k="Slug" v={org?.slug ?? '—'} />
                    <Row k="Owner" v={formatOwnerLabel(org?.owner_email, org?.owner_display_name)} />
                    <Row k="Billing email" v={org?.billing_email ?? org?.owner_email ?? '—'} />
                    <Row k="Created" v={org?.created_at ? new Date(org.created_at).toLocaleString() : '—'} />
                    <Row k="Last activity" v={relativeTime(org?.last_activity_at ?? org?.created_at)} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {detail.members.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        This organization has no members yet — only the owner.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Last sign-in</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.members.map((m) => (
                            <TableRow key={m.user_id}>
                              <TableCell className="font-medium">{m.email ?? m.user_id.slice(0, 8)}</TableCell>
                              <TableCell><Badge variant="secondary">{m.role}</Badge></TableCell>
                              <TableCell>
                                <Badge variant={m.status === 'active' ? 'default' : 'outline'}>{m.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{m.joined_at ? new Date(m.joined_at).toLocaleDateString() : '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{relativeTime(m.last_sign_in_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="devices" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {detail.devices.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No devices enrolled yet. The Wrayth agent installs into this tenant will appear here.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hostname</TableHead>
                            <TableHead>Agent</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last check-in</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.devices.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium">{d.hostname ?? d.id.slice(0, 8)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{d.agent_version ?? '—'}</TableCell>
                              <TableCell><Badge variant={d.status === 'online' ? 'default' : 'outline'}>{d.status ?? 'unknown'}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{relativeTime(d.last_checkin)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="investigations" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    {detail.investigations.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No investigations opened for this organization yet.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Verdict</TableHead>
                            <TableHead>Confidence</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Opened</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.investigations.map((i) => (
                            <TableRow key={i.id}>
                              <TableCell className="font-medium max-w-[24rem] truncate">{i.input_label ?? i.id.slice(0, 8)}</TableCell>
                              <TableCell>{i.verdict ? <Badge variant={i.verdict === 'malicious' ? 'destructive' : i.verdict === 'benign' ? 'default' : 'secondary'}>{i.verdict}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{i.confidence ?? '—'}</TableCell>
                              <TableCell><Badge variant={i.status === 'completed' ? 'default' : 'outline'}>{i.status}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{relativeTime(i.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="remediations" className="mt-4">

                <Card>
                  <CardContent className="p-0">
                    {detail.remediations.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        Ray hasn't run any remediations for this organization yet.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>When</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.remediations.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.action_type}</TableCell>
                              <TableCell><Badge variant="outline">{r.provider}</Badge></TableCell>
                              <TableCell><Badge variant={r.status === 'completed' ? 'default' : r.status === 'failed' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{r.duration_ms ? `${(r.duration_ms / 1000).toFixed(1)}s` : '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{relativeTime(r.created_at)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="p-6">
                    {detail.timeline.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-6">{EMPTY_HINT}</div>
                    ) : (
                      <div className="space-y-3">
                        {detail.timeline.map((e) => (
                          <div key={e.id} className="flex gap-3 text-sm border-b border-border/40 pb-2">
                            <div className="text-xs text-muted-foreground w-32 shrink-0">{relativeTime(e.occurred_at)}</div>
                            <Badge variant="outline" className="shrink-0">{e.category}</Badge>
                            <div className="flex-1">{e.summary}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="billing" className="mt-4">
                <Card>
                  <CardContent className="p-6 space-y-3 text-sm">
                    <Row k="Current plan" v={formatTier(org?.tier)} />
                    <Row k="Seats used" v={`${detail.billing.seats}${detail.billing.max_seats ? ` / ${detail.billing.max_seats}` : ''}`} />
                    <Row k="Renewal" v={detail.billing.subscription_end ? new Date(detail.billing.subscription_end).toLocaleDateString() : '—'} />
                    <Row k="Ray Compute balance" v={detail.billing.rc_balance.toLocaleString()} />
                    <Row k="Stripe customer" v={detail.billing.stripe_customer_id ?? '—'} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1.5">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}
