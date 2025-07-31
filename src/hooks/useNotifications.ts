import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'security';
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  acknowledged: boolean;
  action_url?: string;
  metadata: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  source_system: string;
  affected_systems: any[];
  indicators: any;
  remediation_steps?: string;
  resolution_notes?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        title: item.title,
        message: item.message,
        type: item.type as 'info' | 'success' | 'warning' | 'error' | 'security',
        category: item.category,
        severity: item.severity as 'low' | 'medium' | 'high' | 'critical',
        read: !!item.read,
        acknowledged: !!item.acknowledged,
        action_url: item.action_url,
        metadata: item.metadata,
        expires_at: item.expires_at,
        created_at: item.created_at,
        updated_at: item.updated_at || item.created_at
      })) || [];

      setNotifications(formattedData);
      const unread = formattedData?.filter(n => !n.read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Fetch security alerts
  const fetchAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'investigating'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedData = data?.map(item => ({
        ...item,
        severity: item.severity as 'low' | 'medium' | 'high' | 'critical',
        status: item.status as 'active' | 'investigating' | 'resolved' | 'dismissed',
        affected_systems: Array.isArray(item.affected_systems) ? item.affected_systems : []
      })) || [];

      setAlerts(formattedData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Acknowledge security alert
  const acknowledgeAlert = async (alertId: string, resolutionNotes?: string) => {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({ 
          status: 'resolved',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: resolutionNotes || 'Acknowledged by user'
        })
        .eq('id', alertId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAlerts(prev => prev.filter(a => a.id !== alertId));
      
      toast({
        title: "Alert Resolved",
        description: "Security alert has been acknowledged and resolved.",
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  // Create notification
  const createNotification = async (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notification,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Don't add to local state - let realtime handle it
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  // Create security alert
  const createSecurityAlert = async (alert: Omit<SecurityAlert, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .insert([{
          ...alert,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Show immediate toast for critical alerts
      if (alert.severity === 'critical') {
        toast({
          title: "Critical Security Alert",
          description: alert.title,
          variant: "destructive",
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating security alert:', error);
      throw error;
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    fetchAlerts();

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          const formattedNotification: Notification = {
            id: newNotification.id,
            user_id: newNotification.user_id,
            title: newNotification.title,
            message: newNotification.message,
            type: newNotification.type,
            category: newNotification.category,
            severity: newNotification.severity,
            read: !!newNotification.read,
            acknowledged: !!newNotification.acknowledged,
            action_url: newNotification.action_url,
            metadata: newNotification.metadata,
            expires_at: newNotification.expires_at,
            created_at: newNotification.created_at,
            updated_at: newNotification.updated_at || newNotification.created_at
          };
          
          setNotifications(prev => [formattedNotification, ...prev]);
          
          if (!formattedNotification.read) {
            setUnreadCount(prev => prev + 1);
          }

          // Show toast for high priority notifications
          if (formattedNotification.severity === 'high' || formattedNotification.severity === 'critical') {
            toast({
              title: formattedNotification.title,
              description: formattedNotification.message,
              variant: formattedNotification.type === 'error' ? 'destructive' : 'default',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedNotification = payload.new as any;
          const formattedNotification: Notification = {
            id: updatedNotification.id,
            user_id: updatedNotification.user_id,
            title: updatedNotification.title,
            message: updatedNotification.message,
            type: updatedNotification.type,
            category: updatedNotification.category,
            severity: updatedNotification.severity,
            read: !!updatedNotification.read,
            acknowledged: !!updatedNotification.acknowledged,
            action_url: updatedNotification.action_url,
            metadata: updatedNotification.metadata,
            expires_at: updatedNotification.expires_at,
            created_at: updatedNotification.created_at,
            updated_at: updatedNotification.updated_at || updatedNotification.created_at
          };
          
          setNotifications(prev => 
            prev.map(n => n.id === formattedNotification.id ? formattedNotification : n)
          );
        }
      )
      .subscribe();

    // Subscribe to security alerts
    const alertsChannel = supabase
      .channel('security_alerts_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = payload.new as SecurityAlert;
          setAlerts(prev => [newAlert, ...prev]);

          // Show immediate toast for new alerts
          toast({
            title: `${newAlert.severity.toUpperCase()} Security Alert`,
            description: newAlert.title,
            variant: newAlert.severity === 'critical' ? 'destructive' : 'default',
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'security_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedAlert = payload.new as SecurityAlert;
          setAlerts(prev => 
            prev.map(a => a.id === updatedAlert.id ? updatedAlert : a)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(alertsChannel);
    };
  }, [user, toast]);

  return {
    notifications,
    alerts,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    acknowledgeAlert,
    createNotification,
    createSecurityAlert,
    refetch: () => {
      fetchNotifications();
      fetchAlerts();
    }
  };
};