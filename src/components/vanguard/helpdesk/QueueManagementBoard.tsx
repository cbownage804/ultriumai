import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Inbox, Clock, AlertTriangle, CheckCircle, Settings, GripVertical, Trash2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QueueTicket {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  customer: string;
}

export function QueueManagementBoard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tickets, setTickets] = useState<Record<string, QueueTicket[]>>({
    new: [],
    in_progress: [],
    pending: [],
    resolved: []
  });

  // Load real tickets from helpdesk_tickets
  useEffect(() => {
    const loadTickets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase as any)
        .from('helpdesk_tickets')
        .select('id, title, priority, status, created_at, customer_id, msp_clients(company_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        const mapped: QueueTicket[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          priority: t.priority || 'medium',
          status: t.status || 'new',
          created_at: new Date(t.created_at).toLocaleDateString(),
          customer: t.msp_clients?.company_name || 'Unknown',
        }));

        setTickets({
          new: mapped.filter(t => t.status === 'new' || t.status === 'open'),
          in_progress: mapped.filter(t => t.status === 'in_progress'),
          pending: mapped.filter(t => t.status === 'pending' || t.status === 'waiting'),
          resolved: mapped.filter(t => t.status === 'resolved' || t.status === 'closed'),
        });
      }
    };
    loadTickets();
  }, []);
  const [newQueue, setNewQueue] = useState({
    queue_name: '',
    description: '',
    color: '#6366f1'
  });

  const queryClient = useQueryClient();

  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['ticket-queues'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('ticket_queues')
        .select('*')
        .eq('user_id', user.id)
        .order('position');
      
      if (error) throw error;
      return data || [];
    }
  });

  const createQueueMutation = useMutation({
    mutationFn: async (queue: typeof newQueue) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ticket_queues')
        .insert({
          user_id: user.id,
          queue_name: queue.queue_name,
          description: queue.description || null,
          color: queue.color,
          position: queues.length
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-queues'] });
      setIsCreateOpen(false);
      setNewQueue({ queue_name: '', description: '', color: '#6366f1' });
      toast.success('Queue created');
    }
  });

  const deleteQueueMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ticket_queues')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-queues'] });
      toast.success('Queue deleted');
    }
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reorder within same column
      const items = Array.from(tickets[source.droppableId]);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setTickets({ ...tickets, [source.droppableId]: items });
    } else {
      // Move between columns
      const sourceItems = Array.from(tickets[source.droppableId]);
      const destItems = Array.from(tickets[destination.droppableId]);
      const [movedItem] = sourceItems.splice(source.index, 1);
      movedItem.status = destination.droppableId;
      destItems.splice(destination.index, 0, movedItem);
      setTickets({
        ...tickets,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems
      });
      toast.success(`Ticket moved to ${destination.droppableId.replace('_', ' ')}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getColumnIcon = (status: string) => {
    switch (status) {
      case 'new': return <Inbox className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <Inbox className="h-4 w-4" />;
    }
  };

  const columns = [
    { id: 'new', title: 'New', color: 'border-blue-500' },
    { id: 'in_progress', title: 'In Progress', color: 'border-yellow-500' },
    { id: 'pending', title: 'Pending', color: 'border-orange-500' },
    { id: 'resolved', title: 'Resolved', color: 'border-green-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Queue Management Board</h2>
          <p className="text-sm text-muted-foreground">Drag and drop tickets between queues</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Queue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Queue</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Queue Name</Label>
                  <Input
                    value={newQueue.queue_name}
                    onChange={(e) => setNewQueue({ ...newQueue, queue_name: e.target.value })}
                    placeholder="VIP Customers"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newQueue.description}
                    onChange={(e) => setNewQueue({ ...newQueue, description: e.target.value })}
                    placeholder="Queue description..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={newQueue.color}
                    onChange={(e) => setNewQueue({ ...newQueue, color: e.target.value })}
                    className="h-10 w-20"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => createQueueMutation.mutate(newQueue)}
                  disabled={!newQueue.queue_name}
                >
                  Create Queue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Custom Queues */}
      {queues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {queues.map((queue) => (
            <Badge
              key={queue.id}
              variant="outline"
              className="py-1 px-3 flex items-center gap-2"
              style={{ borderColor: queue.color || '#6366f1' }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: queue.color || '#6366f1' }}
              />
              {queue.queue_name}
              <button
                onClick={() => deleteQueueMutation.mutate(queue.id)}
                className="ml-1 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.id} className="space-y-3">
              <div className={`flex items-center justify-between p-3 rounded-t-lg border-t-4 bg-muted/50 ${column.color}`}>
                <div className="flex items-center gap-2">
                  {getColumnIcon(column.id)}
                  <span className="font-medium">{column.title}</span>
                </div>
                <Badge variant="secondary">{tickets[column.id]?.length || 0}</Badge>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    {tickets[column.id]?.map((ticket, index) => (
                      <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`cursor-grab active:cursor-grabbing transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                            }`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between">
                                <div {...provided.dragHandleProps} className="mt-1">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 ml-2">
                                  <p className="font-medium text-sm">{ticket.title}</p>
                                  <p className="text-xs text-muted-foreground">{ticket.customer}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                                  {ticket.priority}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{ticket.created_at}</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
