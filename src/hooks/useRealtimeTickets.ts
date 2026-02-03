/**
 * Real-time Ticket Updates Hook
 * Subscribes to ticket changes via Supabase Realtime
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePortalSession } from '@/hooks/usePortalSession';

interface TicketUpdate {
  ticketId: string;
  type: 'status_change' | 'new_comment' | 'assigned';
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
}

export function useRealtimeTickets(ticketId?: string) {
  const { session } = usePortalSession();
  const [updates, setUpdates] = useState<TicketUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleTicketChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'UPDATE') {
      // Check what changed
      if (newRecord.status !== oldRecord?.status) {
        const update: TicketUpdate = {
          ticketId: newRecord.id,
          type: 'status_change',
          oldValue: oldRecord?.status,
          newValue: newRecord.status,
          timestamp: new Date()
        };
        setUpdates(prev => [update, ...prev.slice(0, 49)]);
        
        toast.info(`Ticket status updated to: ${newRecord.status.replace('_', ' ')}`, {
          description: 'Your ticket has been updated'
        });
      }
    }
  }, []);

  const handleCommentInsert = useCallback((payload: any) => {
    const { new: newComment } = payload;
    
    // Only notify if it's from a technician (not customer's own comment)
    if (newComment.commenter_type === 'technician' && !newComment.is_internal) {
      const update: TicketUpdate = {
        ticketId: newComment.ticket_id,
        type: 'new_comment',
        timestamp: new Date()
      };
      setUpdates(prev => [update, ...prev.slice(0, 49)]);
      
      toast.success('New reply on your ticket!', {
        description: 'A technician has responded to your ticket'
      });
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.clientId) return;

    // Subscribe to ticket updates for this client's tickets
    const ticketChannel = supabase
      .channel('portal-tickets')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'helpdesk_tickets',
          filter: ticketId ? `id=eq.${ticketId}` : undefined
        },
        handleTicketChange
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to new comments
    const commentChannel = supabase
      .channel('portal-comments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_comments',
          filter: ticketId ? `ticket_id=eq.${ticketId}` : undefined
        },
        handleCommentInsert
      )
      .subscribe();

    return () => {
      ticketChannel.unsubscribe();
      commentChannel.unsubscribe();
    };
  }, [session?.user?.clientId, ticketId, handleTicketChange, handleCommentInsert]);

  return {
    updates,
    isConnected,
    clearUpdates: () => setUpdates([])
  };
}
