import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: string;
  target_audience: string;
  is_active: boolean;
  starts_at: string;
  expires_at?: string;
  created_at: string;
}

const severityColors: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-500',
  warning: 'bg-yellow-500/10 text-yellow-500',
  critical: 'bg-destructive/10 text-destructive',
};

const AnnouncementsTab = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', severity: 'info', target_audience: 'all' });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements((data as any) || []);
    setLoading(false);
  };

  const create = async () => {
    if (!form.title || !form.message) { toast.error('Title and message required'); return; }
    const { error } = await supabase.from('admin_announcements').insert({
      ...form,
      admin_user_id: user?.id,
    });
    if (error) { toast.error('Failed to create'); return; }
    toast.success('Announcement created');
    setShowCreate(false);
    setForm({ title: '', message: '', severity: 'info', target_audience: 'all' });
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from('admin_announcements').update({ is_active: active }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from('admin_announcements').delete().eq('id', id);
    toast.success('Deleted');
    load();
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Announcements</h2>
          <p className="text-muted-foreground">Broadcast messages to users sitewide</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" /> New Announcement</Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Message body..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} />
            <div className="flex gap-3">
              <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.target_audience} onValueChange={v => setForm(f => ({ ...f, target_audience: v }))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admins">Admins Only</SelectItem>
                  <SelectItem value="msp_users">MSP Users</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={create}>Publish</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> :
         announcements.length === 0 ? <p className="text-center text-muted-foreground py-8">No announcements yet</p> :
         announcements.map(a => (
          <Card key={a.id}>
            <CardContent className="pt-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  <Badge className={severityColors[a.severity]}>{a.severity}</Badge>
                  <Badge variant="outline">{a.target_audience}</Badge>
                  {!a.is_active && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(new Date(a.created_at), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={a.is_active} onCheckedChange={v => toggle(a.id, v)} />
                <Button variant="ghost" size="sm" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsTab;
