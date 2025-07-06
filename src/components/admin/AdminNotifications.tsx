import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, Users, Building2, Bot, CreditCard, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AdminNotification {
  id: string;
  type: 'user_signup' | 'msp_signup' | 'subscription_change' | 'gpt_created' | 'security_alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export const AdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up real-time listeners for various admin events
    const channels = [
      // User signups
      supabase
        .channel('admin-user-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        }, (payload) => {
          addNotification({
            type: 'user_signup',
            title: 'New User Signup',
            message: `${payload.new.email} has signed up`,
            data: payload.new
          });
        }),

      // MSP signups
      supabase
        .channel('admin-msp-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'msps'
        }, (payload) => {
          addNotification({
            type: 'msp_signup',
            title: 'New MSP Registration',
            message: `${payload.new.company_name} has registered as an MSP`,
            data: payload.new
          });
        }),

      // Subscription changes
      supabase
        .channel('admin-subscription-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'subscribers'
        }, (payload) => {
          const eventType = payload.eventType;
          const isNewSub = eventType === 'INSERT' && payload.new.subscribed;
          const isCanceled = eventType === 'UPDATE' && !payload.new.subscribed && payload.old?.subscribed;
          
          if (isNewSub) {
            addNotification({
              type: 'subscription_change',
              title: 'New Subscription',
              message: `User subscribed to ${payload.new.subscription_tier} plan`,
              data: payload.new
            });
          } else if (isCanceled) {
            addNotification({
              type: 'subscription_change',
              title: 'Subscription Canceled',
              message: `User canceled ${payload.old.subscription_tier} plan`,
              data: payload.new
            });
          }
        }),

      // GPT creations
      supabase
        .channel('admin-gpt-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'custom_gpts'
        }, (payload) => {
          addNotification({
            type: 'gpt_created',
            title: 'New Custom GPT',
            message: `"${payload.new.name}" GPT has been created`,
            data: payload.new
          });
        }),

      // Security events
      supabase
        .channel('admin-security-events')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'security_events'
        }, (payload) => {
          if (payload.new.severity === 'high' || payload.new.severity === 'critical') {
            addNotification({
              type: 'security_alert',
              title: `${payload.new.severity} Security Alert`,
              message: payload.new.title,
              data: payload.new
            });
          }
        })
    ];

    // Subscribe to all channels
    channels.forEach(channel => channel.subscribe());

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const addNotification = (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AdminNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50
    setUnreadCount(prev => prev + 1);

    // Show toast for critical alerts
    if (notification.type === 'security_alert') {
      toast({
        title: notification.title,
        description: notification.message,
        variant: "destructive",
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'user_signup': return Users;
      case 'msp_signup': return Building2;
      case 'gpt_created': return Bot;
      case 'subscription_change': return CreditCard;
      case 'security_alert': return AlertCircle;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: AdminNotification['type']) => {
    switch (type) {
      case 'security_alert': return 'destructive';
      case 'subscription_change': return 'default';
      case 'user_signup': return 'secondary';
      case 'msp_signup': return 'outline';
      case 'gpt_created': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 w-96 max-h-96 z-50 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Admin Notifications</CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              Real-time platform activity updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-border/50 cursor-pointer hover:bg-muted/50 ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {notification.title}
                              </p>
                              <Badge
                                variant={getNotificationColor(notification.type)}
                                className="text-xs"
                              >
                                {notification.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};