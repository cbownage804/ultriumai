import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Megaphone, Plus, MoreHorizontal, Edit, Trash2, Pin, AlertTriangle, Info, Wrench, Zap, Users, Building2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Announcement {
  id: string; title: string; content: string;
  announcement_type: 'info' | 'maintenance' | 'outage' | 'update' | 'urgent';
  priority: 'low' | 'normal' | 'high' | 'critical';
  target_audience: 'all' | 'internal_it' | 'end_users' | 'msp_only';
  organization_name?: string; starts_at: string; expires_at?: string;
  is_pinned: boolean; is_published: boolean; read_count: number;
}

export function AnnouncementManager() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', announcement_type: 'info' as const, priority: 'normal' as const, target_audience: 'all' as const, is_pinned: false });

  useEffect(() => { if (user) loadAnnouncements(); }, [user]);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await (supabase as any).from('comanaged_announcements').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements((data || []).map((a: any) => ({
        id: a.id, title: a.title, content: a.content || '',
        announcement_type: a.announcement_type || 'info', priority: a.priority || 'normal',
        target_audience: a.target_audience || 'all', organization_name: a.organization_name,
        starts_at: a.starts_at || a.created_at, expires_at: a.expires_at,
        is_pinned: a.is_pinned ?? false, is_published: a.is_published ?? true, read_count: a.read_count || 0,
      })));
    } catch (err) { console.error('Failed to load announcements:', err); } finally { setLoading(false); }
  };

  const getTypeIcon = (type: string) => { switch (type) { case 'maintenance': return <Wrench className="h-4 w-4" />; case 'outage': return <AlertTriangle className="h-4 w-4" />; case 'urgent': return <Zap className="h-4 w-4" />; default: return <Info className="h-4 w-4" />; } };
  const getTypeColor = (type: string) => { switch (type) { case 'maintenance': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'; case 'outage': return 'bg-red-500/10 text-red-500 border-red-500/30'; case 'urgent': return 'bg-orange-500/10 text-orange-500 border-orange-500/30'; case 'update': return 'bg-blue-500/10 text-blue-500 border-blue-500/30'; default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30'; } };
  const getPriorityColor = (p: string) => { switch (p) { case 'critical': return 'bg-red-500'; case 'high': return 'bg-orange-500'; case 'normal': return 'bg-blue-500'; default: return 'bg-gray-500'; } };
  const getAudienceIcon = (a: string) => { switch (a) { case 'internal_it': return <Building2 className="h-3 w-3" />; case 'msp_only': return <Eye className="h-3 w-3" />; default: return <Users className="h-3 w-3" />; } };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content || !user) { toast.error('Title and content required'); return; }
    try {
      const { error } = await (supabase as any).from('comanaged_announcements').insert({
        user_id: user.id, title: newAnnouncement.title, content: newAnnouncement.content,
        announcement_type: newAnnouncement.announcement_type, priority: newAnnouncement.priority,
        target_audience: newAnnouncement.target_audience, is_pinned: newAnnouncement.is_pinned,
        is_published: true, starts_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Announcement published');
      setIsCreateOpen(false);
      setNewAnnouncement({ title: '', content: '', announcement_type: 'info', priority: 'normal', target_audience: 'all', is_pinned: false });
      loadAnnouncements();
    } catch { toast.error('Failed to create'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await (supabase as any).from('comanaged_announcements').delete().eq('id', id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleTogglePin = async (id: string) => {
    const ann = announcements.find(a => a.id === id);
    if (!ann) return;
    try {
      await (supabase as any).from('comanaged_announcements').update({ is_pinned: !ann.is_pinned }).eq('id', id);
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_pinned: !a.is_pinned } : a));
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" />Announcements</h2>
          <p className="text-muted-foreground">Broadcast maintenance windows, outages, and updates to clients</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Announcement</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle><DialogDescription>Broadcast a message to clients and internal teams</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} placeholder="Scheduled Maintenance" /></div>
              <div className="space-y-2"><Label>Content</Label><Textarea value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} rows={4} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label><Select value={newAnnouncement.announcement_type} onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, announcement_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="info">Information</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="outage">Outage</SelectItem><SelectItem value="update">Update</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Priority</Label><Select value={newAnnouncement.priority} onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Target Audience</Label><Select value={newAnnouncement.target_audience} onValueChange={(v: any) => setNewAnnouncement({ ...newAnnouncement, target_audience: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Everyone</SelectItem><SelectItem value="internal_it">Internal IT Only</SelectItem><SelectItem value="end_users">End Users Only</SelectItem><SelectItem value="msp_only">MSP Staff Only</SelectItem></SelectContent></Select></div>
              <div className="flex items-center justify-between"><Label>Pin to top</Label><Switch checked={newAnnouncement.is_pinned} onCheckedChange={(checked) => setNewAnnouncement({ ...newAnnouncement, is_pinned: checked })} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate}>Publish</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-2xl font-bold">{announcements.length}</p><p className="text-sm text-muted-foreground">Total Active</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-2xl font-bold text-yellow-500">{announcements.filter(a => a.announcement_type === 'maintenance').length}</p><p className="text-sm text-muted-foreground">Maintenance</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-2xl font-bold text-red-500">{announcements.filter(a => a.announcement_type === 'outage').length}</p><p className="text-sm text-muted-foreground">Outages</p></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-center"><p className="text-2xl font-bold">{announcements.reduce((sum, a) => sum + a.read_count, 0)}</p><p className="text-sm text-muted-foreground">Total Reads</p></div></CardContent></Card>
      </div>

      <div className="space-y-4">
        {announcements.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map((announcement) => (
          <Card key={announcement.id} className={announcement.is_pinned ? 'border-primary/50' : ''}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeColor(announcement.announcement_type)}`}>{getTypeIcon(announcement.announcement_type)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">{announcement.is_pinned && <Pin className="h-4 w-4 text-primary" />}<h3 className="font-semibold">{announcement.title}</h3></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={getTypeColor(announcement.announcement_type)}>{announcement.announcement_type}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">{getAudienceIcon(announcement.target_audience)}{announcement.target_audience.replace('_', ' ')}</Badge>
                        <span>•</span><span>{new Date(announcement.starts_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getPriorityColor(announcement.priority)}`} />
                      <span className="text-sm text-muted-foreground">{announcement.read_count} reads</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePin(announcement.id)}><Pin className="h-4 w-4 mr-2" />{announcement.is_pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(announcement.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
