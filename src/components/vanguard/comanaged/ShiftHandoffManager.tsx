import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  ArrowRightLeft, Clock, CheckCircle2, AlertCircle, Ticket, AlertTriangle, FileText, Plus, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Handoff {
  id: string;
  outgoing_tech_id: string;
  incoming_tech_id: string;
  handoff_time: string;
  summary: string;
  open_tickets: any[];
  priority_items: string[];
  pending_escalations: any[];
  notes: string | null;
  acknowledged_at: string | null;
}

interface ShiftHandoffManagerProps {
  organizationId?: string;
}

export function ShiftHandoffManager({ organizationId }: ShiftHandoffManagerProps) {
  const { user } = useAuth();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newHandoff, setNewHandoff] = useState({
    incoming_tech_id: '',
    summary: '',
    priority_items: '',
    notes: '',
  });

  const loadHandoffs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = (supabase as any).from('comanaged_shift_handoffs').select('*').order('created_at', { ascending: false }).limit(20);
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      setHandoffs((data || []).map((h: any) => ({
        id: h.id,
        outgoing_tech_id: h.outgoing_tech_id,
        incoming_tech_id: h.incoming_tech_id,
        handoff_time: h.handoff_time || h.created_at,
        summary: h.summary || '',
        open_tickets: Array.isArray(h.open_tickets) ? h.open_tickets : [],
        priority_items: Array.isArray(h.priority_items) ? h.priority_items : [],
        pending_escalations: Array.isArray(h.pending_escalations) ? h.pending_escalations : [],
        notes: h.notes,
        acknowledged_at: h.acknowledged_at,
      })));
    } catch (err) {
      console.error('Failed to load handoffs:', err);
    } finally {
      setLoading(false);
    }
  }, [user, organizationId]);

  useEffect(() => { loadHandoffs(); }, [loadHandoffs]);

  const handleCreate = async () => {
    if (!newHandoff.summary || !user) {
      toast.error('Summary is required');
      return;
    }
    try {
      const { error } = await (supabase as any).from('comanaged_shift_handoffs').insert({
        outgoing_tech_id: user.id,
        incoming_tech_id: newHandoff.incoming_tech_id || user.id,
        summary: newHandoff.summary,
        priority_items: newHandoff.priority_items.split('\n').filter(Boolean),
        notes: newHandoff.notes || null,
        organization_id: organizationId || null,
        handoff_time: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Shift handoff created');
      setIsCreateOpen(false);
      setNewHandoff({ incoming_tech_id: '', summary: '', priority_items: '', notes: '' });
      loadHandoffs();
    } catch { toast.error('Failed to create handoff'); }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('comanaged_shift_handoffs')
        .update({ acknowledged_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setHandoffs(prev => prev.map(h => h.id === id ? { ...h, acknowledged_at: new Date().toISOString() } : h));
      toast.success('Handoff acknowledged');
    } catch { toast.error('Failed to acknowledge'); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Shift Handoffs
          </h2>
          <p className="text-muted-foreground">Transfer knowledge and open items between shifts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Handoff</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Shift Handoff</DialogTitle>
              <DialogDescription>Document the current state for the incoming technician</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Incoming Tech ID</Label>
                <Input
                  value={newHandoff.incoming_tech_id}
                  onChange={(e) => setNewHandoff({ ...newHandoff, incoming_tech_id: e.target.value })}
                  placeholder="Enter technician ID or name"
                />
              </div>
              <div className="space-y-2">
                <Label>Shift Summary</Label>
                <Textarea value={newHandoff.summary} onChange={(e) => setNewHandoff({ ...newHandoff, summary: e.target.value })} placeholder="Brief overview..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Priority Items (one per line)</Label>
                <Textarea value={newHandoff.priority_items} onChange={(e) => setNewHandoff({ ...newHandoff, priority_items: e.target.value })} placeholder="Monitor server..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea value={newHandoff.notes} onChange={(e) => setNewHandoff({ ...newHandoff, notes: e.target.value })} placeholder="Any other info..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Handoff</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {handoffs.map((handoff) => (
          <Card key={handoff.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-orange-500">O</AvatarFallback></Avatar>
                    <div><p className="font-medium text-sm">Outgoing</p><p className="text-xs text-muted-foreground">{handoff.outgoing_tech_id.substring(0, 8)}</p></div>
                  </div>
                  <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-500">I</AvatarFallback></Avatar>
                    <div><p className="font-medium text-sm">Incoming</p><p className="text-xs text-muted-foreground">{handoff.incoming_tech_id.substring(0, 8)}</p></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(handoff.handoff_time).toLocaleString()}
                    </div>
                  </div>
                  {handoff.acknowledged_at ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />Acknowledged
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleAcknowledge(handoff.id)}>Acknowledge</Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Shift Summary</h4>
                <p className="text-sm text-muted-foreground">{handoff.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />Open Tickets ({handoff.open_tickets.length})
                  </h4>
                  {handoff.open_tickets.length === 0 && <p className="text-sm text-muted-foreground italic">No open tickets</p>}
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />Priority Items ({handoff.priority_items.length})
                  </h4>
                  <ul className="space-y-1">
                    {handoff.priority_items.map((item: any, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2"><span className="text-orange-500">•</span>{String(item)}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {handoff.pending_escalations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />Pending Escalations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {handoff.pending_escalations.map((esc: any, i: number) => (
                      <Badge key={i} variant="destructive">{String(esc.title || esc)}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {handoff.notes && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-2"><FileText className="h-4 w-4" />Notes</h4>
                  <p className="text-sm text-muted-foreground">{handoff.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {handoffs.length === 0 && <p className="text-center text-muted-foreground py-8">No shift handoffs yet</p>}
      </div>
    </div>
  );
}
