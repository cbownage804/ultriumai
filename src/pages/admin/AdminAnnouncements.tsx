import { useEffect, useState } from 'react';
import { callAdmin, usePlatformRole } from '@/hooks/usePlatformRole';
import { AdminPageHeader } from '@/components/admin/AdminPrimitives';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AdminAnnouncements() {
  const { has } = usePlatformRole();
  const [items, setItems] = useState<any[] | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const load = () => callAdmin<{ items: any[] }>('ops.announcements.list').then((r) => setItems(r.items)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  const save = async () => {
    if (!title.trim()) return;
    try {
      await callAdmin('ops.announcements.upsert', { row: { title, message, is_active: true } });
      setTitle(''); setMessage(''); toast.success('Announcement saved'); load();
    } catch (e: any) { toast.error(e.message); }
  };
  const del = async (id: string) => { await callAdmin('ops.announcements.delete', { id }); load(); };

  return (
    <div>
      <AdminPageHeader title="Announcements" subtitle="Site-wide messages and maintenance banners" />
      <div className="p-6 space-y-6">
        {has('platform_ops') && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
              <Button onClick={save} disabled={!title.trim()}>Publish announcement</Button>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-0">
            {!items ? <div className="p-4 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div> :
              items.length === 0 ? <div className="p-6 text-sm text-muted-foreground">No announcements yet.</div> :
              <div className="divide-y divide-border/40">
                {items.map((a) => (
                  <div key={a.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-muted-foreground">{a.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    {has('platform_ops') && <Button variant="ghost" size="sm" onClick={() => del(a.id)}>Delete</Button>}
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
