/**
 * Atera-style Ticket List with Filters
 * Enhanced ticket view with status, priority, and time period filters
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Search, 
  Plus, 
  Filter,
  Clock,
  User,
  ChevronDown,
  Ticket
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description?: string;
  customer_name: string;
  contact_name?: string;
  technician_name?: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

interface PortalTicketListProps {
  tickets: Ticket[];
  onNewTicket?: () => void;
  onViewTicket?: (ticket: Ticket) => void;
  isCustomerView?: boolean;
}

export function PortalTicketList({ 
  tickets, 
  onNewTicket, 
  onViewTicket,
  isCustomerView = true 
}: PortalTicketListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("open_resolved");
  const [timePeriod, setTimePeriod] = useState<string>("last_modified");
  const [priorityFilters, setPriorityFilters] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true
  });
  const [showFilters, setShowFilters] = useState(true);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      case 'closed': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "open_resolved" && ['open', 'resolved'].includes(ticket.status)) ||
      ticket.status === statusFilter;

    // Priority filter
    const matchesPriority = priorityFilters[ticket.priority as keyof typeof priorityFilters];

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort by time period selection
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const dateA = timePeriod === "last_modified" ? new Date(a.updated_at) : new Date(a.created_at);
    const dateB = timePeriod === "last_modified" ? new Date(b.updated_at) : new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {isCustomerView ? 'My Tickets' : 'Customer Portal'}
        </h2>
        {onNewTicket && (
          <Button onClick={onNewTicket} className="bg-teal-500 hover:bg-teal-600">
            <Plus className="h-4 w-4 mr-1" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 border-b bg-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search tickets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
      </div>

      <div className="flex">
        {/* Ticket List */}
        <div className="flex-1">
          {/* Column Headers */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-500 border-b bg-gray-50">
            <div className="col-span-1">
              <Checkbox />
            </div>
            <div className="col-span-5">Details</div>
            <div className="col-span-2">Technician</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
          </div>

          {/* Tickets */}
          <div className="divide-y">
            {sortedTickets.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No tickets found"
                body="No tickets match your current filters. Try adjusting your search criteria."
                size="sm"
              />
            ) : (
              sortedTickets.map((ticket) => (
                <div 
                  key={ticket.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 hover:bg-gray-50 cursor-pointer items-start"
                  onClick={() => onViewTicket?.(ticket)}
                >
                  <div className="col-span-1">
                    <Checkbox onClick={(e) => e.stopPropagation()} />
                  </div>
                  <div className="col-span-5">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-sm">(#{ticket.ticket_number})</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 hover:text-teal-600">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <span className="text-teal-600">{ticket.customer_name}</span>
                          {ticket.contact_name && (
                            <>
                              <span>·</span>
                              <span>{ticket.contact_name}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          Created {formatDistanceToNow(new Date(ticket.created_at))} ago
                          {ticket.updated_at !== ticket.created_at && (
                            <span> · Modified {formatDistanceToNow(new Date(ticket.updated_at))} ago</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {ticket.technician_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-sm font-medium capitalize ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <Badge className={`${getPriorityColor(ticket.priority)} capitalize`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Filters Sidebar */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <div className="w-64 border-l bg-gray-50">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="p-4 space-y-6">
                {/* Sort By */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Sort by
                  </label>
                  <Select value={timePeriod} onValueChange={setTimePeriod}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_modified">Last Modified</SelectItem>
                      <SelectItem value="created">Date Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_resolved">Open, Resolved</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Priority
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="priority-critical"
                        checked={priorityFilters.critical}
                        onCheckedChange={(checked) => 
                          setPriorityFilters(prev => ({ ...prev, critical: !!checked }))
                        }
                      />
                      <label htmlFor="priority-critical" className="text-sm text-gray-600">
                        Critical
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="priority-high"
                        checked={priorityFilters.high}
                        onCheckedChange={(checked) => 
                          setPriorityFilters(prev => ({ ...prev, high: !!checked }))
                        }
                      />
                      <label htmlFor="priority-high" className="text-sm text-gray-600">
                        High
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="priority-medium"
                        checked={priorityFilters.medium}
                        onCheckedChange={(checked) => 
                          setPriorityFilters(prev => ({ ...prev, medium: !!checked }))
                        }
                      />
                      <label htmlFor="priority-medium" className="text-sm text-gray-600">
                        Medium
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="priority-low"
                        checked={priorityFilters.low}
                        onCheckedChange={(checked) => 
                          setPriorityFilters(prev => ({ ...prev, low: !!checked }))
                        }
                      />
                      <label htmlFor="priority-low" className="text-sm text-gray-600">
                        Low
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </div>
  );
}
