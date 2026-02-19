import { useState } from 'react';

export interface NotifType {
  id: string;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface NotifConfig {
  maxItems: number;
  enableRealtime: boolean;
  enableGrouping: boolean;
  enableSound: boolean;
  position: 'top-right' | 'sidebar';
  types: NotifType[];
}

const defaultTypes: NotifType[] = [
  { id: '1', name: 'info', icon: 'Info', color: '#3b82f6', enabled: true },
  { id: '2', name: 'success', icon: 'CheckCircle', color: '#22c55e', enabled: true },
  { id: '3', name: 'warning', icon: 'AlertTriangle', color: '#f59e0b', enabled: true },
  { id: '4', name: 'error', icon: 'XCircle', color: '#ef4444', enabled: true },
  { id: '5', name: 'mention', icon: 'AtSign', color: '#8b5cf6', enabled: true },
];

export function useNotificationCenterGenerator() {
  const [config, setConfig] = useState<NotifConfig>({
    maxItems: 50,
    enableRealtime: true,
    enableGrouping: true,
    enableSound: false,
    position: 'top-right',
    types: defaultTypes,
  });

  const updateConfig = (updates: Partial<NotifConfig>) => setConfig(prev => ({ ...prev, ...updates }));

  const toggleType = (id: string) => {
    setConfig(prev => ({
      ...prev,
      types: prev.types.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t),
    }));
  };

  const addType = (name: string) => {
    setConfig(prev => ({
      ...prev,
      types: [...prev.types, { id: crypto.randomUUID(), name, icon: 'Bell', color: '#6b7280', enabled: true }],
    }));
  };

  const removeType = (id: string) => {
    setConfig(prev => ({ ...prev, types: prev.types.filter(t => t.id !== id) }));
  };

  const generateCode = (): string => {
    const enabledTypes = config.types.filter(t => t.enabled);
    const typeUnion = enabledTypes.map(t => `'${t.name}'`).join(' | ');

    return `import { useState, useEffect } from 'react';
${config.enableRealtime ? "import { supabase } from '@/integrations/supabase/client';" : ''}

interface Notification {
  id: string;
  type: ${typeUnion};
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const dismiss = (id: string) =>
    setNotifications(prev => prev.filter(n => n.id !== id));

  const addNotification = (type: Notification['type'], title: string, message: string) =>
    setNotifications(prev => [{ id: crypto.randomUUID(), type, title, message, read: false, createdAt: new Date() }, ...prev].slice(0, ${config.maxItems}));

${config.enableRealtime ? `  useEffect(() => {
    const channel = supabase.channel('notifications')
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        if (payload) addNotification(payload.type, payload.title, payload.message);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);` : ''}

  return { notifications, unreadCount, markAsRead, markAllRead, dismiss, addNotification };
}`;
  };

  return { config, updateConfig, toggleType, addType, removeType, generateCode };
}
