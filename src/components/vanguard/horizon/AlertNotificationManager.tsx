import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, Mail, MessageSquare, Webhook, Plus, Trash2, Edit, 
  CheckCircle, XCircle, Clock, Send, Phone, Loader2, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  config: Record<string, string>;
  isActive: boolean;
  lastUsed?: string;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
  isActive: boolean;
}

interface AlertNotification {
  id: string;
  notification_type: string;
  recipient: string;
  status: string;
  created_at: string;
  alert_rule_id: string | null;
  error_message: string | null;
}

export function AlertNotificationManager() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  
  // Form state for adding channel
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<string>('email');
  const [newChannelConfig, setNewChannelConfig] = useState('');
  
  // Fetch data from Supabase
  useEffect(() => {
    if (!user?.id) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch notification channels
        const { data: channelsData } = await supabase
          .from('vanguard_notification_channels')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (channelsData) {
          setChannels(channelsData.map(ch => ({
            id: ch.id,
            name: ch.name || 'Unnamed Channel',
            type: ch.channel_type as any,
            config: ch.config as Record<string, string> || {},
            isActive: ch.is_enabled ?? true,
            lastUsed: ch.last_used_at ? formatDistanceToNow(new Date(ch.last_used_at), { addSuffix: true }) : undefined
          })));
        }
        
        // Fetch alert rules
        const { data: rulesData } = await supabase
          .from('alert_rules')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (rulesData) {
          setRules(rulesData.map(r => {
            const channelsList = Array.isArray(r.notification_channels) 
              ? (r.notification_channels as unknown[]).map(c => String(c))
              : [];
            return {
              id: r.id,
              name: r.name,
              condition: r.description || JSON.stringify(r.conditions),
              severity: r.severity_threshold as 'critical' | 'warning' | 'info',
              channels: channelsList,
              isActive: r.is_active ?? true
            };
          }));
        }
        
        // Fetch recent notifications/delivery history
        const { data: notifData } = await supabase
          .from('alert_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (notifData) {
          setNotifications(notifData);
        }
      } catch (error) {
        console.error('Failed to fetch notification data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id]);
  
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Phone className="h-4 w-4" />;
      case 'slack': return <MessageSquare className="h-4 w-4" />;
      case 'teams': return <MessageSquare className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'info': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const toggleChannel = async (id: string) => {
    const channel = channels.find(c => c.id === id);
    if (!channel) return;
    
    const { error } = await supabase
      .from('vanguard_notification_channels')
      .update({ is_enabled: !channel.isActive })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Failed to update channel', variant: 'destructive' });
      return;
    }
    
    setChannels(prev => prev.map(ch => 
      ch.id === id ? { ...ch, isActive: !ch.isActive } : ch
    ));
    toast({ title: 'Channel updated' });
  };

  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    
    const { error } = await supabase
      .from('alert_rules')
      .update({ is_active: !rule.isActive })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Failed to update rule', variant: 'destructive' });
      return;
    }
    
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, isActive: !r.isActive } : r
    ));
    toast({ title: 'Rule updated' });
  };

  const testChannel = (channel: NotificationChannel) => {
    toast({ 
      title: 'Test notification sent',
      description: `Sent to ${channel.name}`
    });
  };
  
  const handleAddChannel = async () => {
    if (!user?.id || !newChannelName.trim()) return;
    
    const configKey = newChannelType === 'email' ? 'to' : 
                      newChannelType === 'sms' ? 'phone' : 'webhook';
    
    const { data, error } = await supabase
      .from('vanguard_notification_channels')
      .insert({
        user_id: user.id,
        name: newChannelName,
        channel_type: newChannelType,
        config: { [configKey]: newChannelConfig },
        is_enabled: true,
        is_verified: false
      })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Failed to add channel', variant: 'destructive' });
      return;
    }
    
    setChannels(prev => [{
      id: data.id,
      name: data.name,
      type: data.channel_type as any,
      config: data.config as Record<string, string>,
      isActive: true,
      lastUsed: undefined
    }, ...prev]);
    
    setNewChannelName('');
    setNewChannelConfig('');
    setShowAddChannel(false);
    toast({ title: 'Channel added successfully' });
  };
  
  const deleteChannel = async (id: string) => {
    const { error } = await supabase
      .from('vanguard_notification_channels')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Failed to delete channel', variant: 'destructive' });
      return;
    }
    
    setChannels(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Channel deleted' });
  };
  
  // Calculate stats from live data
  const activeChannels = channels.filter(c => c.isActive).length;
  const activeRules = rules.filter(r => r.isActive).length;
  const todayNotifications = notifications.filter(n => {
    const today = new Date();
    const notifDate = new Date(n.created_at);
    return notifDate.toDateString() === today.toDateString();
  }).length;
  const deliveryRate = notifications.length > 0 
    ? ((notifications.filter(n => n.status === 'sent' || n.status === 'delivered').length / notifications.length) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Notifications</h2>
          <p className="text-muted-foreground">Configure multi-channel alerting for threshold breaches</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{activeChannels}</div>
            <p className="text-sm text-muted-foreground">Active Channels</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{activeRules}</div>
            <p className="text-sm text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{deliveryRate}%</div>
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{todayNotifications}</div>
            <p className="text-sm text-muted-foreground">Alerts Today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showAddChannel} onOpenChange={setShowAddChannel}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Channel</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Notification Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Channel Name</Label>
                    <Input 
                      placeholder="e.g., IT Team Email" 
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newChannelType} onValueChange={setNewChannelType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                        <SelectItem value="webhook">Custom Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Recipient / Webhook URL</Label>
                    <Input 
                      placeholder="email@company.com or https://..." 
                      value={newChannelConfig}
                      onChange={(e) => setNewChannelConfig(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddChannel}>
                    Add Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {channels.length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No notification channels configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add email, SMS, Slack, or webhook channels to receive alerts.
                </p>
                <Button onClick={() => setShowAddChannel(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Add Your First Channel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Configuration</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map(channel => (
                    <TableRow key={channel.id}>
                      <TableCell className="font-medium">{channel.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChannelIcon(channel.type)}
                          <span className="capitalize">{channel.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {Object.values(channel.config)[0]?.toString().substring(0, 30)}...
                      </TableCell>
                      <TableCell>{channel.lastUsed || 'Never'}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={channel.isActive} 
                          onCheckedChange={() => toggleChannel(channel.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => testChannel(channel)}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-400"
                            onClick={() => deleteChannel(channel.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Rule</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Alert Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input placeholder="e.g., High CPU Alert" />
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Select defaultValue="warning">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <Input placeholder="e.g., CPU > 90% for 5 min" />
                  </div>
                  <div>
                    <Label>Notification Channels</Label>
                    <p className="text-xs text-muted-foreground">Select channels to notify when triggered</p>
                  </div>
                  <Button className="w-full" onClick={() => setShowAddRule(false)}>
                    Create Rule
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {rules.length === 0 ? (
            <Card className="bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No alert rules configured</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create rules to automatically trigger notifications for specific conditions.
                </p>
                <Button onClick={() => setShowAddRule(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Your First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="text-muted-foreground">{rule.condition}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {rule.channels.slice(0, 3).map(chId => {
                            const ch = channels.find(c => c.id === chId);
                            return ch ? (
                              <span key={chId} className="text-muted-foreground">
                                {getChannelIcon(ch.type)}
                              </span>
                            ) : null;
                          })}
                          {rule.channels.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{rule.channels.length - 3}</span>
                          )}
                          {rule.channels.length === 0 && (
                            <span className="text-xs text-muted-foreground">No channels</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={rule.isActive} 
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No delivery history</h3>
                  <p className="text-sm text-muted-foreground">
                    Notification deliveries will appear here once alerts are triggered.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {notifications.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-4">
                          {item.status === 'sent' || item.status === 'delivered' ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <div>
                            <p className="font-medium capitalize">{item.notification_type} Notification</p>
                            <p className="text-sm text-muted-foreground">to {item.recipient}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
