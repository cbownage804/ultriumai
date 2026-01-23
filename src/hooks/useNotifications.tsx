import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: 'security' | 'ticket' | 'system' | 'general';
  read_at?: string;
  action_url?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  expires_at?: string;
}

export interface RealtimeAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  source_table?: string;
  source_id?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  alerts: RealtimeAlert[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  acknowledgeAlert: (id: string, notes?: string) => Promise<void>;
  sendNotification: (notification: Partial<Notification>) => Promise<void>;
  createNotification: (notification: Partial<Notification>) => Promise<void>;
  createSecurityAlert: (alert: Partial<RealtimeAlert>) => Promise<void>;
  isLoading: boolean;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return safe defaults when used outside provider
    return {
      notifications: [] as Notification[],
      alerts: [] as RealtimeAlert[],
      unreadCount: 0,
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      acknowledgeAlert: async () => {},
      sendNotification: async () => {},
      createNotification: async () => {},
      createSecurityAlert: async () => {},
      isLoading: false,
      loading: false
    } as NotificationContextType;
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load initial notifications from notification_queue table
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Map notification_queue to Notification interface
      setNotifications((data || []).map(n => {
        const metadata = (n.metadata as Record<string, unknown>) || {};
        return {
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: (metadata.type as Notification['type']) || 'info',
          category: (metadata.category as Notification['category']) || 'general',
          read_at: n.read_at || undefined,
          action_url: n.action_url || undefined,
          metadata,
          created_at: n.created_at
        };
      }));
    } catch (error: unknown) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load alerts from rmm_alerts table
  const loadAlerts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rmm_alerts')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setAlerts((data || []).map(a => ({
        id: a.id,
        user_id: a.client_id || '',
        alert_type: a.alert_type || 'general',
        severity: (a.severity as RealtimeAlert['severity']) || 'low',
        title: a.title,
        description: a.message || undefined,
        acknowledged_at: a.acknowledged_at || undefined,
        acknowledged_by: a.acknowledged_by || undefined,
        resolved_at: a.resolved_at || undefined,
        metadata: (a.metadata as Record<string, unknown>) || {},
        created_at: a.created_at
      })));
    } catch (error: unknown) {
      console.error('Error loading alerts:', error);
    }
  }, [user]);

  // Load on mount and user change
  useEffect(() => {
    loadNotifications();
    loadAlerts();
  }, [loadNotifications, loadAlerts]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const notificationChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new as Record<string, unknown>;
          const metadata = (newNotif.metadata as Record<string, unknown>) || {};
          
          const notification: Notification = {
            id: newNotif.id as string,
            user_id: newNotif.user_id as string,
            title: newNotif.title as string,
            message: newNotif.message as string,
            type: (metadata.type as Notification['type']) || 'info',
            category: (metadata.category as Notification['category']) || 'general',
            read_at: (newNotif.read_at as string) || undefined,
            action_url: (newNotif.action_url as string) || undefined,
            metadata,
            created_at: newNotif.created_at as string
          };
          
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast for new notifications
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    const alertChannel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rmm_alerts'
        },
        (payload) => {
          const newAlert = payload.new as Record<string, unknown>;
          const alert: RealtimeAlert = {
            id: newAlert.id as string,
            user_id: (newAlert.client_id as string) || '',
            alert_type: (newAlert.alert_type as string) || 'general',
            severity: (newAlert.severity as RealtimeAlert['severity']) || 'low',
            title: newAlert.title as string,
            description: (newAlert.message as string) || undefined,
            metadata: (newAlert.metadata as Record<string, unknown>) || {},
            created_at: newAlert.created_at as string
          };
          
          setAlerts(prev => [alert, ...prev]);
          
          // Show urgent toast for critical alerts
          if (alert.severity === 'critical' || alert.severity === 'high') {
            toast({
              title: `🚨 ${alert.title}`,
              description: alert.description,
              variant: 'destructive',
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [user, toast, loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read'
        })
        .eq('id', id);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (error: unknown) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notification_queue')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read'
        })
        .in('id', unreadIds);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      
      toast({
        title: "All Notifications Read",
        description: "Marked all notifications as read"
      });
    } catch (error: unknown) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const acknowledgeAlert = async (id: string, notes?: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('rmm_alerts')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.id
        })
        .eq('id', id);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(a => a.id !== id));
      
      toast({
        title: "Alert Acknowledged",
        description: notes || "Security alert has been acknowledged"
      });
    } catch (error: unknown) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const sendNotification = async (notification: Partial<Notification>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notification_queue')
        .insert({
          user_id: notification.user_id || user.id,
          title: notification.title || 'Notification',
          message: notification.message || '',
          type: 'in_app',
          channel: 'app',
          priority: 'normal',
          status: 'pending',
          action_url: notification.action_url,
          metadata: {
            type: notification.type || 'info',
            category: notification.category || 'general',
            ...notification.metadata
          }
        });

      if (error) throw error;
    } catch (error: unknown) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  const createNotification = async (notification: Partial<Notification>) => {
    return sendNotification(notification);
  };

  const createSecurityAlert = async (alert: Partial<RealtimeAlert>) => {
    if (!user) return;
    
    try {
      const insertData = {
          client_id: user.id,
          title: alert.title || 'Security Alert',
          message: alert.description,
          alert_type: alert.alert_type || 'security',
          severity: alert.severity || 'medium',
          status: 'open',
          source: 'user',
          metadata: JSON.parse(JSON.stringify(alert.metadata || {}))
        };
      const { error } = await supabase
        .from('rmm_alerts')
        .insert(insertData);

      if (error) throw error;
      
      toast({
        title: "🚨 Alert Created",
        description: alert.title,
        variant: alert.severity === 'critical' ? 'destructive' : 'default'
      });
    } catch (error: unknown) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length + alerts.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        alerts,
        unreadCount,
        markAsRead,
        markAllAsRead,
        acknowledgeAlert,
        sendNotification,
        createNotification,
        createSecurityAlert,
        isLoading,
        loading: isLoading
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
