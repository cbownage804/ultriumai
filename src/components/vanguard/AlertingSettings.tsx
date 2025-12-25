import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle,
  Plus,
  Trash2,
  TestTube,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AlertChannel {
  id: string;
  type: 'email' | 'teams';
  name: string;
  config: {
    emails?: string[];
    webhookUrl?: string;
  };
  enabled: boolean;
  lastTest?: string;
  lastTestSuccess?: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  eventTypes: string[];
  minSeverity: 'critical' | 'high' | 'medium' | 'low';
  channels: string[];
  enabled: boolean;
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'critical-threats',
    name: 'Critical Threats',
    eventTypes: ['threat'],
    minSeverity: 'critical',
    channels: [],
    enabled: true
  },
  {
    id: 'agent-offline',
    name: 'Agent Offline',
    eventTypes: ['agent_offline'],
    minSeverity: 'high',
    channels: [],
    enabled: true
  },
  {
    id: 'scan-complete',
    name: 'Scan Completed',
    eventTypes: ['scan_complete'],
    minSeverity: 'low',
    channels: [],
    enabled: false
  },
  {
    id: 'compliance-failure',
    name: 'Compliance Failures',
    eventTypes: ['compliance_failure'],
    minSeverity: 'high',
    channels: [],
    enabled: true
  }
];

export const AlertingSettings = () => {
  const [channels, setChannels] = useState<AlertChannel[]>([]);
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES);
  const [newEmail, setNewEmail] = useState('');
  const [newTeamsWebhook, setNewTeamsWebhook] = useState('');
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Load saved settings from localStorage (in production, save to database)
    const savedChannels = localStorage.getItem('vanguard_alert_channels');
    const savedRules = localStorage.getItem('vanguard_alert_rules');
    
    if (savedChannels) {
      setChannels(JSON.parse(savedChannels));
    }
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
  }, []);

  const saveSettings = (newChannels: AlertChannel[], newRules: AlertRule[]) => {
    localStorage.setItem('vanguard_alert_channels', JSON.stringify(newChannels));
    localStorage.setItem('vanguard_alert_rules', JSON.stringify(newRules));
    setChannels(newChannels);
    setRules(newRules);
  };

  const addEmailChannel = () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    const channel: AlertChannel = {
      id: crypto.randomUUID(),
      type: 'email',
      name: newEmail,
      config: { emails: [newEmail] },
      enabled: true
    };

    const newChannels = [...channels, channel];
    saveSettings(newChannels, rules);
    setNewEmail('');
    
    toast({
      title: "Email Added",
      description: `${newEmail} will receive alerts`
    });
  };

  const addTeamsChannel = () => {
    if (!newTeamsWebhook || !newTeamsWebhook.includes('webhook.office.com')) {
      toast({
        title: "Invalid Webhook",
        description: "Please enter a valid Microsoft Teams webhook URL",
        variant: "destructive"
      });
      return;
    }

    const channel: AlertChannel = {
      id: crypto.randomUUID(),
      type: 'teams',
      name: 'Teams Channel',
      config: { webhookUrl: newTeamsWebhook },
      enabled: true
    };

    const newChannels = [...channels, channel];
    saveSettings(newChannels, rules);
    setNewTeamsWebhook('');
    
    toast({
      title: "Teams Channel Added",
      description: "Webhook configured successfully"
    });
  };

  const removeChannel = (channelId: string) => {
    const newChannels = channels.filter(c => c.id !== channelId);
    // Also remove from rules
    const newRules = rules.map(r => ({
      ...r,
      channels: r.channels.filter(c => c !== channelId)
    }));
    saveSettings(newChannels, newRules);
  };

  const toggleChannel = (channelId: string) => {
    const newChannels = channels.map(c => 
      c.id === channelId ? { ...c, enabled: !c.enabled } : c
    );
    saveSettings(newChannels, rules);
  };

  const toggleRule = (ruleId: string) => {
    const newRules = rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    saveSettings(channels, newRules);
  };

  const toggleRuleChannel = (ruleId: string, channelId: string) => {
    const newRules = rules.map(r => {
      if (r.id !== ruleId) return r;
      const hasChannel = r.channels.includes(channelId);
      return {
        ...r,
        channels: hasChannel 
          ? r.channels.filter(c => c !== channelId)
          : [...r.channels, channelId]
      };
    });
    saveSettings(channels, newRules);
  };

  const testChannel = async (channel: AlertChannel) => {
    setIsTesting(channel.id);
    try {
      const { data, error } = await supabase.functions.invoke('vanguard-alerting', {
        body: {
          type: 'threat',
          severity: 'info',
          title: 'Test Alert from Vanguard',
          description: 'This is a test notification to verify your alerting configuration.',
          user_id: user?.id,
          channels: [channel.type],
          email_recipients: channel.config.emails,
          teams_webhook_url: channel.config.webhookUrl
        }
      });

      if (error) throw error;

      // Update channel with test result
      const newChannels = channels.map(c => 
        c.id === channel.id 
          ? { ...c, lastTest: new Date().toISOString(), lastTestSuccess: data.results?.[0]?.success ?? true }
          : c
      );
      saveSettings(newChannels, rules);

      toast({
        title: "Test Sent",
        description: `Test alert sent via ${channel.type}`
      });
    } catch (error) {
      console.error('Test error:', error);
      
      const newChannels = channels.map(c => 
        c.id === channel.id 
          ? { ...c, lastTest: new Date().toISOString(), lastTestSuccess: false }
          : c
      );
      saveSettings(newChannels, rules);

      toast({
        title: "Test Failed",
        description: "Could not send test notification",
        variant: "destructive"
      });
    } finally {
      setIsTesting(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Alerting & Notifications</h2>
          <p className="text-muted-foreground">Configure email and Microsoft Teams alerts for security events</p>
        </div>
      </div>

      <Tabs defaultValue="channels" className="space-y-6">
        <TabsList>
          <TabsTrigger value="channels" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Alert Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-6">
          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Add email addresses to receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addEmailChannel()}
                />
                <Button onClick={addEmailChannel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {channels.filter(c => c.type === 'email').map(channel => (
                  <div 
                    key={channel.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={channel.enabled}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{channel.name}</span>
                      {channel.lastTest && (
                        channel.lastTestSuccess 
                          ? <CheckCircle className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testChannel(channel)}
                        disabled={isTesting === channel.id}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Teams Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Microsoft Teams
              </CardTitle>
              <CardDescription>
                Add incoming webhook URLs from Microsoft Teams channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://outlook.office.com/webhook/..."
                  value={newTeamsWebhook}
                  onChange={(e) => setNewTeamsWebhook(e.target.value)}
                  className="font-mono text-sm"
                />
                <Button onClick={addTeamsChannel}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              <div className="space-y-2">
                {channels.filter(c => c.type === 'teams').map(channel => (
                  <div 
                    key={channel.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Switch 
                        checked={channel.enabled}
                        onCheckedChange={() => toggleChannel(channel.id)}
                      />
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">{channel.name}</span>
                      {channel.lastTest && (
                        channel.lastTestSuccess 
                          ? <CheckCircle className="h-4 w-4 text-green-500" />
                          : <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testChannel(channel)}
                        disabled={isTesting === channel.id}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeChannel(channel.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {channels.filter(c => c.type === 'teams').length === 0 && (
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">How to get a Teams webhook URL:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open Microsoft Teams and go to your channel</li>
                    <li>Click the "..." menu → Connectors</li>
                    <li>Find "Incoming Webhook" and click Configure</li>
                    <li>Name it "Vanguard Alerts" and copy the webhook URL</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Rules
              </CardTitle>
              <CardDescription>Configure which events trigger notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map(rule => (
                  <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch 
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <div>
                          <span className="font-medium">{rule.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{rule.eventTypes.join(', ')}</Badge>
                            <Badge className={getSeverityColor(rule.minSeverity)}>
                              {rule.minSeverity}+
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {rule.enabled && channels.length > 0 && (
                      <div className="ml-10 pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Send to:</p>
                        <div className="flex flex-wrap gap-2">
                          {channels.map(channel => (
                            <Badge
                              key={channel.id}
                              variant={rule.channels.includes(channel.id) ? 'default' : 'outline'}
                              className="cursor-pointer"
                              onClick={() => toggleRuleChannel(rule.id, channel.id)}
                            >
                              {channel.type === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                              {channel.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
