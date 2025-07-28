import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, AlertTriangle, CheckCircle, Info, AlertCircle, Shield, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const MSPNotificationCenter = ({ mspId }: { mspId: string }) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Real-time subscriptions
    const channel = supabase
      .channel('msp-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          if (payload.new.msp_id === mspId) {
            setNotifications(prev => [payload.new, ...prev]);
            toast({
              title: payload.new.title,
              description: payload.new.message,
            });
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mspId, toast]);

  const loadData = async () => {
    try {
      const [notifRes, alertRes] = await Promise.all([
        (supabase as any).from('notifications').select('*').eq('msp_id', mspId).limit(50),
        (supabase as any).from('realtime_alerts').select('*').eq('msp_id', mspId).is('resolved_at', null)
      ]);
      
      setNotifications(notifRes.data || []);
      setAlerts(alertRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await (supabase as any).from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px]">
        <SheetHeader>
          <SheetTitle>MSP Notification Center</SheetTitle>
          <SheetDescription>Real-time notifications and alerts</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="notifications" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Notifications {unreadCount > 0 && <Badge variant="secondary" className="ml-2">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts {alerts.length > 0 && <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <ScrollArea className="h-[500px] mt-4">
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No notifications</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card key={notification.id} className={!notification.read_at ? 'bg-muted/50' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}
                            <span className="text-xs text-muted-foreground">{notification.category}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <CardTitle className="text-sm">{notification.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{notification.message}</p>
                        {!notification.read_at && (
                          <Button variant="ghost" size="sm" className="mt-2" onClick={() => markAsRead(notification.id)}>
                            <Check className="h-3 w-3 mr-1" />Mark as read
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts">
            <ScrollArea className="h-[500px] mt-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Card key={alert.id} className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive">{alert.severity}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <CardTitle className="text-sm">{alert.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{alert.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};