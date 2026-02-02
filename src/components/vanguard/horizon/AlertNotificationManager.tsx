import { useState } from 'react';
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
  CheckCircle, XCircle, Clock, Send, Settings, Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'teams';
  config: Record<string, string>;
  isActive: boolean;
  lastUsed?: string;
  successRate: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
  isActive: boolean;
  triggeredCount: number;
}

const mockChannels: NotificationChannel[] = [
  { id: '1', name: 'IT Team Email', type: 'email', config: { to: 'it-team@company.com' }, isActive: true, lastUsed: '2 min ago', successRate: 99.2 },
  { id: '2', name: 'On-Call SMS', type: 'sms', config: { phone: '+1-555-0123' }, isActive: true, lastUsed: '1 hour ago', successRate: 98.5 },
  { id: '3', name: 'Slack #alerts', type: 'slack', config: { webhook: 'https://hooks.slack.com/...' }, isActive: true, lastUsed: '5 min ago', successRate: 99.8 },
  { id: '4', name: 'MS Teams', type: 'teams', config: { webhook: 'https://outlook.webhook...' }, isActive: false, lastUsed: '3 days ago', successRate: 97.1 },
  { id: '5', name: 'PagerDuty', type: 'webhook', config: { url: 'https://events.pagerduty.com/...' }, isActive: true, lastUsed: '30 min ago', successRate: 99.9 },
];

const mockRules: AlertRule[] = [
  { id: '1', name: 'Critical CPU Alert', condition: 'CPU > 95% for 5 min', severity: 'critical', channels: ['1', '2', '5'], isActive: true, triggeredCount: 12 },
  { id: '2', name: 'Disk Space Warning', condition: 'Disk usage > 85%', severity: 'warning', channels: ['1', '3'], isActive: true, triggeredCount: 45 },
  { id: '3', name: 'Service Down', condition: 'Critical service stopped', severity: 'critical', channels: ['1', '2', '3', '5'], isActive: true, triggeredCount: 8 },
  { id: '4', name: 'Memory Pressure', condition: 'RAM > 90% for 10 min', severity: 'warning', channels: ['1'], isActive: true, triggeredCount: 23 },
  { id: '5', name: 'Agent Offline', condition: 'No heartbeat for 15 min', severity: 'critical', channels: ['1', '2'], isActive: true, triggeredCount: 5 },
];

export function AlertNotificationManager() {
  const { toast } = useToast();
  const [channels, setChannels] = useState(mockChannels);
  const [rules, setRules] = useState(mockRules);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', type: 'email' as const, config: {} });
  
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

  const toggleChannel = (id: string) => {
    setChannels(prev => prev.map(ch => 
      ch.id === id ? { ...ch, isActive: !ch.isActive } : ch
    ));
    toast({ title: 'Channel updated' });
  };

  const toggleRule = (id: string) => {
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
            <div className="text-2xl font-bold">{channels.filter(c => c.isActive).length}</div>
            <p className="text-sm text-muted-foreground">Active Channels</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</div>
            <p className="text-sm text-muted-foreground">Active Rules</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">99.1%</div>
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">93</div>
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
                    <Input placeholder="e.g., IT Team Email" />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select defaultValue="email">
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
                    <Input placeholder="email@company.com or https://..." />
                  </div>
                  <Button className="w-full" onClick={() => setShowAddChannel(false)}>
                    Add Channel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Configuration</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Success Rate</TableHead>
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
                    <TableCell>{channel.lastUsed}</TableCell>
                    <TableCell>
                      <span className={channel.successRate >= 99 ? 'text-green-400' : 'text-yellow-400'}>
                        {channel.successRate}%
                      </span>
                    </TableCell>
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

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Triggered</TableHead>
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
                      </div>
                    </TableCell>
                    <TableCell>{rule.triggeredCount}x</TableCell>
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
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {[
                    { time: '2 min ago', rule: 'Critical CPU Alert', channel: 'IT Team Email', status: 'delivered' },
                    { time: '5 min ago', rule: 'Critical CPU Alert', channel: 'Slack #alerts', status: 'delivered' },
                    { time: '12 min ago', rule: 'Disk Space Warning', channel: 'IT Team Email', status: 'delivered' },
                    { time: '30 min ago', rule: 'Service Down', channel: 'PagerDuty', status: 'delivered' },
                    { time: '1 hour ago', rule: 'Agent Offline', channel: 'On-Call SMS', status: 'delivered' },
                    { time: '2 hours ago', rule: 'Memory Pressure', channel: 'IT Team Email', status: 'failed' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-4">
                        {item.status === 'delivered' ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                        <div>
                          <p className="font-medium">{item.rule}</p>
                          <p className="text-sm text-muted-foreground">via {item.channel}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
