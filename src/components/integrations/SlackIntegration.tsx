import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Bell, Hash, Users, Settings, ExternalLink, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SlackConfig {
  enabled: boolean;
  botToken: string;
  signingSecret: string;
  workspaceName: string;
  status: 'connected' | 'disconnected' | 'error';
  channels: SlackChannel[];
  notifications: {
    newTickets: boolean;
    criticalAlerts: boolean;
    clientUpdates: boolean;
    systemAlerts: boolean;
  };
}

interface SlackChannel {
  id: string;
  name: string;
  purpose: string;
  memberCount: number;
  isPrivate: boolean;
}

interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  channel: string;
  enabled: boolean;
  message: string;
}

const SlackIntegration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<SlackConfig>({
    enabled: false,
    botToken: '',
    signingSecret: '',
    workspaceName: '',
    status: 'disconnected',
    channels: [],
    notifications: {
      newTickets: true,
      criticalAlerts: true,
      clientUpdates: false,
      systemAlerts: true
    }
  });

  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testMessage, setTestMessage] = useState('Hello from MSP Platform! 🚀');
  const [selectedChannel, setSelectedChannel] = useState('');

  useEffect(() => {
    loadSlackConfig();
    loadNotificationRules();
  }, []);

  const loadSlackConfig = async () => {
    try {
      // Mock data - in real implementation, load from integrations table
      const mockConfig: SlackConfig = {
        enabled: true,
        botToken: '••••••••••••••••',
        signingSecret: '••••••••••••••••',
        workspaceName: 'MSP Team Workspace',
        status: 'connected',
        channels: [
          { id: 'C1234567890', name: 'general', purpose: 'General discussions', memberCount: 25, isPrivate: false },
          { id: 'C2345678901', name: 'alerts', purpose: 'System alerts and notifications', memberCount: 8, isPrivate: false },
          { id: 'C3456789012', name: 'support', purpose: 'Customer support tickets', memberCount: 12, isPrivate: false },
          { id: 'C4567890123', name: 'dev-team', purpose: 'Development team', memberCount: 6, isPrivate: true }
        ],
        notifications: {
          newTickets: true,
          criticalAlerts: true,
          clientUpdates: false,
          systemAlerts: true
        }
      };
      setConfig(mockConfig);
      if (mockConfig.channels.length > 0) {
        setSelectedChannel(mockConfig.channels[0].id);
      }
    } catch (error) {
      console.error('Failed to load Slack config:', error);
    }
  };

  const loadNotificationRules = async () => {
    try {
      const mockRules: NotificationRule[] = [
        {
          id: '1',
          name: 'Critical Security Alerts',
          trigger: 'Security Alert (Critical)',
          channel: '#alerts',
          enabled: true,
          message: '🚨 Critical Security Alert: {alert_title}\nClient: {client_name}\nDetails: {alert_details}'
        },
        {
          id: '2',
          name: 'New Support Tickets',
          trigger: 'Support Ticket Created',
          channel: '#support',
          enabled: true,
          message: '🎫 New Support Ticket\nTicket: {ticket_number}\nClient: {client_name}\nPriority: {priority}'
        },
        {
          id: '3',
          name: 'System Downtime',
          trigger: 'System Down',
          channel: '#alerts',
          enabled: true,
          message: '⚠️ System Alert: {system_name} is down\nClient: {client_name}\nDuration: {downtime}'
        }
      ];
      setNotificationRules(mockRules);
    } catch (error) {
      console.error('Failed to load notification rules:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // In real implementation, validate Slack credentials
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({ ...prev, status: 'connected', enabled: true }));
      
      toast({
        title: "Slack Connected",
        description: "Successfully connected to Slack workspace",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Slack. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!selectedChannel || !testMessage) {
      toast({
        title: "Validation Error",
        description: "Please select a channel and enter a test message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending message to Slack
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Test Message Sent",
        description: `Message sent to ${config.channels.find(c => c.id === selectedChannel)?.name}`,
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send test message to Slack",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success text-white border-0';
      case 'error': return 'bg-destructive text-white border-0';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Slack Integration
                  <Badge variant="secondary" className={getStatusColor(config.status)}>
                    {config.status}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {config.workspaceName || 'No workspace connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {config.status === 'connected' ? (
                <Button variant="outline" asChild>
                  <a href="https://slack.com/apps" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Slack Settings
                  </a>
                </Button>
              ) : (
                <Button onClick={handleConnect} disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect to Slack"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.channels.map(channel => (
              <Card key={channel.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">#{channel.name}</h4>
                        {channel.isPrivate && (
                          <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{channel.purpose}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {channel.memberCount} members
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'newTickets', label: 'New Support Tickets' },
                  { key: 'criticalAlerts', label: 'Critical Security Alerts' },
                  { key: 'clientUpdates', label: 'Client Status Updates' },
                  { key: 'systemAlerts', label: 'System Alerts' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{label}</span>
                    <input
                      type="checkbox"
                      checked={config.notifications[key as keyof typeof config.notifications]}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        notifications: { 
                          ...prev.notifications, 
                          [key]: e.target.checked 
                        }
                      }))}
                      className="rounded border-gray-300"
                    />
                  </div>
                ))}
              </div>
              <Button>Save Notification Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="space-y-4">
            {notificationRules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge variant="outline">{rule.channel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Trigger: {rule.trigger}
                      </p>
                      <div className="mt-2 p-2 bg-muted rounded text-sm font-mono">
                        {rule.message}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) => setNotificationRules(prev => 
                          prev.map(r => r.id === rule.id ? { ...r, enabled: e.target.checked } : r)
                        )}
                        className="rounded border-gray-300"
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Test Slack Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Channel</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.channels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        #{channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Test Message</Label>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your test message"
                />
              </div>

              <Button onClick={handleSendTestMessage} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Test Message"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SlackIntegration;