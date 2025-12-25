import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface RealtimeAlert {
  id: string;
  title: string;
  severity: string;
  source: string;
  timestamp: string;
  isNew: boolean;
}

export const useRealtimeAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const playAlertSound = useCallback((severity: string) => {
    // Optional: play sound for critical alerts
    if (severity === 'critical' || severity === 'high') {
      try {
        const audio = new Audio('/alert-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        // Sound not available
      }
    }
  }, []);

  const showNotification = useCallback((alert: RealtimeAlert) => {
    const variantMap: Record<string, 'default' | 'destructive'> = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'default',
      info: 'default',
    };

    toast({
      title: `🚨 ${alert.severity.toUpperCase()} Alert`,
      description: alert.title,
      variant: variantMap[alert.severity] || 'default',
    });

    playAlertSound(alert.severity);
  }, [playAlertSound]);

  useEffect(() => {
    if (!user) return;

    console.log('[RealtimeAlerts] Setting up subscription...');

    // Subscribe to security_events inserts
    const securityChannel = supabase
      .channel('security-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[RealtimeAlerts] New security event:', payload);
          const event = payload.new as any;
          
          const newAlert: RealtimeAlert = {
            id: event.id,
            title: event.title || event.description,
            severity: event.severity || 'info',
            source: 'security_events',
            timestamp: event.created_at,
            isNew: true,
          };

          setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
          setUnreadCount(prev => prev + 1);
          showNotification(newAlert);
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeAlerts] Security channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to security_incidents inserts
    const incidentChannel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_incidents',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[RealtimeAlerts] New incident:', payload);
          const incident = payload.new as any;
          
          const newAlert: RealtimeAlert = {
            id: incident.id,
            title: incident.title,
            severity: incident.severity || 'medium',
            source: 'incidents',
            timestamp: incident.created_at,
            isNew: true,
          };

          setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
          setUnreadCount(prev => prev + 1);
          showNotification(newAlert);
        }
      )
      .subscribe();

    // Subscribe to threat intelligence findings
    const threatChannel = supabase
      .channel('threat-intel-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'threat_intel_indicators',
        },
        (payload) => {
          const indicator = payload.new as any;
          if (indicator.risk_score >= 80) {
            const newAlert: RealtimeAlert = {
              id: indicator.id,
              title: `High-risk indicator detected: ${indicator.indicator}`,
              severity: 'high',
              source: 'threat_intel',
              timestamp: indicator.created_at,
              isNew: true,
            };

            setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
            setUnreadCount(prev => prev + 1);
            showNotification(newAlert);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[RealtimeAlerts] Cleaning up subscriptions');
      supabase.removeChannel(securityChannel);
      supabase.removeChannel(incidentChannel);
      supabase.removeChannel(threatChannel);
    };
  }, [user, showNotification]);

  const markAsRead = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(a => a.id === alertId ? { ...a, isNew: false } : a)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, isNew: false })));
    setUnreadCount(0);
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
    setUnreadCount(0);
  }, []);

  return {
    alerts,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearAlerts,
  };
};
