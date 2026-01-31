import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  Plus,
  Trash2,
  MoreHorizontal,
  Inbox,
  ArrowRight,
  Edit,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface EmailQueueMapping {
  id: string;
  email_address: string;
  queue_id: string | null;
  queue_name?: string;
  queue_color?: string;
  description: string | null;
  is_active: boolean;
  priority: number;
}

interface Queue {
  id: string;
  queue_name: string;
  color: string | null;
}

export function EmailQueueMapping() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<EmailQueueMapping | null>(null);
  const [newMapping, setNewMapping] = useState({
    email_address: '',
    queue_id: '',
    description: '',
  });

  // Fetch queues
  const { data: queues = [], isLoading: queuesLoading } = useQuery({
    queryKey: ['ticket-queues'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ticket_queues')
        .select('id, queue_name, color')
        .eq('user_id', user.id)
        .order('queue_name');
      if (error) throw error;
      return data as Queue[];
    },
    enabled: !!user,
  });

  // Fetch email queue mappings
  const { data: mappings = [], isLoading: mappingsLoading } = useQuery({
    queryKey: ['email-queue-mappings'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('email_queue_mappings')
        .select('*, ticket_queues(queue_name, color)')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((m: any) => ({
        id: m.id,
        email_address: m.email_address,
        queue_id: m.queue_id,
        queue_name: m.ticket_queues?.queue_name,
        queue_color: m.ticket_queues?.color,
        description: m.description,
        is_active: m.is_active,
        priority: m.priority,
      })) as EmailQueueMapping[];
    },
    enabled: !!user,
  });

  // Add mapping mutation
  const addMutation = useMutation({
    mutationFn: async (mapping: typeof newMapping) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await (supabase as any)
        .from('email_queue_mappings')
        .insert({
          user_id: user.id,
          email_address: mapping.email_address.toLowerCase().trim(),
          queue_id: mapping.queue_id || null,
          description: mapping.description || null,
          is_active: true,
          priority: 0,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue-mappings'] });
      setIsAddOpen(false);
      setNewMapping({ email_address: '', queue_id: '', description: '' });
      toast.success('Email mapping added');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add mapping');
    },
  });

  // Update mapping mutation
  const updateMutation = useMutation({
    mutationFn: async (mapping: EmailQueueMapping) => {
      const { error } = await (supabase as any)
        .from('email_queue_mappings')
        .update({
          email_address: mapping.email_address.toLowerCase().trim(),
          queue_id: mapping.queue_id || null,
          description: mapping.description,
          is_active: mapping.is_active,
        })
        .eq('id', mapping.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue-mappings'] });
      setEditingMapping(null);
      toast.success('Mapping updated');
    },
  });

  // Delete mapping mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('email_queue_mappings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue-mappings'] });
      toast.success('Mapping deleted');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from('email_queue_mappings')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-queue-mappings'] });
    },
  });

  const isLoading = queuesLoading || mappingsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-primary" />
              Email to Queue Routing
            </CardTitle>
            <CardDescription>
              Route incoming emails to specific queues based on the receiving email address
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Mapping
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email to Queue Mapping</DialogTitle>
                <DialogDescription>
                  Specify which email addresses should route to which queues
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={newMapping.email_address}
                    onChange={(e) => setNewMapping({ ...newMapping, email_address: e.target.value })}
                    placeholder="help@ultriumai.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Emails sent to this address will route to the selected queue
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Target Queue</Label>
                  <Select
                    value={newMapping.queue_id}
                    onValueChange={(value) => setNewMapping({ ...newMapping, queue_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a queue" />
                    </SelectTrigger>
                    <SelectContent>
                      {queues.map((queue) => (
                        <SelectItem key={queue.id} value={queue.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: queue.color || '#6366f1' }}
                            />
                            {queue.queue_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    value={newMapping.description}
                    onChange={(e) => setNewMapping({ ...newMapping, description: e.target.value })}
                    placeholder="Main helpdesk email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => addMutation.mutate(newMapping)}
                  disabled={!newMapping.email_address || !newMapping.queue_id || addMutation.isPending}
                >
                  {addMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Mapping
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No email mappings configured</p>
            <p className="text-sm">Add mappings to route emails to specific queues</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email Address</TableHead>
                <TableHead>Routes To</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{mapping.email_address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {mapping.queue_name ? (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1.5"
                          style={{ borderColor: mapping.queue_color || '#6366f1' }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: mapping.queue_color || '#6366f1' }}
                          />
                          {mapping.queue_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">No queue</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mapping.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={mapping.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: mapping.id, is_active: checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingMapping(mapping)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingMapping} onOpenChange={(open) => !open && setEditingMapping(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Email Mapping</DialogTitle>
            </DialogHeader>
            {editingMapping && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={editingMapping.email_address}
                    onChange={(e) =>
                      setEditingMapping({ ...editingMapping, email_address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Queue</Label>
                  <Select
                    value={editingMapping.queue_id || ''}
                    onValueChange={(value) =>
                      setEditingMapping({ ...editingMapping, queue_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a queue" />
                    </SelectTrigger>
                    <SelectContent>
                      {queues.map((queue) => (
                        <SelectItem key={queue.id} value={queue.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: queue.color || '#6366f1' }}
                            />
                            {queue.queue_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={editingMapping.description || ''}
                    onChange={(e) =>
                      setEditingMapping({ ...editingMapping, description: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMapping(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => editingMapping && updateMutation.mutate(editingMapping)}
                disabled={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
