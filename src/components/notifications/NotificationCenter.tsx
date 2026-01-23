import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Check,
  Shield,
  Ticket,
  Settings,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter = () => {
  const { 
    notifications, 
    alerts, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    acknowledgeAlert,
    loading
  } = useNotifications();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-3 w-3" />;
      case 'ticket': return <Ticket className="h-3 w-3" />;
      case 'system': return <Settings className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAcknowledgeAlert = async () => {
    if (selectedAlert) {
      await acknowledgeAlert(selectedAlert.id, resolutionNotes);
      setSelectedAlert(null);
      setResolutionNotes('');
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[600px]">
        <SheetHeader>
          <SheetTitle>Notification Center</SheetTitle>
          <SheetDescription>
            Stay updated with real-time notifications and alerts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications" className="relative">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="relative">
                Active Alerts
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {alerts.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Recent Notifications</h3>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="h-3 w-3 mr-2" />
                    Mark all read
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Card 
                        key={notification.id}
        className={`cursor-pointer transition-colors ${
          !notification.read_at ? 'bg-muted/50' : ''
        }`}
        onClick={() => !notification.read_at && markAsRead(notification.id)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(notification.category || 'general')}
                                <span className="text-xs text-muted-foreground capitalize">
                                  {notification.category || 'general'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!notification.read_at && (
                                <div className="h-2 w-2 bg-primary rounded-full" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <CardTitle className="text-sm">{notification.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm">
                            {notification.message}
                          </CardDescription>
                          {notification.action_url && (
                            <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="alerts" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-medium">Active Security Alerts</h3>
                {alerts.length > 0 && (
                  <Badge variant="outline">
                    {alerts.length} active
                  </Badge>
                )}
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No active alerts</p>
                      <p className="text-xs">All systems are running normally</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <Card key={alert.id} className="border-l-4 border-l-red-500">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <Badge className={getSeverityColor(alert.severity)}>
                                {alert.severity.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <CardTitle className="text-sm">{alert.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-sm mb-3">
                            {alert.description}
                          </CardDescription>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              Type: {alert.alert_type}
                            </span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedAlert(alert)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Acknowledge
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Acknowledge Alert</DialogTitle>
                                  <DialogDescription>
                                    Add resolution notes and acknowledge this alert
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-medium">{alert.title}</h4>
                                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Resolution Notes</label>
                                    <Textarea
                                      placeholder="Describe how this alert was resolved..."
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      className="mt-2"
                                    />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                                      Cancel
                                    </Button>
                                    <Button onClick={handleAcknowledgeAlert}>
                                      Acknowledge Alert
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};