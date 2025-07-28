import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Settings, Webhook, Play, Copy, ExternalLink, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ZapierWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
}

interface ZapTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  category: string;
}

const ZapierIntegration = () => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<ZapierWebhook[]>([]);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState('{"test": true, "timestamp": "2024-01-01T00:00:00Z"}');

  const zapTemplates: ZapTemplate[] = [
    {
      id: '1',
      name: 'New Customer Notification',
      description: 'Send a Slack message when a new customer signs up',
      trigger: 'New Customer',
      actions: ['Send Slack Message', 'Add to CRM'],
      category: 'Customer Management'
    },
    {
      id: '2',
      name: 'Support Ticket Alert',
      description: 'Create Trello card for high-priority support tickets',
      trigger: 'Support Ticket Created',
      actions: ['Create Trello Card', 'Send Email'],
      category: 'Support'
    },
    {
      id: '3',
      name: 'Invoice Processing',
      description: 'Process payment and update accounting when invoice is paid',
      trigger: 'Invoice Paid',
      actions: ['Update QuickBooks', 'Send Receipt'],
      category: 'Finance'
    }
  ];

  const availableEvents = [
    'customer.created',
    'customer.updated',
    'subscription.created',
    'subscription.cancelled',
    'ticket.created',
    'ticket.updated',
    'invoice.paid',
    'invoice.failed'
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      // Mock data - in real implementation, load from database
      const mockWebhooks: ZapierWebhook[] = [
        {
          id: '1',
          name: 'Customer Notifications',
          url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
          events: ['customer.created', 'customer.updated'],
          enabled: true,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          triggerCount: 127
        },
        {
          id: '2',
          name: 'Support Alerts',
          url: 'https://hooks.zapier.com/hooks/catch/789012/ghijkl/',
          events: ['ticket.created'],
          enabled: false,
          lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          triggerCount: 45
        }
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) {
      toast({
        title: "Validation Error",
        description: "Please provide both a name and webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const webhook: ZapierWebhook = {
        id: Date.now().toString(),
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        enabled: true,
        lastTriggered: null,
        triggerCount: 0
      };

      setWebhooks(prev => [...prev, webhook]);
      setNewWebhook({ name: '', url: '', events: [] });
      
      toast({
        title: "Webhook Added",
        description: "Your Zapier webhook has been configured successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add webhook",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWebhook = async (id: string, enabled: boolean) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === id ? { ...webhook, enabled } : webhook
    ));
    
    toast({
      title: enabled ? "Webhook Enabled" : "Webhook Disabled",
      description: `Webhook has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const handleTestWebhook = async (webhook: ZapierWebhook) => {
    setIsLoading(true);
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: testData,
      });

      // Update trigger count
      setWebhooks(prev => prev.map(w => 
        w.id === webhook.id 
          ? { ...w, lastTriggered: new Date().toISOString(), triggerCount: w.triggerCount + 1 }
          : w
      ));

      toast({
        title: "Webhook Triggered",
        description: "Test data sent successfully. Check your Zap history in Zapier.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to trigger webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "Webhook URL has been copied to your clipboard",
    });
  };

  const handleEventToggle = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Integration Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Zapier Integration</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Connect your app to 5000+ other apps via Zapier webhooks
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="https://zapier.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Zapier Dashboard
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="test">Test & Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          {/* Add New Webhook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhookName">Webhook Name</Label>
                  <Input
                    id="webhookName"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Customer Notifications"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Zapier Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={newWebhook.url}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trigger Events</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableEvents.map(event => (
                    <div key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event}
                        checked={newWebhook.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={event} className="text-sm font-mono">
                        {event}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleAddWebhook} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Webhook"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Webhooks */}
          <div className="space-y-4">
            {webhooks.map(webhook => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={webhook.enabled}
                          onCheckedChange={(enabled) => handleToggleWebhook(webhook.id, enabled)}
                        />
                        <div>
                          <h4 className="font-semibold">{webhook.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Triggered {webhook.triggerCount} times</span>
                            {webhook.lastTriggered && (
                              <span>• Last: {new Date(webhook.lastTriggered).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map(event => (
                          <Badge key={event} variant="secondary" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyUrl(webhook.url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestWebhook(webhook)}
                        disabled={isLoading || !webhook.enabled}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zapTemplates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Trigger:</span> {template.trigger}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Actions:</span>
                      <ul className="mt-1 space-y-1">
                        {template.actions.map(action => (
                          <li key={action} className="text-muted-foreground ml-2">
                            • {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a 
                      href={`https://zapier.com/apps/webhook/integrations`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Use Template
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Test Webhook Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testData">Test Payload (JSON)</Label>
                <Textarea
                  id="testData"
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="Enter JSON data to send to your webhooks"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This data will be sent to your webhook when testing. Use the Play button on individual webhooks to test.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ZapierIntegration;
