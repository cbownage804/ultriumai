/**
 * Hook for fetching real Vanguard tickets from the database
 * Supports admin mode for @ultriumai.com users to see all tickets
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface VanguardTicket {
  id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
  due_date: string | null;
  assigned_to: string | null;
  client_id: string | null;
  client_name?: string;
  contact_name?: string;
  category?: string;
  owner_email?: string;
  user_id?: string;
}

interface UseVanguardTicketsOptions {
  clientId?: string;
  adminMode?: boolean;
}

interface UseVanguardTicketsResult {
  tickets: VanguardTicket[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isAdmin: boolean;
}

// Check if user is an admin (@ultriumai.com email)
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsChecking(false);
        return;
      }

      // Check if user email ends with @ultriumai.com
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      const email = profile?.email || user.email || '';
      setIsAdmin(email.toLowerCase().endsWith('@ultriumai.com'));
      setIsChecking(false);
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, isChecking };
}

export function useVanguardTickets(options: UseVanguardTicketsOptions = {}): UseVanguardTicketsResult {
  const { clientId, adminMode = false } = options;
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [tickets, setTickets] = useState<VanguardTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        let query = supabase
          .from('tickets')
          .select(`
            id,
            title,
            description,
            status,
            priority,
            created_at,
            updated_at,
            due_date,
            assigned_to,
            client_id,
            user_id
          `)
          .order('created_at', { ascending: false });

        // Only filter by user_id if NOT in admin mode or user is not admin
        if (!adminMode || !isAdmin) {
          query = query.eq('user_id', user.id);
        }

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Fetch client names and owner emails if we have tickets
        if (data && data.length > 0) {
          const clientIds = [...new Set(data.filter(t => t.client_id).map(t => t.client_id))];
          const userIds = [...new Set(data.filter(t => t.user_id).map(t => t.user_id))];
          
          let clientsMap: Record<string, string> = {};
          let usersMap: Record<string, string> = {};

          if (clientIds.length > 0) {
            const { data: clients } = await supabase
              .from('msp_clients')
              .select('id, company_name')
              .in('id', clientIds);
            
            if (clients) {
              clientsMap = clients.reduce((acc, c) => {
                acc[c.id] = c.company_name;
                return acc;
              }, {} as Record<string, string>);
            }
          }

          // Fetch owner emails for admin view
          if (adminMode && isAdmin && userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', userIds);
            
            if (profiles) {
              usersMap = profiles.reduce((acc, p) => {
                acc[p.id] = p.email || 'Unknown';
                return acc;
              }, {} as Record<string, string>);
            }
          }

          const ticketsWithClients = data.map(ticket => ({
            ...ticket,
            client_name: ticket.client_id ? clientsMap[ticket.client_id] || 'Unknown' : undefined,
            owner_email: ticket.user_id ? usersMap[ticket.user_id] : undefined,
            status: ticket.status as VanguardTicket['status'],
            priority: (ticket.priority || 'medium') as VanguardTicket['priority'],
          }));

          setTickets(ticketsWithClients);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [user, clientId, refetchTrigger, adminMode, isAdmin]);

  const refetch = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

  return { tickets, isLoading, error, refetch, isAdmin };
}

export function useVanguardTicketDetail(ticketId: string | undefined) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [ticket, setTicket] = useState<VanguardTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!user || !ticketId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Admins can view any ticket, regular users only their own
        let query = supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId);

        if (!isAdmin) {
          query = query.eq('user_id', user.id);
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) throw fetchError;

        if (data) {
          // Fetch client name
          let clientName;
          if (data.client_id) {
            const { data: client } = await supabase
              .from('msp_clients')
              .select('company_name')
              .eq('id', data.client_id)
              .single();
            clientName = client?.company_name;
          }

          setTicket({
            ...data,
            client_name: clientName,
            status: data.status as VanguardTicket['status'],
            priority: (data.priority || 'medium') as VanguardTicket['priority'],
          });
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicket();
  }, [user, ticketId, isAdmin]);

  return { ticket, isLoading, error };
}
