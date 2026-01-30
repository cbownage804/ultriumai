import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';
import { devLog } from '@/lib/logger';

// Ticket types matching helpdesk_tickets schema
export interface Ticket {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  category: string | null;
  customer_id: string | null;
  contact_id: string | null;
  assigned_to: string | null;
  sla_policy_id: string | null;
  sla_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  device_context: Json | null;
  tags: string[] | null;
  escalation_level: number | null;
  customer_satisfaction: number | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  last_activity_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  source?: string | null;
  ai_processing_status?: string | null;
  ai_suggested_solution?: string | null;
  ai_confidence_score?: number | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  visibility_level: string;
  created_at: string;
  updated_at: string;
}

// Match sla_policies schema
export interface SLAPolicy {
  id: string;
  name: string;
  description: string | null;
  priority_level: string;
  first_response_hours: number;
  resolution_hours: number;
  escalation_hours: number;
  business_hours_only: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SafeDeskStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  slaBreaches: number;
}

export const useSafeDesk = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [slaPolicies, setSlaPolicies] = useState<SLAPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SafeDeskStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    slaBreaches: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Load all tickets
  const loadTickets = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const ticketsData = data || [];
      setTickets(ticketsData as unknown as Ticket[]);
      
      // Calculate stats
      const openTickets = ticketsData.filter(t => t.status === 'open').length;
      const inProgressTickets = ticketsData.filter(t => t.status === 'in_progress').length;
      const resolvedTickets = ticketsData.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      
      // Calculate average resolution time
      const resolvedWithTime = ticketsData.filter(t => t.actual_hours && t.actual_hours > 0);
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((sum, t) => sum + (t.actual_hours || 0), 0) / resolvedWithTime.length
        : 0;
      
      // Calculate SLA breaches
      const now = new Date();
      const slaBreaches = ticketsData.filter(t => 
        t.sla_due_at && 
        new Date(t.sla_due_at) < now && 
        t.status !== 'resolved' && 
        t.status !== 'closed'
      ).length;
      
      setStats({
        totalTickets: ticketsData.length,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        avgResolutionTime: Math.round(avgResolutionTime * 60), // Convert to minutes
        slaBreaches
      });
      
      return ticketsData;
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive"
      });
      return [];
    }
  }, [user, toast]);

  // Load comments for a ticket
  const loadComments = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data as unknown as TicketComment[] || []);
      return data || [];
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }, []);

  // Load SLA policies
  const loadSlaPolicies = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sla_policies')
        .select('*')
        .order('priority_level');

      if (error) throw error;
      setSlaPolicies(data as unknown as SLAPolicy[] || []);
      return data || [];
    } catch (error) {
      console.error('Error loading SLA policies:', error);
      return [];
    }
  }, []);

  // Create ticket
  const createTicket = async (ticketData: Partial<Ticket>) => {
    if (!user) return null;
    
    try {
      // Calculate SLA due date based on priority
      let slaDueAt: string | null = null;
      const matchingPolicy = slaPolicies.find(p => p.priority_level === ticketData.priority);
      if (matchingPolicy) {
        const dueDate = new Date();
        dueDate.setHours(dueDate.getHours() + matchingPolicy.resolution_hours);
        slaDueAt = dueDate.toISOString();
      }

      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .insert({
          title: ticketData.title || 'New Ticket',
          description: ticketData.description,
          priority: ticketData.priority || 'medium',
          status: ticketData.status || 'open',
          category: ticketData.category,
          customer_id: ticketData.customer_id,
          contact_id: ticketData.contact_id,
          source: ticketData.source || 'manual',
          tags: ticketData.tags,
          sla_due_at: ticketData.sla_due_at || slaDueAt
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Ticket Created",
        description: `Ticket #${data.id.slice(0, 8)} has been created`
      });
      
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  // Update ticket
  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    try {
      const updateData: Record<string, unknown> = { 
        ...updates, 
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      };
      
      // If resolving, set resolved_at
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .update(updateData)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Ticket Updated",
        description: "Ticket has been updated successfully"
      });
      
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete ticket
  const deleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('helpdesk_tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      
      toast({
        title: "Ticket Deleted",
        description: "Ticket has been deleted"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive"
      });
      return false;
    }
  };

  // Add comment to ticket
  const addComment = async (ticketId: string, content: string, isInternal: boolean = false) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          content,
          is_internal: isInternal,
          visibility_level: isInternal ? 'internal' : 'public'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update ticket's first_response_at if this is the first response
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && !ticket.first_response_at) {
        await supabase
          .from('helpdesk_tickets')
          .update({ 
            first_response_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString()
          })
          .eq('id', ticketId);
      }
      
      await loadComments(ticketId);
      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      return null;
    }
  };

  // Assign ticket
  const assignTicket = async (ticketId: string, assigneeId: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .update({
          assigned_to: assigneeId,
          status: 'in_progress',
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Ticket Assigned",
        description: "Ticket has been assigned"
      });
      
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  // Escalate ticket
  const escalateTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const currentLevel = ticket?.escalation_level || 0;
    
    try {
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .update({
          escalation_level: currentLevel + 1,
          priority: 'high',
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Ticket Escalated",
        description: `Ticket escalated to level ${currentLevel + 1}`
      });
      
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error escalating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to escalate ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadTickets(),
      loadSlaPolicies()
    ]);
    setIsLoading(false);
  }, [loadTickets, loadSlaPolicies]);

  // Initialize data and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    refreshAll();

    // Real-time subscriptions
    const ticketsChannel = supabase
      .channel('safedesk-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'helpdesk_tickets' }, async (payload) => {
        loadTickets();
        
        // Handle new tickets
        if (payload.eventType === 'INSERT') {
          const newTicket = payload.new as { 
            id?: string;
            priority?: string; 
            title?: string; 
            source?: string;
            device_context?: { auto_generated?: boolean; alert_id?: string };
          };
          
          // Show toast for new high priority tickets
          if (newTicket.priority === 'critical' || newTicket.priority === 'high') {
            toast({
              title: `🎫 New ${newTicket.priority} Priority Ticket`,
              description: newTicket.title || 'New ticket created'
            });
          }
          
          // Auto-trigger AI processing for RMM-generated tickets
          if (newTicket.source === 'rmm_alert' && newTicket.device_context?.auto_generated && newTicket.id) {
            devLog.log('[SafeDesk] Auto-triggering AI processing for RMM alert ticket:', newTicket.id);
            
            // Invoke AI helpdesk assistant for automatic processing
            try {
              const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-helpdesk-assistant', {
                body: {
                  action: 'generate_solution',
                  ticketId: newTicket.id,
                  ticketData: {
                    title: newTicket.title,
                    priority: newTicket.priority,
                    source: 'rmm_alert',
                    auto_generated: true
                  }
                }
              });

              if (aiError) {
                console.error('[SafeDesk] AI processing error:', aiError);
              } else {
                devLog.log('[SafeDesk] AI processing complete:', aiResult);
                
                // Show AI processing result
                toast({
                  title: "🤖 AI Analyzing RMM Alert",
                  description: `Confidence: ${aiResult?.confidence || 'Analyzing...'}%`
                });
                
                // If confidence is high enough, auto-resolve
                if (aiResult?.confidence >= 85) {
                  await supabase.functions.invoke('ai-helpdesk-assistant', {
                    body: {
                      action: 'auto_resolve',
                      ticketId: newTicket.id
                    }
                  });
                  
                  toast({
                    title: "✅ AI Auto-Resolved Ticket",
                    description: "High-confidence solution applied automatically"
                  });
                }
              }
            } catch (err) {
              console.error('[SafeDesk] Failed to invoke AI processing:', err);
            }
          }
        }
      })
      .subscribe();

    const commentsChannel = supabase
      .channel('safedesk-comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments' }, () => {
        // Comments will be reloaded when viewing a specific ticket
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [user, refreshAll, loadTickets, toast]);

  // AI-powered ticket analysis
  const analyzeTicket = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'generate_solution',
          ticketId: ticket.id,
          ticketData: {
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "AI Analysis Complete",
        description: `Confidence: ${data?.confidence || 'N/A'}%`
      });
      
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error analyzing ticket:', error);
      toast({
        title: "AI Analysis Failed",
        description: "Could not analyze ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  // Auto-resolve ticket with AI
  const autoResolveTicket = async (ticketId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'auto_resolve',
          ticketId
        }
      });

      if (error) throw error;
      
      if (data?.autoResolved) {
        toast({
          title: "Ticket Auto-Resolved",
          description: "AI successfully resolved the ticket"
        });
      } else {
        toast({
          title: "Manual Review Required",
          description: "Ticket requires human intervention"
        });
      }
      
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error auto-resolving ticket:', error);
      toast({
        title: "Error",
        description: "Failed to auto-resolve ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  // Generate AI summary for ticket
  const generateSummary = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-helpdesk-assistant', {
        body: {
          action: 'generate_summary',
          ticketData: {
            title: ticket.title,
            description: ticket.description,
            category: ticket.category
          }
        }
      });

      if (error) throw error;
      return data?.summary || null;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  };

  // Helper functions
  const getTicketsByStatus = (status: string) => tickets.filter(t => t.status === status);
  const getTicketsByPriority = (priority: string) => tickets.filter(t => t.priority === priority);
  const getOverdueTickets = () => {
    const now = new Date();
    return tickets.filter(t => 
      t.sla_due_at && 
      new Date(t.sla_due_at) < now && 
      t.status !== 'resolved' && 
      t.status !== 'closed'
    );
  };
  const getHighPriorityTickets = () => tickets.filter(t => t.priority === 'high' || t.priority === 'critical');

  return {
    // Data
    tickets,
    comments,
    slaPolicies,
    stats,
    isLoading,
    
    // Ticket operations
    createTicket,
    updateTicket,
    deleteTicket,
    assignTicket,
    escalateTicket,
    loadTickets,
    
    // AI operations
    analyzeTicket,
    autoResolveTicket,
    generateSummary,
    
    // Comment operations
    addComment,
    loadComments,
    
    // SLA operations
    loadSlaPolicies,
    
    // Helpers
    getTicketsByStatus,
    getTicketsByPriority,
    getOverdueTickets,
    getHighPriorityTickets,
    refreshAll
  };
};
