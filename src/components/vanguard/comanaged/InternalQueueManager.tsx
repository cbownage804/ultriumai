import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  MoreHorizontal,
  Inbox,
  Users,
  Settings,
  Trash2,
  Edit,
  GripVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  UserPlus,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

interface Queue {
  id: string;
  queue_name: string;
  description: string;
  color: string;
  icon: string;
  is_default: boolean;
  ticket_count: number;
  member_count: number;
  is_active: boolean;
}

interface QueueMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member' | 'viewer';
  can_assign: boolean;
  can_close: boolean;
}

interface RoutingRule {
  id: string;
  rule_name: string;
  conditions: {
    field: string;
    operator: string;
    value: string;
  }[];
  priority: number;
  is_active: boolean;
}

const iconOptions = [
  { value: 'inbox', icon: Inbox, label: 'Inbox' },
  { value: 'alert-circle', icon: AlertCircle, label: 'Alert' },
  { value: 'check-circle', icon: CheckCircle, label: 'Check' },
  { value: 'clock', icon: Clock, label: 'Clock' },
  { value: 'zap', icon: Zap, label: 'Urgent' },
  { value: 'shield', icon: Shield, label: 'Security' },
];

const colorOptions = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', 
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6',
];

export function InternalQueueManager() {
  const [queues, setQueues] = useState<Queue[]>([
    {
      id: '1',
      queue_name: 'General Support',
      description: 'Default queue for incoming tickets',
      color: '#6366f1',
      icon: 'inbox',
      is_default: true,
      ticket_count: 24,
      member_count: 5,
      is_active: true,
    },
    {
      id: '2',
      queue_name: 'Network Issues',
      description: 'Network and connectivity problems',
      color: '#ef4444',
      icon: 'alert-circle',
      is_default: false,
      ticket_count: 8,
      member_count: 3,
      is_active: true,
    },
    {
      id: '3',
      queue_name: 'Hardware Requests',
      description: 'Equipment and hardware related tickets',
      color: '#22c55e',
      icon: 'check-circle',
      is_default: false,
      ticket_count: 12,
      member_count: 2,
      is_active: true,
    },
  ]);

  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const [newQueue, setNewQueue] = useState({
    queue_name: '',
    description: '',
    color: '#6366f1',
    icon: 'inbox',
    is_default: false,
  });

  const [queueMembers] = useState<QueueMember[]>([
    { id: '1', name: 'John Smith', email: 'john@company.com', role: 'manager', can_assign: true, can_close: true },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'member', can_assign: true, can_close: true },
    { id: '3', name: 'Mike Brown', email: 'mike@company.com', role: 'viewer', can_assign: false, can_close: false },
  ]);

  const [routingRules] = useState<RoutingRule[]>([
    {
      id: '1',
      rule_name: 'Network keyword routing',
      conditions: [{ field: 'subject', operator: 'contains', value: 'network' }],
      priority: 1,
      is_active: true,
    },
    {
      id: '2',
      rule_name: 'VIP customer routing',
      conditions: [{ field: 'customer_tier', operator: 'equals', value: 'vip' }],
      priority: 2,
      is_active: true,
    },
  ]);

  const handleCreateQueue = () => {
    if (!newQueue.queue_name.trim()) {
      toast.error('Queue name is required');
      return;
    }

    const queue: Queue = {
      id: Date.now().toString(),
      ...newQueue,
      ticket_count: 0,
      member_count: 0,
      is_active: true,
    };

    setQueues([...queues, queue]);
    setNewQueue({ queue_name: '', description: '', color: '#6366f1', icon: 'inbox', is_default: false });
    setIsCreateOpen(false);
    toast.success('Queue created successfully');
  };

  const handleDeleteQueue = (id: string) => {
    setQueues(queues.filter(q => q.id !== id));
    toast.success('Queue deleted');
  };

  const handleSetDefault = (id: string) => {
    setQueues(queues.map(q => ({
      ...q,
      is_default: q.id === id,
    })));
    toast.success('Default queue updated');
  };

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.value === iconName);
    return option ? option.icon : Inbox;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ticket Queues</h2>
          <p className="text-muted-foreground">
            Manage your team's ticket queues and routing rules
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Queue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Queue</DialogTitle>
              <DialogDescription>
                Add a new ticket queue for your team
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Queue Name</Label>
                <Input
                  value={newQueue.queue_name}
                  onChange={(e) => setNewQueue({ ...newQueue, queue_name: e.target.value })}
                  placeholder="e.g., Hardware Support"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newQueue.description}
                  onChange={(e) => setNewQueue({ ...newQueue, description: e.target.value })}
                  placeholder="Brief description of this queue's purpose"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select
                    value={newQueue.icon}
                    onValueChange={(value) => setNewQueue({ ...newQueue, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          newQueue.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewQueue({ ...newQueue, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Set as default queue</Label>
                <Switch
                  checked={newQueue.is_default}
                  onCheckedChange={(checked) => setNewQueue({ ...newQueue, is_default: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQueue}>Create Queue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Queues</p>
                <p className="text-2xl font-bold">{queues.length}</p>
              </div>
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tickets</p>
                <p className="text-2xl font-bold">
                  {queues.reduce((sum, q) => sum + q.ticket_count, 0)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">
                  {queues.reduce((sum, q) => sum + q.member_count, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Routing Rules</p>
                <p className="text-2xl font-bold">{routingRules.length}</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queues List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Queues</CardTitle>
          <CardDescription>
            Drag to reorder, click to manage members and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {queues.map((queue) => {
              const IconComponent = getIconComponent(queue.icon);
              return (
                <div
                  key={queue.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: queue.color + '20' }}
                  >
                    <IconComponent className="h-5 w-5" style={{ color: queue.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{queue.queue_name}</h3>
                      {queue.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      {!queue.is_active && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {queue.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-medium text-foreground">{queue.ticket_count}</p>
                      <p className="text-xs">Tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{queue.member_count}</p>
                      <p className="text-xs">Members</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedQueue(queue);
                        setIsMembersOpen(true);
                      }}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedQueue(queue);
                        setIsRulesOpen(true);
                      }}>
                        <Zap className="h-4 w-4 mr-2" />
                        Routing Rules
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedQueue(queue);
                        setIsEditOpen(true);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Queue
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!queue.is_default && (
                        <DropdownMenuItem onClick={() => handleSetDefault(queue.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteQueue(queue.id)}
                        disabled={queue.is_default}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Queue
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Queue Members - {selectedQueue?.queue_name}
            </DialogTitle>
            <DialogDescription>
              Manage who has access to this queue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Can Assign</TableHead>
                  <TableHead>Can Close</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queueMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === 'manager' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch checked={member.can_assign} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={member.can_close} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routing Rules Dialog */}
      <Dialog open={isRulesOpen} onOpenChange={setIsRulesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Routing Rules - {selectedQueue?.queue_name}
            </DialogTitle>
            <DialogDescription>
              Automatically route tickets to this queue based on conditions
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="rules">
            <TabsList>
              <TabsTrigger value="rules">Active Rules</TabsTrigger>
              <TabsTrigger value="create">Create Rule</TabsTrigger>
            </TabsList>
            <TabsContent value="rules" className="space-y-4">
              {routingRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{rule.rule_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {rule.conditions.map(c => 
                              `${c.field} ${c.operator} "${c.value}"`
                            ).join(' AND ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Priority {rule.priority}</Badge>
                        <Switch checked={rule.is_active} />
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input placeholder="e.g., Route VIP customers" />
                </div>
                <div className="space-y-2">
                  <Label>Conditions</Label>
                  <div className="flex gap-2">
                    <Select>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subject">Subject</SelectItem>
                        <SelectItem value="description">Description</SelectItem>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="customer_tier">Customer Tier</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="starts_with">Starts with</SelectItem>
                        <SelectItem value="not_contains">Does not contain</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Value" className="flex-1" />
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input type="number" defaultValue={1} min={1} className="w-24" />
                  <p className="text-xs text-muted-foreground">
                    Lower numbers = higher priority
                  </p>
                </div>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Routing Rule
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Queue Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Queue</DialogTitle>
            <DialogDescription>
              Update queue settings and appearance
            </DialogDescription>
          </DialogHeader>
          {selectedQueue && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Queue Name</Label>
                <Input defaultValue={selectedQueue.queue_name} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea defaultValue={selectedQueue.description} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <Select defaultValue={selectedQueue.icon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          selectedQueue.color === color ? 'border-foreground' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch defaultChecked={selectedQueue.is_active} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setIsEditOpen(false);
              toast.success('Queue updated');
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
