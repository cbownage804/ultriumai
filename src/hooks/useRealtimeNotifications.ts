import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface RealtimeNotification {
  id: string;
  type: 'ticket' | 'alert' | 'system' | 'escalation' | 'sla' | 'chat';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add notification
  const addNotification = useCallback((notification: Omit<RealtimeNotification, 'id' | 'read' | 'created_at'>) => {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      created_at: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setUnreadCount(prev => prev + 1);
    
    // Show toast for important notifications
    if (notification.severity === 'error' || notification.severity === 'warning') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.severity === 'error' ? 'destructive' : 'default',
      });
    }
  }, [toast]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Subscribe to realtime events
  useEffect(() => {
    if (!user) return;

    // Subscribe to tickets channel
    const ticketsChannel = supabase
      .channel('tickets-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          addNotification({
            type: 'ticket',
            title: 'New Ticket Created',
            message: `Ticket: ${(payload.new as any).subject || 'New ticket'}`,
            severity: 'info',
            metadata: payload.new,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check for status change
          if (newData.status !== oldData.status) {
            addNotification({
              type: 'ticket',
              title: 'Ticket Status Updated',
              message: `Ticket "${newData.subject}" changed to ${newData.status}`,
              severity: 'info',
              metadata: payload.new,
            });
          }
          
          // Check for escalation
          if (newData.priority !== oldData.priority && 
              ['high', 'urgent', 'critical'].includes(newData.priority)) {
            addNotification({
              type: 'escalation',
              title: 'Ticket Escalated',
              message: `Ticket "${newData.subject}" escalated to ${newData.priority}`,
              severity: 'warning',
              metadata: payload.new,
            });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to alerts channel
    const alertsChannel = supabase
      .channel('alerts-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
        },
        (payload) => {
          const event = payload.new as any;
          addNotification({
            type: 'alert',
            title: 'Security Alert',
            message: event.event_type || 'New security event detected',
            severity: event.severity === 'critical' ? 'error' : 
                      event.severity === 'high' ? 'warning' : 'info',
            metadata: payload.new,
          });
        }
      )
      .subscribe();

    // Subscribe to agent status changes
    const agentsChannel = supabase
      .channel('agents-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vanguard_agents',
        },
        (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          if (newData.status !== oldData.status && newData.status === 'offline') {
            addNotification({
              type: 'alert',
              title: 'Agent Offline',
              message: `Agent "${newData.device_name || newData.hostname}" went offline`,
              severity: 'warning',
              metadata: payload.new,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(agentsChannel);
    };
  }, [user, addNotification]);

  return {
    notifications,
    unreadCount,
    isConnected,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}
