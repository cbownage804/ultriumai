/**
 * Hook for fetching real Vanguard tickets from the database
 */

import { useState, useEffect } from 'react';
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
}

interface UseVanguardTicketsResult {
  tickets: VanguardTicket[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVanguardTickets(clientId?: string): UseVanguardTicketsResult {
  const { user } = useAuth();
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
            client_id
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (clientId) {
          query = query.eq('client_id', clientId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        // Fetch client names if we have tickets
        if (data && data.length > 0) {
          const clientIds = [...new Set(data.filter(t => t.client_id).map(t => t.client_id))];
          
          let clientsMap: Record<string, string> = {};
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

          const ticketsWithClients = data.map(ticket => ({
            ...ticket,
            client_name: ticket.client_id ? clientsMap[ticket.client_id] || 'Unknown' : undefined,
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
  }, [user, clientId, refetchTrigger]);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  return { tickets, isLoading, error, refetch };
}

export function useVanguardTicketDetail(ticketId: string | undefined) {
  const { user } = useAuth();
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

        const { data, error: fetchError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .eq('user_id', user.id)
          .single();

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
  }, [user, ticketId]);

  return { ticket, isLoading, error };
}
