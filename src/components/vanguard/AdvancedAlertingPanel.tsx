import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, Mail, MessageSquare, Phone, Webhook, AlertTriangle, Clock,
  Plus, Trash2, TestTube, CheckCircle, XCircle, Send, Users,
  Zap, Settings, History, ArrowUpCircle, Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface NotificationChannel {
  id: string;
  channel_type: string;
  name: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  is_verified: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  conditions: Record<string, unknown>[];
  severity_filter: string[];
  channel_ids: string[];
  is_enabled: boolean;
  cooldown_minutes: number;
  correlation_window_minutes: number;
}

interface AlertHistory {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  sent_at: string;
  acknowledged_at: string | null;
  channel_id: string;
}

interface OnCallSchedule {
  id: string;
  name: string;
  timezone: string;
  rotations: Array<{
    user_id: string;
    start_day: number;
    start_hour: number;
    end_day: number;
    end_hour: number;
  }>;
  is_active: boolean;
}

const CHANNEL_TYPES = [
  { id: 'email', name: 'Email', icon: Mail, description: 'Send alerts via email' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Post to Slack channel' },
  { id: 'teams', name: 'Microsoft Teams', icon: MessageSquare, description: 'Post to Teams channel' },
  { id: 'sms', name: 'SMS', icon: Phone, description: 'Send SMS via Twilio' },
  { id: 'pagerduty', name: 'PagerDuty', icon: AlertTriangle, description: 'Trigger PagerDuty incidents' },
  { id: 'opsgenie', name: 'OpsGenie', icon: Bell, description: 'Create OpsGenie alerts' },
  { id: 'webhook', name: 'Webhook', icon: Webhook, description: 'Send to custom webhook' },
];

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low', 'info'];

export const AdvancedAlertingPanel = () => {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [schedules, setSchedules] = useState<OnCallSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newChannelType, setNewChannelType] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelConfig, setNewChannelConfig] = useState<Record<string, string>>({});
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    severity_filter: ['critical', 'high'],
    channel_ids: [] as string[],
    cooldown_minutes: 5
  });
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const [channelsRes, rulesRes, historyRes, schedulesRes] = await Promise.all([
        supabase.from('vanguard_notification_channels').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vanguard_alert_rules').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vanguard_alert_history').select('*').eq('user_id', user.id).order('sent_at', { ascending: false }).limit(50),
        supabase.from('vanguard_on_call_schedules').select('*').eq('user_id', user.id)
      ]);

      if (channelsRes.data) setChannels(channelsRes.data as unknown as NotificationChannel[]);
      if (rulesRes.data) setRules(rulesRes.data as unknown as AlertRule[]);
      if (historyRes.data) setHistory(historyRes.data as unknown as AlertHistory[]);
      if (schedulesRes.data) setSchedules(schedulesRes.data as unknown as OnCallSchedule[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addChannel = async () => {
    if (!user || !newChannelType || !newChannelName) return;

    try {
      const { error } = await supabase.from('vanguard_notification_channels').insert({
        user_id: user.id,
        channel_type: newChannelType,
        name: newChannelName,
        config: newChannelConfig,
        is_enabled: true
      });

      if (error) throw error;

      toast({ title: 'Channel Added', description: `${newChannelName} configured successfully` });
      setShowAddChannel(false);
      setNewChannelType('');
      setNewChannelName('');
      setNewChannelConfig({});
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add channel', variant: 'destructive' });
    }
  };

  const deleteChannel = async (id: string) => {
    try {
      await supabase.from('vanguard_notification_channels').delete().eq('id', id);
      toast({ title: 'Channel Removed' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete channel', variant: 'destructive' });
    }
  };

  const toggleChannel = async (id: string, enabled: boolean) => {
    try {
      await supabase.from('vanguard_notification_channels').update({ is_enabled: enabled }).eq('id', id);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update channel', variant: 'destructive' });
    }
  };

  const testChannel = async (channel: NotificationChannel) => {
    if (!user) return;
    setTestingChannel(channel.id);

    try {
      const { data, error } = await supabase.functions.invoke('vanguard-notification-engine', {
        body: { action: 'test_channel', channel_id: channel.id, user_id: user.id }
      });

      if (error) throw error;

      toast({
        title: data.success ? 'Test Successful' : 'Test Failed',
        description: data.success ? `${channel.name} is working correctly` : 'Could not send test notification',
        variant: data.success ? 'default' : 'destructive'
      });
      fetchData();
    } catch (error) {
      toast({ title: 'Test Failed', description: 'Error testing channel', variant: 'destructive' });
    } finally {
      setTestingChannel(null);
    }
  };

  const addRule = async () => {
    if (!user || !newRule.name) return;

    try {
      const { error } = await supabase.from('vanguard_alert_rules').insert({
        user_id: user.id,
        name: newRule.name,
        description: newRule.description || null,
        conditions: [],
        severity_filter: newRule.severity_filter,
        channel_ids: newRule.channel_ids,
        cooldown_minutes: newRule.cooldown_minutes,
        is_enabled: true
      });

      if (error) throw error;

      toast({ title: 'Rule Created', description: `${newRule.name} is now active` });
      setShowAddRule(false);
      setNewRule({ name: '', description: '', severity_filter: ['critical', 'high'], channel_ids: [], cooldown_minutes: 5 });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create rule', variant: 'destructive' });
    }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      await supabase.from('vanguard_alert_rules').update({ is_enabled: enabled }).eq('id', id);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update rule', variant: 'destructive' });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (!user) return;
    try {
      await supabase.from('vanguard_alert_history').update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user.id,
        status: 'acknowledged'
      }).eq('id', alertId);
      fetchData();
      toast({ title: 'Alert Acknowledged' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  const getChannelIcon = (type: string) => {
    const channel = CHANNEL_TYPES.find(c => c.id === type);
    return channel?.icon || Bell;
  };

  const renderChannelConfigFields = () => {
    switch (newChannelType) {
      case 'email':
        return (
          <div className="space-y-2">
            <Label>Email Addresses (comma-separated)</Label>
            <Input
              placeholder="alert@company.com, security@company.com"
              value={newChannelConfig.emails || ''}
              onChange={e => setNewChannelConfig({ ...newChannelConfig, emails: e.target.value })}
            />
          </div>
        );
      case 'slack':
        return (
          <div className="space-y-2">
            <Label>Slack Webhook URL</Label>
            <Input
              placeholder="https://hooks.slack.com/services/..."
              value={newChannelConfig.slack_webhook_url || ''}
              onChange={e => setNewChannelConfig({ ...newChannelConfig, slack_webhook_url: e.target.value })}
            />
          </div>
        );
      case 'teams':
        return (
          <div className="space-y-2">
            <Label>Teams Webhook URL</Label>
            <Input
              placeholder="https://outlook.office.com/webhook/..."
              value={newChannelConfig.teams_webhook_url || ''}
              onChange={e => setNewChannelConfig({ ...newChannelConfig, teams_webhook_url: e.target.value })}
            />
          </div>
        );
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Phone Numbers (comma-separated)</Label>
              <Input
                placeholder="+1234567890, +0987654321"
                value={newChannelConfig.phone_numbers || ''}
                onChange={e => setNewChannelConfig({ ...newChannelConfig, phone_numbers: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Twilio Account SID</Label>
                <Input
                  value={newChannelConfig.twilio_sid || ''}
                  onChange={e => setNewChannelConfig({ ...newChannelConfig, twilio_sid: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Twilio Auth Token</Label>
                <Input
                  type="password"
                  value={newChannelConfig.twilio_token || ''}
                  onChange={e => setNewChannelConfig({ ...newChannelConfig, twilio_token: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>From Phone Number</Label>
              <Input
                placeholder="+1234567890"
                value={newChannelConfig.twilio_from || ''}
                onChange={e => setNewChannelConfig({ ...newChannelConfig, twilio_from: e.target.value })}
              />
            </div>
          </div>
        );
      case 'pagerduty':
        return (
          <div className="space-y-2">
            <Label>PagerDuty Routing Key</Label>
            <Input
              placeholder="Your integration/routing key"
              value={newChannelConfig.pagerduty_routing_key || ''}
              onChange={e => setNewChannelConfig({ ...newChannelConfig, pagerduty_routing_key: e.target.value })}
            />
          </div>
        );
      case 'opsgenie':
        return (
          <div className="space-y-2">
            <Label>OpsGenie API Key</Label>
            <Input
              type="password"
              placeholder="Your OpsGenie API key"
              value={newChannelConfig.opsgenie_api_key || ''}
              onChange={e => setNewChannelConfig({ ...newChannelConfig, opsgenie_api_key: e.target.value })}
            />
          </div>
        );
      case 'webhook':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://your-endpoint.com/webhook"
                value={newChannelConfig.webhook_url || ''}
                onChange={e => setNewChannelConfig({ ...newChannelConfig, webhook_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Custom Headers (JSON)</Label>
              <Textarea
                placeholder='{"Authorization": "Bearer xxx"}'
                value={newChannelConfig.webhook_headers || ''}
                onChange={e => setNewChannelConfig({ ...newChannelConfig, webhook_headers: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Advanced Alerting</h2>
            <p className="text-muted-foreground">Multi-channel notifications with escalations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {channels.filter(c => c.is_enabled).length} Active Channels
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            {rules.filter(r => r.is_enabled).length} Active Rules
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="oncall" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            On-Call
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Configure where alerts are sent</p>
            <Dialog open={showAddChannel} onOpenChange={setShowAddChannel}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Channel</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Notification Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Channel Type</Label>
                    <Select value={newChannelType} onValueChange={setNewChannelType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNEL_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel Name</Label>
                    <Input
                      placeholder="e.g., Security Team Slack"
                      value={newChannelName}
                      onChange={e => setNewChannelName(e.target.value)}
                    />
                  </div>
                  {renderChannelConfigFields()}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddChannel(false)}>Cancel</Button>
                  <Button onClick={addChannel} disabled={!newChannelType || !newChannelName}>Add Channel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {channels.map(channel => {
              const Icon = getChannelIcon(channel.channel_type);
              return (
                <Card key={channel.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${channel.is_enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`h-5 w-5 ${channel.is_enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{channel.name}</span>
                          <Badge variant="outline">{channel.channel_type}</Badge>
                          {channel.is_verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {channel.last_used_at 
                            ? `Last used ${new Date(channel.last_used_at).toLocaleDateString()}`
                            : 'Never used'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={channel.is_enabled}
                        onCheckedChange={checked => toggleChannel(channel.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testChannel(channel)}
                        disabled={testingChannel === channel.id}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteChannel(channel.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {channels.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notification channels configured</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddChannel(true)}>
                    <Plus className="h-4 w-4 mr-2" />Add Your First Channel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Define when alerts are triggered</p>
            <Dialog open={showAddRule} onOpenChange={setShowAddRule}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Create Rule</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Alert Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="e.g., Critical Security Alerts"
                      value={newRule.name}
                      onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What does this rule do?"
                      value={newRule.description}
                      onChange={e => setNewRule({ ...newRule, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Severity</Label>
                    <div className="flex flex-wrap gap-2">
                      {SEVERITY_OPTIONS.map(sev => (
                        <Badge
                          key={sev}
                          variant={newRule.severity_filter.includes(sev) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const updated = newRule.severity_filter.includes(sev)
                              ? newRule.severity_filter.filter(s => s !== sev)
                              : [...newRule.severity_filter, sev];
                            setNewRule({ ...newRule, severity_filter: updated });
                          }}
                        >
                          {sev}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Send to Channels</Label>
                    <div className="flex flex-wrap gap-2">
                      {channels.map(ch => (
                        <Badge
                          key={ch.id}
                          variant={newRule.channel_ids.includes(ch.id) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            const updated = newRule.channel_ids.includes(ch.id)
                              ? newRule.channel_ids.filter(id => id !== ch.id)
                              : [...newRule.channel_ids, ch.id];
                            setNewRule({ ...newRule, channel_ids: updated });
                          }}
                        >
                          {ch.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cooldown (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newRule.cooldown_minutes}
                      onChange={e => setNewRule({ ...newRule, cooldown_minutes: parseInt(e.target.value) || 5 })}
                    />
                    <p className="text-xs text-muted-foreground">Minimum time between duplicate alerts</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddRule(false)}>Cancel</Button>
                  <Button onClick={addRule} disabled={!newRule.name}>Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.is_enabled}
                        onCheckedChange={checked => toggleRule(rule.id, checked)}
                      />
                      <div>
                        <span className="font-medium">{rule.name}</span>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {rule.cooldown_minutes}m cooldown
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-10">
                    {rule.severity_filter.map(sev => (
                      <Badge key={sev} className={getSeverityColor(sev)}>
                        {sev}
                      </Badge>
                    ))}
                    <span className="text-muted-foreground mx-2">→</span>
                    {rule.channel_ids.map(chId => {
                      const channel = channels.find(c => c.id === chId);
                      return channel ? (
                        <Badge key={chId} variant="outline">{channel.name}</Badge>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {history.map(alert => (
                <Card key={alert.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{alert.title}</span>
                          <Badge variant="outline">{alert.alert_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(alert.sent_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status === 'acknowledged' ? (
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Acknowledged
                        </Badge>
                      ) : alert.status === 'failed' ? (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => acknowledgeAlert(alert.id)}>
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {history.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No alert history yet
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="oncall" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                On-Call Schedules
              </CardTitle>
              <CardDescription>Configure on-call rotations for escalations</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No on-call schedules configured</p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />Create Schedule
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map(schedule => (
                    <div key={schedule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <span className="font-medium">{schedule.name}</span>
                        <p className="text-sm text-muted-foreground">{schedule.timezone}</p>
                      </div>
                      <Switch checked={schedule.is_active} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5" />
                Escalation Policies
              </CardTitle>
              <CardDescription>Auto-escalate unacknowledged alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge>Level 1</Badge>
                  <span className="text-muted-foreground">After 15 minutes</span>
                  <span>→ Notify on-call</span>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge variant="outline">Level 2</Badge>
                  <span className="text-muted-foreground">After 30 minutes</span>
                  <span>→ Notify team lead + PagerDuty</span>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Badge variant="destructive">Level 3</Badge>
                  <span className="text-muted-foreground">After 1 hour</span>
                  <span>→ Notify all channels + SMS</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
