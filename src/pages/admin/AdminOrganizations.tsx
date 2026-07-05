import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminOrganizations() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { callAdmin<{ items: any[] }>('orgs.list').then((r) => setItems(r.items)).catch(() => setItems([])); }, []);
  return (
    <div>
      <AdminPageHeader title="Organizations" subtitle={items ? `${items.length} tenants` : 'Loading…'} />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {!items ? <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.name ?? '—'}</TableCell>
                      <TableCell><Badge variant="secondary">{o.slug ?? '—'}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.owner_id ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No organizations yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
