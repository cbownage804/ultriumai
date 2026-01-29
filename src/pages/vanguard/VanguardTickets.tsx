import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, Plus, Search, Filter, Clock, AlertCircle, CheckCircle2, 
  XCircle, User, Building2, MoreVertical, MessageSquare, Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getVanguardBasePath } from '@/utils/subdomain';

const mockTickets = [
  { id: 'TKT-001', title: 'Server not responding', customer: 'Acme Corp', priority: 'critical', status: 'open', assignee: 'John Smith', created: '2h ago', sla: '1h remaining', description: 'Production server is unresponsive since this morning.' },
  { id: 'TKT-002', title: 'Email sync issues', customer: 'TechStart Inc', priority: 'high', status: 'in_progress', assignee: 'Sarah Johnson', created: '4h ago', sla: '3h remaining', description: 'Outlook not syncing with Exchange server.' },
  { id: 'TKT-003', title: 'Password reset request', customer: 'GlobalTech', priority: 'medium', status: 'open', assignee: 'Unassigned', created: '1d ago', sla: '4h remaining', description: 'User cannot login to their account.' },
  { id: 'TKT-004', title: 'VPN connection drops', customer: 'DataFlow LLC', priority: 'high', status: 'in_progress', assignee: 'Mike Chen', created: '6h ago', sla: '2h remaining', description: 'VPN disconnects every 30 minutes.' },
  { id: 'TKT-005', title: 'Printer offline', customer: 'Acme Corp', priority: 'low', status: 'resolved', assignee: 'John Smith', created: '2d ago', sla: 'Completed', description: 'Office printer not responding.' },
  { id: 'TKT-006', title: 'Software installation', customer: 'StartupXYZ', priority: 'medium', status: 'open', assignee: 'Unassigned', created: '3h ago', sla: '5h remaining', description: 'Install Microsoft Office on new workstation.' },
];

const priorityColors = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors = {
  open: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-cyan-500/20 text-cyan-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  closed: 'bg-slate-500/20 text-slate-400',
};

const statusIcons = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
};

export default function VanguardTickets() {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [tickets, setTickets] = useState(mockTickets);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'medium',
    customer: '',
  });

  useEffect(() => {
    document.title = 'Tickets | Ultrium Vanguard';
  }, []);

  const stats = [
    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, icon: AlertCircle, color: 'text-blue-400' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length, icon: Clock, color: 'text-cyan-400' },
    { label: 'Resolved Today', value: tickets.filter(t => t.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'SLA At Risk', value: tickets.filter(t => t.sla.includes('1h') || t.sla.includes('2h')).length, icon: XCircle, color: 'text-red-400' },
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || ticket.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleCreateTicket = () => {
    if (!newTicket.title || !newTicket.customer) {
      toast.error('Please fill in required fields');
      return;
    }

    const ticketId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`;
    const createdTicket = {
      id: ticketId,
      title: newTicket.title,
      description: newTicket.description,
      priority: newTicket.priority,
      customer: newTicket.customer,
      status: 'open',
      assignee: 'Unassigned',
      created: 'Just now',
      sla: '24h remaining',
    };

    setTickets([createdTicket, ...tickets]);
    setNewTicket({ title: '', description: '', priority: 'medium', customer: '' });
    setIsCreateDialogOpen(false);
    toast.success(`Ticket ${ticketId} created successfully`);
  };

  const handleAssign = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, assignee: 'Current User', status: 'in_progress' } : t
    ));
    toast.success(`Ticket ${ticketId} assigned to you`);
  };

  const handleAddNote = (ticketId: string) => {
    toast.success(`Note added to ${ticketId}`);
  };

  const handleCloseTicket = (ticketId: string) => {
    setTickets(tickets.map(t => 
      t.id === ticketId ? { ...t, status: 'resolved', sla: 'Completed' } : t
    ));
    toast.success(`Ticket ${ticketId} closed`);
  };

  const handleViewDetails = (ticket: typeof mockTickets[0]) => {
    setSelectedTicket(ticket);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Ticket className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tickets</h1>
            <p className="text-white/60 text-sm">Manage support tickets across all customers</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 text-black font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-cyan-500/20">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-white/80">Title *</Label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  className="bg-black/40 border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Customer *</Label>
                <Select value={newTicket.customer} onValueChange={(v) => setNewTicket({ ...newTicket, customer: v })}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="Acme Corp">Acme Corp</SelectItem>
                    <SelectItem value="TechStart Inc">TechStart Inc</SelectItem>
                    <SelectItem value="GlobalTech">GlobalTech</SelectItem>
                    <SelectItem value="DataFlow LLC">DataFlow LLC</SelectItem>
                    <SelectItem value="StartupXYZ">StartupXYZ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Priority</Label>
                <Select value={newTicket.priority} onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}>
                  <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-500/20">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Description</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Detailed description of the issue"
                  className="bg-black/40 border-cyan-500/20 text-white min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-cyan-500/20 text-white/80">
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} className="bg-cyan-500 hover:bg-cyan-600 text-black">
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input 
            placeholder="Search tickets..." 
            className="pl-10 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-black/40 border border-cyan-500/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">All</TabsTrigger>
          <TabsTrigger value="open" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Open</TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">In Progress</TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="bg-black/40 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-500/20">
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Ticket</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Customer</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Priority</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">Assignee</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm">SLA</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const StatusIcon = statusIcons[ticket.status as keyof typeof statusIcons];
                      return (
                        <tr 
                          key={ticket.id} 
                          className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(ticket)}
                        >
                          <td className="p-4">
                            <div>
                              <p className="text-white font-medium">{ticket.title}</p>
                              <p className="text-white/40 text-sm">{ticket.id} • {ticket.created}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">{ticket.customer}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={priorityColors[ticket.priority as keyof typeof priorityColors]}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-white/40" />
                              <span className="text-white/80">{ticket.assignee}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`text-sm ${ticket.sla.includes('remaining') ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {ticket.sla}
                            </span>
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-900 border-cyan-500/20">
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleViewDetails(ticket)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleAssign(ticket.id)}
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Assign to Me
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-white/80 hover:bg-cyan-500/10"
                                  onClick={() => handleAddNote(ticket.id)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Add Note
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-cyan-500/20" />
                                <DropdownMenuItem 
                                  className="text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => handleCloseTicket(ticket.id)}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Close Ticket
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-slate-900 border-cyan-500/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <Ticket className="h-5 w-5 text-cyan-400" />
              {selectedTicket?.id} - {selectedTicket?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Badge className={priorityColors[selectedTicket.priority as keyof typeof priorityColors]}>
                  {selectedTicket.priority}
                </Badge>
                <Badge className={statusColors[selectedTicket.status as keyof typeof statusColors]}>
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
                <span className="text-white/60 text-sm">Created {selectedTicket.created}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/60">Customer</Label>
                  <p className="text-white">{selectedTicket.customer}</p>
                </div>
                <div>
                  <Label className="text-white/60">Assignee</Label>
                  <p className="text-white">{selectedTicket.assignee}</p>
                </div>
                <div>
                  <Label className="text-white/60">SLA Status</Label>
                  <p className={selectedTicket.sla.includes('remaining') ? 'text-amber-400' : 'text-emerald-400'}>
                    {selectedTicket.sla}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-white/60">Description</Label>
                <p className="text-white/80 mt-1">{selectedTicket.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)} className="border-cyan-500/20 text-white/80">
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedTicket) handleAssign(selectedTicket.id);
                setSelectedTicket(null);
              }} 
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
            >
              Assign to Me
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
