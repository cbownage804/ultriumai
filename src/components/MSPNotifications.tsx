import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Shield,
  Eye,
  EyeOff,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  notification_type: string;
  priority: string;
  title: string;
  message: string;
  action_url?: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  expires_at?: string;
}

interface MSPNotificationsProps {
  mspId: string;
}

export const MSPNotifications: React.FC<MSPNotificationsProps> = ({ mspId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showRead, setShowRead] = useState(false);
  const { toast } = useToast();

  const typeIcons = {
    churn_risk: AlertTriangle,
    upsell_opportunity: TrendingUp,
    payment_overdue: DollarSign,
    contract_renewal: Calendar,
    performance_alert: AlertTriangle,
    security_alert: Shield
  };

  const priorityColors = {
    low: 'bg-blue-500 text-white',
    medium: 'bg-yellow-500 text-white',
    high: 'bg-orange-500 text-white',
    critical: 'bg-destructive text-destructive-foreground'
  };

  useEffect(() => {
    loadNotifications();
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'msp_notifications',
        filter: `msp_id=eq.${mspId}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mspId]);

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('msp_notifications')
        .select('*')
        .eq('msp_id', mspId)
        .order('created_at', { ascending: false });

      if (!showRead) {
        query = query.eq('is_read', false);
      }

      if (filter !== 'all') {
        query = query.eq('notification_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('msp_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('msp_notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast({
        title: "Success",
        description: "Notification dismissed",
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss notification",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('msp_notifications')
        .update({ is_read: true })
        .eq('msp_id', mspId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Stay updated with important events and opportunities
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {unreadCount} unread
          </Badge>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center space-x-2">
          <Switch
            id="show-read"
            checked={showRead}
            onCheckedChange={setShowRead}
          />
          <Label htmlFor="show-read">Show read notifications</Label>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="all">All notifications</option>
          <option value="churn_risk">Churn Risk</option>
          <option value="upsell_opportunity">Upsell Opportunities</option>
          <option value="payment_overdue">Payment Issues</option>
          <option value="contract_renewal">Contract Renewals</option>
          <option value="performance_alert">Performance Alerts</option>
          <option value="security_alert">Security Alerts</option>
        </select>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => {
            const IconComponent = typeIcons[notification.notification_type as keyof typeof typeIcons] || Bell;
            return (
              <Card 
                key={notification.id} 
                className={`transition-all duration-200 ${
                  !notification.is_read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full ${
                        notification.priority === 'critical' ? 'bg-destructive/20' :
                        notification.priority === 'high' ? 'bg-orange-500/20' :
                        notification.priority === 'medium' ? 'bg-yellow-500/20' :
                        'bg-blue-500/20'
                      }`}>
                        <IconComponent className={`h-4 w-4 ${
                          notification.priority === 'critical' ? 'text-destructive' :
                          notification.priority === 'high' ? 'text-orange-500' :
                          notification.priority === 'medium' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </h3>
                          <Badge 
                            className={priorityColors[notification.priority as keyof typeof priorityColors]}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          
                          {notification.action_url && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(notification.action_url, '_blank')}
                            >
                              Take Action
                            </Button>
                          )}
                          
                          {!notification.is_read && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissNotification(notification.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};