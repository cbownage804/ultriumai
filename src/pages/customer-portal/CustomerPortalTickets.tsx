/**
 * Customer Portal Tickets List Page
 * View all tickets for the logged-in portal user
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, Plus, Clock, AlertCircle, ChevronRight, 
  Loader2, Search, Filter, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePortalSession } from '@/hooks/usePortalSession';
import { PortalHeader } from '@/components/customer-portal/PortalHeader';

interface PortalTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  last_response_at?: string;
}

export default function CustomerPortalTickets() {
  const navigate = useNavigate();
  const { session, isLoading: sessionLoading } = usePortalSession();
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<PortalTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/customer-portal/login');
    }
  }, [session, sessionLoading, navigate]);

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session]);

  useEffect(() => {
    let filtered = [...tickets];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.subject.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter]);

  const fetchTickets = async () => {
    if (!session) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('portal-ticket-api', {
        body: { action: 'list' },
        headers: {
          'x-portal-session': session.sessionToken
        }
      });

      if (error) throw error;
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'waiting_on_customer': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PortalHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back & Title */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer-portal/dashboard')}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
            <p className="text-white/60">{tickets.length} total tickets</p>
          </div>
          <Button
            onClick={() => navigate('/customer-portal/tickets/new')}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-black/40 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2 text-white/50" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_on_customer">Waiting on You</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card className="bg-black/40 border-white/10">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Ticket className="h-16 w-16 text-white/20 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {tickets.length === 0 ? 'No tickets yet' : 'No matching tickets'}
              </h3>
              <p className="text-white/60 mb-6">
                {tickets.length === 0 
                  ? 'Create your first support ticket to get started'
                  : 'Try adjusting your search or filter'
                }
              </p>
              {tickets.length === 0 && (
                <Button
                  onClick={() => navigate('/customer-portal/tickets/new')}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className="bg-black/40 border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/customer-portal/tickets/${ticket.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                            {ticket.subject}
                          </h3>
                          <Badge className={getStatusColor(ticket.status)}>
                            {formatStatus(ticket.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/50">
                          <span className="flex items-center gap-1">
                            <AlertCircle className={`h-3 w-3 ${getPriorityColor(ticket.priority)}`} />
                            {ticket.priority}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          {ticket.category && (
                            <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                              {ticket.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
