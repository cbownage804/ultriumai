import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRightLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  User,
  Ticket,
  AlertTriangle,
  FileText,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Handoff {
  id: string;
  outgoing_tech: { name: string; avatar?: string };
  incoming_tech: { name: string; avatar?: string };
  handoff_time: string;
  summary: string;
  open_tickets: Array<{ id: string; title: string; priority: string }>;
  priority_items: string[];
  pending_escalations: Array<{ id: string; title: string; client: string }>;
  notes?: string;
  acknowledged_at?: string;
}

export function ShiftHandoffManager() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([
    {
      id: '1',
      outgoing_tech: { name: 'John Smith' },
      incoming_tech: { name: 'Sarah Johnson' },
      handoff_time: '2024-01-18T17:00:00',
      summary: 'Busy day with several escalations. Main issues: Acme Corp server migration in progress, TechStart VPN still being monitored.',
      open_tickets: [
        { id: 'T-1234', title: 'Server migration - Phase 2', priority: 'high' },
        { id: 'T-1235', title: 'VPN connectivity monitoring', priority: 'medium' },
        { id: 'T-1236', title: 'Email sync issues', priority: 'low' },
      ],
      priority_items: [
        'Monitor Acme Corp server migration - expected completion by 8 PM',
        'Check TechStart VPN logs every 30 minutes',
        'Waiting on client callback for Global Systems password reset',
      ],
      pending_escalations: [
        { id: 'E-101', title: 'Database performance degradation', client: 'Acme Corp' },
      ],
      notes: 'Vendor support ticket #12345 opened for the database issue. Expected response by tomorrow morning.',
      acknowledged_at: '2024-01-18T17:05:00',
    },
    {
      id: '2',
      outgoing_tech: { name: 'Mike Brown' },
      incoming_tech: { name: 'Emily Chen' },
      handoff_time: '2024-01-18T09:00:00',
      summary: 'Quiet overnight shift. One critical resolved, two medium tickets in progress.',
      open_tickets: [
        { id: 'T-1230', title: 'Printer network setup', priority: 'medium' },
        { id: 'T-1231', title: 'New user onboarding', priority: 'medium' },
      ],
      priority_items: [
        'New user onboarding needs to be completed by noon',
      ],
      pending_escalations: [],
      acknowledged_at: '2024-01-18T09:02:00',
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newHandoff, setNewHandoff] = useState({
    incoming_tech: '',
    summary: '',
    priority_items: '',
    notes: '',
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCreate = () => {
    if (!newHandoff.summary || !newHandoff.incoming_tech) {
      toast.error('Summary and incoming technician are required');
      return;
    }

    const handoff: Handoff = {
      id: Date.now().toString(),
      outgoing_tech: { name: 'You' },
      incoming_tech: { name: newHandoff.incoming_tech },
      handoff_time: new Date().toISOString(),
      summary: newHandoff.summary,
      open_tickets: [],
      priority_items: newHandoff.priority_items.split('\n').filter(Boolean),
      pending_escalations: [],
      notes: newHandoff.notes,
    };

    setHandoffs([handoff, ...handoffs]);
    setNewHandoff({ incoming_tech: '', summary: '', priority_items: '', notes: '' });
    setIsCreateOpen(false);
    toast.success('Shift handoff created');
  };

  const handleAcknowledge = (id: string) => {
    setHandoffs(handoffs.map(h => 
      h.id === id ? { ...h, acknowledged_at: new Date().toISOString() } : h
    ));
    toast.success('Handoff acknowledged');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            Shift Handoffs
          </h2>
          <p className="text-muted-foreground">
            Transfer knowledge and open items between shifts
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Handoff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Shift Handoff</DialogTitle>
              <DialogDescription>
                Document the current state for the incoming technician
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Handing Off To</Label>
                <Select
                  value={newHandoff.incoming_tech}
                  onValueChange={(v) => setNewHandoff({ ...newHandoff, incoming_tech: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="Mike Brown">Mike Brown</SelectItem>
                    <SelectItem value="Emily Chen">Emily Chen</SelectItem>
                    <SelectItem value="David Wilson">David Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shift Summary</Label>
                <Textarea
                  value={newHandoff.summary}
                  onChange={(e) => setNewHandoff({ ...newHandoff, summary: e.target.value })}
                  placeholder="Brief overview of the shift, key events, and current state..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority Items (one per line)</Label>
                <Textarea
                  value={newHandoff.priority_items}
                  onChange={(e) => setNewHandoff({ ...newHandoff, priority_items: e.target.value })}
                  placeholder="Monitor server migration...
Check VPN logs...
Follow up with client..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  value={newHandoff.notes}
                  onChange={(e) => setNewHandoff({ ...newHandoff, notes: e.target.value })}
                  placeholder="Any other important information..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Handoff</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Handoffs List */}
      <div className="space-y-4">
        {handoffs.map((handoff) => (
          <Card key={handoff.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-orange-500">
                        {handoff.outgoing_tech.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{handoff.outgoing_tech.name}</p>
                      <p className="text-xs text-muted-foreground">Outgoing</p>
                    </div>
                  </div>
                  <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-500">
                        {handoff.incoming_tech.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{handoff.incoming_tech.name}</p>
                      <p className="text-xs text-muted-foreground">Incoming</p>
                    </div>
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
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Acknowledged
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => handleAcknowledge(handoff.id)}>
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div>
                <h4 className="font-medium mb-1">Shift Summary</h4>
                <p className="text-sm text-muted-foreground">{handoff.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Open Tickets */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    Open Tickets ({handoff.open_tickets.length})
                  </h4>
                  <div className="space-y-2">
                    {handoff.open_tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center gap-2 text-sm">
                        <div className={`h-2 w-2 rounded-full ${getPriorityColor(ticket.priority)}`} />
                        <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                        <span className="truncate">{ticket.title}</span>
                      </div>
                    ))}
                    {handoff.open_tickets.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No open tickets</p>
                    )}
                  </div>
                </div>

                {/* Priority Items */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Priority Items ({handoff.priority_items.length})
                  </h4>
                  <ul className="space-y-1">
                    {handoff.priority_items.map((item, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {item}
                      </li>
                    ))}
                    {handoff.priority_items.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No priority items</p>
                    )}
                  </ul>
                </div>
              </div>

              {/* Pending Escalations */}
              {handoff.pending_escalations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Pending Escalations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {handoff.pending_escalations.map((esc) => (
                      <Badge key={esc.id} variant="destructive">
                        {esc.title} - {esc.client}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {handoff.notes && (
                <div>
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Additional Notes
                  </h4>
                  <p className="text-sm text-muted-foreground">{handoff.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
