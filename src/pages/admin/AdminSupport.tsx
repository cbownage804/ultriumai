import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminSupport() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => { callAdmin<{ items: any[] }>('ops.support.list').then((r) => setItems(r.items)).catch(() => setItems([])); }, []);
  return (
    <div>
      <AdminPageHeader title="Support Tickets" subtitle="Recent customer support activity" />
      <div className="p-6">
        <Card>
          <CardContent className="p-0">
            {!items ? <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> :
              <Table>
                <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.subject ?? t.title ?? '—'}</TableCell>
                      <TableCell><Badge variant="secondary">{t.status ?? '—'}</Badge></TableCell>
                      <TableCell>{t.priority ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No support tickets</TableCell></TableRow>}
                </TableBody>
              </Table>
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
