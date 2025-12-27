import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CopilotAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function useCopilotAlerts(userId: string | null, enabled: boolean = true) {
  const [alerts, setAlerts] = useState<CopilotAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Check for new security events and generate alerts
  const checkForAlerts = useCallback(async () => {
    if (!userId || !enabled) return;

    try {
      // Check for critical security incidents
      const { data: incidents } = await supabase
        .from('security_incidents')
        .select('*')
        .eq('user_id', userId)
        .eq('severity', 'critical')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      // Check for active security alerts
      const { data: securityAlerts } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .in('severity', ['critical', 'high'])
        .order('created_at', { ascending: false })
        .limit(3);

      // Check for offline agents
      const { data: agents } = await supabase
        .from('vanguard_agents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'offline');

      const newAlerts: CopilotAlert[] = [];

      // Add incident alerts
      incidents?.forEach(incident => {
        if (!dismissedIds.has(`incident-${incident.id}`)) {
          newAlerts.push({
            id: `incident-${incident.id}`,
            type: 'critical',
            title: incident.title || 'Critical Security Incident',
            message: incident.description || 'A critical security incident requires your attention.',
            timestamp: new Date(incident.created_at),
            action: {
              label: 'View Details',
              onClick: () => {
                window.location.href = `/vanguard/incidents/${incident.id}`;
              },
            },
          });
        }
      });

      // Add security alert notifications
      securityAlerts?.forEach(alert => {
        if (!dismissedIds.has(`alert-${alert.id}`)) {
          newAlerts.push({
            id: `alert-${alert.id}`,
            type: alert.severity === 'critical' ? 'critical' : 'warning',
            title: alert.title || alert.alert_type || 'Security Alert',
            message: alert.description || 'A security alert needs review.',
            timestamp: new Date(alert.created_at),
          });
        }
      });

      // Add offline agent alerts
      agents?.forEach(agent => {
        if (!dismissedIds.has(`agent-${agent.id}`)) {
          const lastHeartbeat = agent.last_heartbeat ? new Date(agent.last_heartbeat) : null;
          const offlineDuration = lastHeartbeat 
            ? Math.round((Date.now() - lastHeartbeat.getTime()) / 60000)
            : 'Unknown';
          
          newAlerts.push({
            id: `agent-${agent.id}`,
            type: 'warning',
            title: `Agent Offline: ${agent.name}`,
            message: `Agent has been offline for ${offlineDuration} minutes.`,
            timestamp: lastHeartbeat || new Date(),
            action: {
              label: 'View Agent',
              onClick: () => {
                window.location.href = `/vanguard/agents/${agent.id}`;
              },
            },
          });
        }
      });

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error checking for alerts:', error);
    }
  }, [userId, enabled, dismissedIds]);

  // Dismiss a single alert
  const dismissAlert = useCallback((alertId: string) => {
    setDismissedIds(prev => new Set([...prev, alertId]));
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  // Dismiss all alerts
  const dismissAllAlerts = useCallback(() => {
    const allIds = alerts.map(a => a.id);
    setDismissedIds(prev => new Set([...prev, ...allIds]));
    setAlerts([]);
  }, [alerts]);

  // Check for alerts on mount and periodically
  useEffect(() => {
    if (!enabled) {
      setAlerts([]);
      return;
    }

    checkForAlerts();
    const interval = setInterval(checkForAlerts, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkForAlerts, enabled]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId || !enabled) return;

    const channel = supabase
      .channel('copilot-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_incidents',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          checkForAlerts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          checkForAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, enabled, checkForAlerts]);

  return {
    alerts,
    dismissAlert,
    dismissAllAlerts,
    refreshAlerts: checkForAlerts,
  };
}
