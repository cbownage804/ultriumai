/**
 * Admin → Organizations (Phase 3A).
 *
 * Every tenant is a real object: name (with Personal Workspace fallback),
 * plan, owner, member/device counts, last activity. Row click drills into
 * the org detail workspace.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Building2, ChevronRight } from 'lucide-react';
import { formatOrgName, formatOwnerLabel, formatTier, relativeTime, tierBadgeVariant } from '@/lib/admin/labels';

interface AdminOrg {
  id: string;
  name: string | null;
  slug: string | null;
  owner_id: string | null;
  owner_email?: string | null;
  owner_display_name?: string | null;
  tier?: string | null;
  member_count?: number;
  device_count?: number;
  created_at?: string | null;
  last_activity_at?: string | null;
}

export default function AdminOrganizations() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminOrg[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(() => {
    setErr(null);
    callAdmin<{ items: AdminOrg[] }>('orgs.list')
      .then((r) => setItems(r.items ?? []))
      .catch((e) => { setErr(e.message); setItems([]); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((o) => {
      const hay = [
        o.name, o.slug, o.owner_email, o.owner_display_name,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q]);

  return (
    <div>
      <AdminPageHeader
        title="Organizations"
        subtitle={items ? `${items.length} ${items.length === 1 ? 'tenant' : 'tenants'}` : 'Loading…'}
        actions={
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search name, slug, owner…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-72"
            />
            <Button variant="outline" onClick={load}>Refresh</Button>
          </div>
        }
      />
      <div className="p-6">
        <PageState
          isLoading={items === null && !err}
          hasData={(items ?? []).length > 0}
          loading={<div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}
          empty={
            <RayZeroState
              icon={Building2}
              title="No organizations yet."
              body={
                <>
                  When a customer creates a workspace or an MSP onboards a client,
                  their organization appears here with owner, plan, member and
                  device counts.
                </>
              }
              expectations={[
                'Company name, plan, and primary owner',
                'Live seat and device counts',
                'Last activity across the tenant',
                'One-click drill into users, devices, remediations, billing',
              ]}
            />
          }
        >
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                    <TableHead className="text-right">Devices</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => navigate(`/admin/organizations/${o.id}`)}
                    >
                      <TableCell>
                        <div className="font-medium">{formatOrgName(o.name)}</div>
                        <div className="text-xs text-muted-foreground">
                          {o.slug ?? o.id.slice(0, 8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tierBadgeVariant(o.tier)}>{formatTier(o.tier)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatOwnerLabel(o.owner_email, o.owner_display_name)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{o.member_count ?? 0}</TableCell>
                      <TableCell className="text-right tabular-nums">{o.device_count ?? 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {relativeTime(o.last_activity_at ?? o.created_at)}
                      </TableCell>
                      <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                        No organizations match &ldquo;{q}&rdquo;.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </PageState>
        {err && <p className="text-xs text-destructive mt-3">{err}</p>}
      </div>
    </div>
  );
}
