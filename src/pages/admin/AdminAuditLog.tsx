import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminAuditLog() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { callAdmin<{ items: any[] }>('ops.audit.list', { limit: 300 }).then((r) => setItems(r.items)).catch(() => setItems([])); }, []);
  return (
    <div>
      <AdminPageHeader title="Audit Log" subtitle="Every privileged admin action" />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {!items ? <div className="p-4 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div> :
              <Table>
                <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground">{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</TableCell>
                      <TableCell className="text-xs">{(r.actor_user_id ?? '').slice(0, 8)}</TableCell>
                      <TableCell><Badge variant="outline">{r.action}</Badge></TableCell>
                      <TableCell className="text-xs">{r.target_type ? `${r.target_type}:${(r.target_id ?? '').slice(0, 8)}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No admin activity yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
