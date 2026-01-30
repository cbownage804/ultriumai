import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Ticket, Plus, Search, Clock, CheckCircle, AlertCircle, 
  User, MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

interface TicketData {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  created_at: string;
  updated_at: string;
}

interface OrgTicketsTabProps {
  orgId: string;
  orgName: string;
  tickets: TicketData[];
  isLoading?: boolean;
  onCreateTicket?: (ticket: Partial<TicketData>) => void;
}

export const OrgTicketsTab = ({ orgId, orgName, tickets, isLoading, onCreateTicket }: OrgTicketsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { class: string; label: string }> = {
      critical: { class: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Critical' },
      high: { class: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'High' },
      medium: { class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Medium' },
      low: { class: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Low' },
    };
    const variant = variants[priority] || variants.medium;
    return <Badge className={variant.class}>{variant.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { class: string; icon: React.ReactNode; label: string }> = {
      open: { class: 'bg-blue-500/10 text-blue-400', icon: <AlertCircle className="h-3 w-3 mr-1" />, label: 'Open' },
      in_progress: { class: 'bg-yellow-500/10 text-yellow-400', icon: <Clock className="h-3 w-3 mr-1" />, label: 'In Progress' },
      resolved: { class: 'bg-green-500/10 text-green-400', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Resolved' },
      closed: { class: 'bg-white/5 text-white/50', icon: <CheckCircle className="h-3 w-3 mr-1" />, label: 'Closed' },
    };
    const variant = variants[status] || variants.open;
    return <Badge className={variant.class}>{variant.icon}{variant.label}</Badge>;
  };

  const handleCreate = () => {
    onCreateTicket?.({
      ...newTicket,
      priority: newTicket.priority as TicketData['priority'],
      status: 'open'
    });
    setShowCreateDialog(false);
    setNewTicket({ title: '', description: '', priority: 'medium' });
  };

  return (
    <div className="space-y-4">
      <Card className="bg-black/80 border-cyan-500/30 shadow-xl shadow-purple-500/10">
        <CardHeader className="border-b border-cyan-500/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Ticket className="h-5 w-5 text-cyan-400" />
                Response Tickets
              </CardTitle>
              <CardDescription className="text-white/60">
                Support tickets for {orgName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-64 bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
                />
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-white/5 animate-pulse rounded" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No tickets</h3>
              <p className="text-white/60 mb-4">
                {searchQuery ? 'No tickets match your search' : 'No support tickets for this organization'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 bg-black/40">
                    <TableHead className="text-white/60">Ticket</TableHead>
                    <TableHead className="text-white/60">Status</TableHead>
                    <TableHead className="text-white/60">Priority</TableHead>
                    <TableHead className="text-white/60">Assignee</TableHead>
                    <TableHead className="text-white/60">Created</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map(ticket => (
                    <TableRow key={ticket.id} className="cursor-pointer hover:bg-white/5 border-cyan-500/10">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{ticket.title}</p>
                          {ticket.description && (
                            <p className="text-xs text-white/50 line-clamp-1">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        {ticket.assignee ? (
                          <div className="flex items-center gap-1 text-white/80">
                            <User className="h-3 w-3" />
                            {ticket.assignee}
                          </div>
                        ) : (
                          <span className="text-white/40">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-white/50">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white hover:bg-cyan-500/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black/90 border-cyan-500/30">
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Assign</DropdownMenuItem>
                            <DropdownMenuItem className="text-white/80 hover:bg-cyan-500/10">Close Ticket</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-black/95 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-white">Create Ticket</DialogTitle>
            <DialogDescription className="text-white/60">
              Create a new support ticket for {orgName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Title</Label>
              <Input
                placeholder="Ticket title..."
                value={newTicket.title}
                onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                className="bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Description</Label>
              <Textarea
                placeholder="Describe the issue..."
                value={newTicket.description}
                onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                className="bg-black/40 border-cyan-500/20 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Priority</Label>
              <Select 
                value={newTicket.priority} 
                onValueChange={(v) => setNewTicket(prev => ({ ...prev, priority: v }))}
              >
                <SelectTrigger className="bg-black/40 border-cyan-500/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-cyan-500/30">
                  <SelectItem value="low" className="text-white/80 focus:bg-cyan-500/10">Low</SelectItem>
                  <SelectItem value="medium" className="text-white/80 focus:bg-cyan-500/10">Medium</SelectItem>
                  <SelectItem value="high" className="text-white/80 focus:bg-cyan-500/10">High</SelectItem>
                  <SelectItem value="critical" className="text-white/80 focus:bg-cyan-500/10">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-cyan-500/30 text-white/80 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTicket.title} className="bg-gradient-to-r from-cyan-500 to-purple-600">
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};