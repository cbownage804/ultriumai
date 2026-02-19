import { useState, useCallback } from 'react';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  sound?: string;
  data?: Record<string, string>;
  schedule?: { type: 'immediate' | 'scheduled' | 'recurring'; date?: string; interval?: string };
  segment?: string;
}

export interface NotificationSegment {
  id: string;
  name: string;
  rules: { field: string; operator: string; value: string }[];
}

export function usePushNotificationDesigner() {
  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [segments, setSegments] = useState<NotificationSegment[]>([
    { id: '1', name: 'All Users', rules: [] },
    { id: '2', name: 'Active Users', rules: [{ field: 'lastActive', operator: 'within', value: '7d' }] },
    { id: '3', name: 'New Users', rules: [{ field: 'createdAt', operator: 'within', value: '24h' }] },
  ]);

  const addNotification = useCallback((n: Omit<PushNotification, 'id'>) => {
    setNotifications(prev => [...prev, { ...n, id: crypto.randomUUID() }]);
  }, []);

  const updateNotification = useCallback((id: string, partial: Partial<PushNotification>) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, ...partial } : n));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addSegment = useCallback((name: string) => {
    setSegments(prev => [...prev, { id: crypto.randomUUID(), name, rules: [] }]);
  }, []);

  const generateCode = useCallback(() => {
    return `import { PushNotifications } from '@capacitor/push-notifications';

// Register for push notifications
export async function registerPush() {
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive === 'granted') {
    await PushNotifications.register();
  }

  PushNotifications.addListener('registration', (token) => {
    console.log('Push token:', token.value);
    // Send token to your server
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received:', notification);
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    console.log('Push action:', action);
  });
}

// Schedule local notification
export async function scheduleLocal(title: string, body: string, scheduleAt?: Date) {
  await PushNotifications.createChannel({
    id: 'default',
    name: 'Default',
    importance: 4,
    visibility: 1,
  });
}
`;
  }, []);

  return {
    notifications, segments,
    addNotification, updateNotification, removeNotification,
    addSegment, generateCode,
  };
}
