import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, Smartphone, Clock, AlertTriangle, CheckCircle2, X, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PushToken {
  id: string;
  device_token: string;
  platform: string;
  device_name: string;
  is_active: boolean;
  last_used_at: string;
  created_at: string;
}

interface NotificationPrefs {
  sla_breach_enabled: boolean;
  escalation_enabled: boolean;
  assignment_enabled: boolean;
  ticket_update_enabled: boolean;
  security_alert_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_days: string[];
}

interface NotificationLog {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  status: string;
  sent_at: string;
  read_at: string | null;
  created_at: string;
}

export function PushNotificationManager() {
  const { toast } = useToast();
  const [tokens, setTokens] = useState<PushToken[]>([]);
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    sla_breach_enabled: true,
    escalation_enabled: true,
    assignment_enabled: true,
    ticket_update_enabled: true,
    security_alert_enabled: true,
    quiet_hours_start: null,
    quiet_hours_end: null,
    quiet_days: []
  });
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    checkPushSupport();
    loadData();
  }, []);

  const checkPushSupport = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setPushSupported(supported);
    if (supported) {
      setPushPermission(Notification.permission);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load tokens
      const { data: tokenData } = await (supabase as any)
        .from('vanguard_push_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (tokenData) setTokens(tokenData);

      // Load preferences
      const { data: prefData } = await (supabase as any)
        .from('vanguard_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefData) setPreferences(prefData);

      // Load notification history
      const { data: notifData } = await (supabase as any)
        .from('vanguard_notification_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifData) setNotifications(notifData);

    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        await registerPushToken();
        toast({
          title: "Notifications Enabled",
          description: "You will now receive push notifications."
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "You can enable notifications in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const registerPushToken = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Generate a unique token for web push (in real implementation, use service worker)
    const token = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await (supabase as any)
      .from('vanguard_push_tokens')
      .upsert({
        user_id: user.id,
        device_token: token,
        platform: 'web',
        device_name: navigator.userAgent.split('(')[1]?.split(')')[0] || 'Web Browser',
        is_active: true,
        last_used_at: new Date().toISOString()
      });

    loadData();
  };

  const updatePreferences = async (updates: Partial<NotificationPrefs>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    await (supabase as any)
      .from('vanguard_notification_preferences')
      .upsert({
        user_id: user.id,
        ...newPrefs,
        updated_at: new Date().toISOString()
      });

    toast({ title: "Preferences Updated" });
  };

  const toggleQuietDay = (day: string) => {
    const newDays = preferences.quiet_days.includes(day)
      ? preferences.quiet_days.filter(d => d !== day)
      : [...preferences.quiet_days, day];
    updatePreferences({ quiet_days: newDays });
  };

  const removeToken = async (tokenId: string) => {
    await (supabase as any)
      .from('vanguard_push_tokens')
      .delete()
      .eq('id', tokenId);

    setTokens(prev => prev.filter(t => t.id !== tokenId));
    toast({ title: "Device Removed" });
  };

  const markAsRead = async (notifId: string) => {
    await (supabase as any)
      .from('vanguard_notification_log')
      .update({ read_at: new Date().toISOString(), status: 'read' })
      .eq('id', notifId);

    setNotifications(prev => 
      prev.map(n => n.id === notifId ? { ...n, read_at: new Date().toISOString(), status: 'read' } : n)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'sla_breach': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'escalation': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'assignment': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'ticket_update': return <RefreshCw className="h-4 w-4 text-green-500" />;
      case 'security_alert': return <AlertTriangle className="h-4 w-4 text-purple-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge className="bg-green-500">Sent</Badge>;
      case 'read': return <Badge className="bg-blue-500">Read</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Push Permission Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Configure real-time alerts for SLA breaches, escalations, and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!pushSupported ? (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <BellOff className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Push Notifications Not Supported</p>
                <p className="text-sm text-muted-foreground">
                  Your browser doesn't support push notifications. Try using Chrome, Firefox, or Edge.
                </p>
              </div>
            </div>
          ) : pushPermission === 'granted' ? (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">Notifications Enabled</p>
                <p className="text-sm text-muted-foreground">
                  You're receiving push notifications on this device.
                </p>
              </div>
              <Badge variant="outline">{tokens.length} devices</Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Enable Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get real-time alerts for important events.
                </p>
              </div>
              <Button onClick={requestPushPermission}>
                <Bell className="h-4 w-4 mr-2" />
                Enable
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="preferences">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Notification Preferences */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Notification Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <Label>SLA Breach Alerts</Label>
                      <p className="text-sm text-muted-foreground">When tickets approach or breach SLA</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.sla_breach_enabled}
                    onCheckedChange={(checked) => updatePreferences({ sla_breach_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <Label>Escalation Alerts</Label>
                      <p className="text-sm text-muted-foreground">When tickets are escalated</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.escalation_enabled}
                    onCheckedChange={(checked) => updatePreferences({ escalation_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label>Assignment Notifications</Label>
                      <p className="text-sm text-muted-foreground">When tickets are assigned to you</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.assignment_enabled}
                    onCheckedChange={(checked) => updatePreferences({ assignment_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-green-500" />
                    <div>
                      <Label>Ticket Updates</Label>
                      <p className="text-sm text-muted-foreground">Status changes and comments</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.ticket_update_enabled}
                    onCheckedChange={(checked) => updatePreferences({ ticket_update_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Critical security events</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.security_alert_enabled}
                    onCheckedChange={(checked) => updatePreferences({ security_alert_enabled: checked })}
                  />
                </div>
              </div>

              {/* Quiet Hours */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Quiet Hours
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="mb-2 block">Start Time</Label>
                    <Input
                      type="time"
                      value={preferences.quiet_hours_start || ''}
                      onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value || null })}
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">End Time</Label>
                    <Input
                      type="time"
                      value={preferences.quiet_hours_end || ''}
                      onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value || null })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Quiet Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <Button
                        key={day}
                        variant={preferences.quiet_days.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleQuietDay(day)}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registered Devices */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Registered Devices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tokens.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No devices registered. Enable notifications to add this device.
                </p>
              ) : (
                <div className="space-y-3">
                  {tokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{token.device_name || 'Unknown Device'}</p>
                          <p className="text-sm text-muted-foreground">
                            {token.platform} • Last used: {token.last_used_at ? new Date(token.last_used_at).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={token.is_active ? "default" : "secondary"}>
                          {token.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => removeToken(token.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No notifications yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-3 rounded-lg border ${notif.read_at ? 'bg-muted/30' : 'bg-muted/50 border-primary/20'}`}
                        onClick={() => !notif.read_at && markAsRead(notif.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notif.notification_type)}
                            <span className="font-medium">{notif.title}</span>
                          </div>
                          {getStatusBadge(notif.status)}
                        </div>
                        {notif.body && (
                          <p className="text-sm text-muted-foreground">{notif.body}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
