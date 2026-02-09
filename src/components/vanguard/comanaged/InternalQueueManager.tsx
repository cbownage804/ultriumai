import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, MoreHorizontal, Inbox, Users, Trash2, Edit, GripVertical, AlertCircle, CheckCircle, Clock, Zap, Shield, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Queue {
  id: string;
  queue_name: string;
  description: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_active: boolean;
}

interface InternalQueueManagerProps {
  organizationId?: string;
}

const iconOptions = [
  { value: 'inbox', icon: Inbox, label: 'Inbox' },
  { value: 'alert-circle', icon: AlertCircle, label: 'Alert' },
  { value: 'check-circle', icon: CheckCircle, label: 'Check' },
  { value: 'clock', icon: Clock, label: 'Clock' },
  { value: 'zap', icon: Zap, label: 'Urgent' },
  { value: 'shield', icon: Shield, label: 'Security' },
];

const colorOptions = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6'];

export function InternalQueueManager({ organizationId }: InternalQueueManagerProps) {
  const { user } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newQueue, setNewQueue] = useState({ queue_name: '', description: '', color: '#6366f1', icon: 'inbox', is_default: false });

  const loadQueues = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('comanaged_ticket_queues')
        .select('*')
        .eq('organization_id', organizationId)
        .order('sort_order');
      if (error) throw error;
      setQueues((data || []).map((q: any) => ({
        id: q.id,
        queue_name: q.queue_name,
        description: q.description || '',
        color: q.color || '#6366f1',
        icon: q.icon || 'inbox',
        is_default: q.is_default ?? false,
        is_active: q.is_active ?? true,
      })));
    } catch (err) {
      console.error('Failed to load queues:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadQueues(); }, [loadQueues]);

  const handleCreateQueue = async () => {
    if (!newQueue.queue_name.trim() || !organizationId || !user) { toast.error('Queue name is required'); return; }
    try {
      const { error } = await (supabase as any).from('comanaged_ticket_queues').insert({
        organization_id: organizationId,
        queue_name: newQueue.queue_name,
        description: newQueue.description,
        color: newQueue.color,
        icon: newQueue.icon,
        is_default: newQueue.is_default,
        created_by: user.id,
      });
      if (error) throw error;
      toast.success('Queue created');
      setIsCreateOpen(false);
      setNewQueue({ queue_name: '', description: '', color: '#6366f1', icon: 'inbox', is_default: false });
      loadQueues();
    } catch { toast.error('Failed to create queue'); }
  };

  const handleDeleteQueue = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('comanaged_ticket_queues').delete().eq('id', id);
      if (error) throw error;
      setQueues(prev => prev.filter(q => q.id !== id));
      toast.success('Queue deleted');
    } catch { toast.error('Failed to delete queue'); }
  };

  const handleSetDefault = async (id: string) => {
    if (!organizationId) return;
    try {
      // Unset all defaults first
      await (supabase as any).from('comanaged_ticket_queues').update({ is_default: false }).eq('organization_id', organizationId);
      await (supabase as any).from('comanaged_ticket_queues').update({ is_default: true }).eq('id', id);
      setQueues(prev => prev.map(q => ({ ...q, is_default: q.id === id })));
      toast.success('Default queue updated');
    } catch { toast.error('Failed to update default'); }
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option ? option.icon : Inbox;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ticket Queues</h2>
          <p className="text-muted-foreground">Manage your team's ticket queues</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Queue</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create New Queue</DialogTitle><DialogDescription>Add a new ticket queue</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Queue Name</Label><Input value={newQueue.queue_name} onChange={(e) => setNewQueue({ ...newQueue, queue_name: e.target.value })} placeholder="e.g., Hardware Support" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={newQueue.description} onChange={(e) => setNewQueue({ ...newQueue, description: e.target.value })} placeholder="Brief description..." rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select value={newQueue.icon} onValueChange={(v) => setNewQueue({ ...newQueue, icon: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}><div className="flex items-center gap-2"><opt.icon className="h-4 w-4" />{opt.label}</div></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button key={color} type="button" className={`w-6 h-6 rounded-full border-2 ${newQueue.color === color ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => setNewQueue({ ...newQueue, color })} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between"><Label>Set as default queue</Label><Switch checked={newQueue.is_default} onCheckedChange={(checked) => setNewQueue({ ...newQueue, is_default: checked })} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button><Button onClick={handleCreateQueue}>Create Queue</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Queues</p><p className="text-2xl font-bold">{queues.length}</p></div><Inbox className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-500">{queues.filter(q => q.is_active).length}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Default</p><p className="text-2xl font-bold text-blue-500">{queues.filter(q => q.is_default).length}</p></div><Zap className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Your Queues</CardTitle><CardDescription>Manage queue settings and routing</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queues.map((queue) => {
              const IconComponent = getIconComponent(queue.icon);
              return (
                <div key={queue.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: queue.color + '20' }}>
                    <IconComponent className="h-5 w-5" style={{ color: queue.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{queue.queue_name}</h3>
                      {queue.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      {!queue.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{queue.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!queue.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(queue.id)}><CheckCircle className="h-4 w-4 mr-2" />Set as Default</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteQueue(queue.id)} disabled={queue.is_default}><Trash2 className="h-4 w-4 mr-2" />Delete Queue</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
            {queues.length === 0 && <p className="text-center text-muted-foreground py-8">No queues configured</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
