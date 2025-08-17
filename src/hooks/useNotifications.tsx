import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  category: 'security' | 'ticket' | 'system' | 'general';
  read_at?: string;
  action_url?: string;
  metadata: any;
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
  metadata: any;
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
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
    loadAlerts();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const notificationChannel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notifications
          toast({
            title: newNotification.title,
            description: newNotification.message,
            variant: newNotification.type === 'error' ? 'destructive' : 'default',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    const alertChannel = supabase
      .channel('security_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts'
        },
        (payload) => {
          const newAlert = payload.new as RealtimeAlert;
          setAlerts(prev => [newAlert, ...prev]);
          
          // Show urgent toast for critical alerts
          if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
            toast({
              title: `🚨 ${newAlert.title}`,
              description: newAlert.description,
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
  }, [toast]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []).map(n => ({
        ...n,
        type: n.type as 'success' | 'warning' | 'error' | 'info',
        category: n.category as 'security' | 'ticket' | 'system' | 'general'
      })));
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .is('resolved_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts((data || []).map(a => ({
        ...a,
        severity: a.severity as 'low' | 'medium' | 'high' | 'critical',
        metadata: a.affected_systems || {}
      })));
    } catch (error: any) {
      console.error('Error loading alerts:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const acknowledgeAlert = async (id: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          acknowledged_at: new Date().toISOString(),
          resolution_notes: notes 
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const sendNotification = async (notification: Partial<Notification>) => {
    try {
      const { error } = await supabase.rpc('send_notification', {
        p_user_id: notification.user_id,
        p_title: notification.title,
        p_message: notification.message,
        p_type: notification.type || 'info',
        p_category: notification.category || 'general',
        p_action_url: notification.action_url,
        p_metadata: notification.metadata || {}
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error sending notification:', error);
      throw error;
    }
  };

  const createNotification = async (notification: Partial<Notification>) => {
    return sendNotification(notification);
  };

  const createSecurityAlert = async (alert: Partial<RealtimeAlert>) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          user_id: alert.user_id,
          alert_type: alert.alert_type || 'general',
          severity: alert.severity || 'low',
          title: alert.title,
          description: alert.description,
          metadata: alert.metadata || {}
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

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