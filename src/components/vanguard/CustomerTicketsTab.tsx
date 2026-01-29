/**
 * Customer Tickets Tab Component
 * Displays sortable and searchable ticket list for a specific customer
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Ticket, Search, ArrowUpDown, Clock, Plus, ExternalLink,
  AlertTriangle, CheckCircle2, Circle, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { formatDistanceToNow, differenceInHours, parseISO } from 'date-fns';
import { getVanguardBasePath } from '@/utils/subdomain';

interface TicketData {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  contact_name: string;
  category: string;
}

// Mock tickets for demo - in production, this would come from props/API
const mockTickets: TicketData[] = [
  { 
    id: 'TKT-001', 
    title: 'VPN connection failing intermittently', 
    status: 'open', 
    priority: 'high',
    created_at: '2025-01-28T10:30:00Z',
    updated_at: '2025-01-28T14:00:00Z',
    assigned_to: 'Alex Tech',
    contact_name: 'John Smith',
    category: 'Network'
  },
  { 
    id: 'TKT-002', 
    title: 'Email sync issues on mobile devices', 
    status: 'in_progress', 
    priority: 'medium',
    created_at: '2025-01-27T08:15:00Z',
    updated_at: '2025-01-28T09:00:00Z',
    assigned_to: 'Sarah Dev',
    contact_name: 'Sarah Johnson',
    category: 'Email'
  },
  { 
    id: 'TKT-003', 
    title: 'New user onboarding - Mike Williams', 
    status: 'waiting', 
    priority: 'low',
    created_at: '2025-01-25T14:00:00Z',
    updated_at: '2025-01-26T11:00:00Z',
    assigned_to: null,
    contact_name: 'HR Department',
    category: 'Onboarding'
  },
  { 
    id: 'TKT-004', 
    title: 'Critical - Server unresponsive', 
    status: 'resolved', 
    priority: 'critical',
    created_at: '2025-01-20T02:00:00Z',
    updated_at: '2025-01-20T05:30:00Z',
    assigned_to: 'Mike Ops',
    contact_name: 'John Smith',
    category: 'Server'
  },
  { 
    id: 'TKT-005', 
    title: 'Software license renewal request', 
    status: 'closed', 
    priority: 'low',
    created_at: '2025-01-15T09:00:00Z',
    updated_at: '2025-01-17T16:00:00Z',
    assigned_to: 'Admin Team',
    contact_name: 'Finance Dept',
    category: 'Licensing'
  },
  { 
    id: 'TKT-006', 
    title: 'Printer not connecting to network', 
    status: 'open', 
    priority: 'medium',
    created_at: '2025-01-29T07:45:00Z',
    updated_at: '2025-01-29T07:45:00Z',
    assigned_to: null,
    contact_name: 'Reception',
    category: 'Hardware'
  },
];

type SortField = 'created_at' | 'priority' | 'status' | 'title';
type SortOrder = 'asc' | 'desc';

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-500/20 text-blue-400', icon: Circle },
  in_progress: { label: 'In Progress', color: 'bg-amber-500/20 text-amber-400', icon: Clock },
  waiting: { label: 'Waiting', color: 'bg-purple-500/20 text-purple-400', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-500/20 text-green-400', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-500/20 text-slate-400', icon: CheckCircle2 },
};

const priorityConfig = {
  critical: { label: 'Critical', color: 'text-red-400', icon: AlertTriangle },
  high: { label: 'High', color: 'text-orange-400', icon: ArrowUp },
  medium: { label: 'Medium', color: 'text-amber-400', icon: Minus },
  low: { label: 'Low', color: 'text-green-400', icon: ArrowDown },
};

const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
const statusOrder = { open: 0, in_progress: 1, waiting: 2, resolved: 3, closed: 4 };

interface CustomerTicketsTabProps {
  customerId: string;
  customerName?: string;
  tickets?: TicketData[];
}

export function CustomerTicketsTab({ customerId, customerName, tickets = mockTickets }: CustomerTicketsTabProps) {
  const navigate = useNavigate();
  const basePath = getVanguardBasePath();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.contact_name.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tickets, searchQuery, statusFilter, sortField, sortOrder]);

  const getAgeIndicator = (createdAt: string) => {
    const hours = differenceInHours(new Date(), parseISO(createdAt));
    if (hours < 24) return { label: 'New', color: 'text-green-400' };
    if (hours < 72) return { label: `${Math.floor(hours / 24)}d`, color: 'text-amber-400' };
    return { label: `${Math.floor(hours / 24)}d`, color: 'text-red-400' };
  };

  const openTicketsCount = tickets.filter(t => !['resolved', 'closed'].includes(t.status)).length;

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Ticket className="h-5 w-5 text-gray-500" />
          <CardTitle className="text-gray-900">
            Tickets ({openTicketsCount} open)
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`${basePath}/tickets?customer=${customerId}`)}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View All
          </Button>
          <Button 
            size="sm" 
            className="bg-teal-500 hover:bg-teal-600"
            onClick={() => navigate(`${basePath}/tickets/new?customer=${customerId}`)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Ticket
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={`${sortField}-${sortOrder}`} 
            onValueChange={(v) => {
              const [field, order] = v.split('-') as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="priority-asc">Priority (High to Low)</SelectItem>
              <SelectItem value="priority-desc">Priority (Low to High)</SelectItem>
              <SelectItem value="status-asc">Status</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Table */}
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead className="w-[60px]">Age</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[100px]">Priority</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[150px]">Contact</TableHead>
                <TableHead className="w-[120px]">Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tickets found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTickets.map((ticket) => {
                  const status = statusConfig[ticket.status];
                  const priority = priorityConfig[ticket.priority];
                  const age = getAgeIndicator(ticket.created_at);
                  const StatusIcon = status.icon;
                  const PriorityIcon = priority.icon;

                  return (
                    <TableRow 
                      key={ticket.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`${basePath}/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-mono text-sm text-teal-600">
                        {ticket.id}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${age.color}`}>
                          {age.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-gray-900">{ticket.title}</span>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(parseISO(ticket.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${priority.color}`}>
                          <PriorityIcon className="h-4 w-4" />
                          <span className="text-sm">{priority.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ticket.contact_name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {ticket.assigned_to || <span className="text-gray-400">Unassigned</span>}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Summary */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <span className="text-sm text-gray-500">
            Showing {filteredAndSortedTickets.length} of {tickets.length} tickets
          </span>
          <div className="flex gap-4 text-sm">
            <span className="text-blue-500">{tickets.filter(t => t.status === 'open').length} open</span>
            <span className="text-amber-500">{tickets.filter(t => t.status === 'in_progress').length} in progress</span>
            <span className="text-green-500">{tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length} resolved</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
