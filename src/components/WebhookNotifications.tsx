import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Plus, Settings, Zap, AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered: string | null;
  success_count: number;
  failure_count: number;
  secret: string;
}

interface WebhookEvent {
  id: string;
  name: string;
  description: string;
  example_payload: object;
}

const WebhookNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
    secret: ""
  });

  const availableEvents: WebhookEvent[] = [
    {
      id: "gpt.chat.completed",
      name: "Chat Completed",
      description: "Triggered when a user completes a chat session with a GPT",
      example_payload: {
        event: "gpt.chat.completed",
        gpt_id: "uuid-here",
        user_id: "uuid-here",
        conversation_id: "uuid-here",
        message_count: 5,
        tokens_used: 150,
        timestamp: "2024-01-20T14:30:00Z"
      }
    },
    {
      id: "gpt.created",
      name: "GPT Created",
      description: "Triggered when a new custom GPT is created",
      example_payload: {
        event: "gpt.created",
        gpt_id: "uuid-here",
        name: "My Custom GPT",
        user_id: "uuid-here",
        timestamp: "2024-01-20T14:30:00Z"
      }
    },
    {
      id: "gpt.deployed",
      name: "GPT Deployed", 
      description: "Triggered when a GPT is deployed or updated",
      example_payload: {
        event: "gpt.deployed",
        gpt_id: "uuid-here",
        deployment_url: "https://your-gpt-url.com",
        user_id: "uuid-here",
        timestamp: "2024-01-20T14:30:00Z"
      }
    },
    {
      id: "api.limit.reached",
      name: "API Limit Reached",
      description: "Triggered when API usage limits are reached",
      example_payload: {
        event: "api.limit.reached",
        user_id: "uuid-here",
        limit_type: "requests_per_hour",
        current_usage: 1000,
        limit: 1000,
        timestamp: "2024-01-20T14:30:00Z"
      }
    },
    {
      id: "subscription.changed",
      name: "Subscription Changed",
      description: "Triggered when user subscription status changes",
      example_payload: {
        event: "subscription.changed",
        user_id: "uuid-here",
        old_tier: "free",
        new_tier: "premium",
        timestamp: "2024-01-20T14:30:00Z"
      }
    }
  ];

  useEffect(() => {
    if (user) {
      loadWebhooks();
    }
  }, [user]);

  const loadWebhooks = async () => {
    try {
      // Simulate webhook data - in real implementation, this would come from Supabase
      const mockWebhooks: Webhook[] = [
        {
          id: "1",
          name: "Slack Notifications",
          url: "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK",
          events: ["gpt.chat.completed", "api.limit.reached"],
          is_active: true,
          created_at: "2024-01-15T10:00:00Z",
          last_triggered: "2024-01-20T14:30:00Z",
          success_count: 847,
          failure_count: 2,
          secret: "webhook_secret_key_123"
        },
        {
          id: "2",
          name: "Analytics Dashboard",
          url: "https://your-analytics-system.com/webhook",
          events: ["gpt.created", "gpt.deployed"],
          is_active: false,
          created_at: "2024-01-10T09:00:00Z",
          last_triggered: null,
          success_count: 0,
          failure_count: 0,
          secret: "webhook_secret_key_456"
        }
      ];
      
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load webhooks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields and select at least one event",
        variant: "destructive",
      });
      return;
    }

    try {
      const webhook: Webhook = {
        id: Date.now().toString(),
        name: newWebhook.name,
        url: newWebhook.url,
        events: newWebhook.events,
        is_active: true,
        created_at: new Date().toISOString(),
        last_triggered: null,
        success_count: 0,
        failure_count: 0,
        secret: newWebhook.secret || `webhook_${Math.random().toString(36).substring(2)}`
      };

      setWebhooks([...webhooks, webhook]);
      setNewWebhook({ name: "", url: "", events: [], secret: "" });
      setShowCreateForm(false);
      
      toast({
        title: "Webhook Created",
        description: "Your webhook has been configured successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create webhook",
        variant: "destructive",
      });
    }
  };

  const toggleWebhookStatus = async (webhookId: string) => {
    setWebhooks(webhooks => 
      webhooks.map(webhook => 
        webhook.id === webhookId ? { ...webhook, is_active: !webhook.is_active } : webhook
      )
    );
  };

  const deleteWebhook = async (webhookId: string) => {
    setWebhooks(webhooks => webhooks.filter(webhook => webhook.id !== webhookId));
    toast({
      title: "Webhook Deleted",
      description: "The webhook has been permanently deleted",
    });
  };

  const testWebhook = async (webhook: Webhook) => {
    try {
      const testPayload = {
        event: "webhook.test",
        webhook_id: webhook.id,
        message: "This is a test webhook notification from AI Studio",
        timestamp: new Date().toISOString()
      };

      // In a real implementation, this would trigger the webhook
      toast({
        title: "Test Webhook Sent",
        description: `Test notification sent to ${webhook.name}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test webhook",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading webhooks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Webhook Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Configure real-time notifications for external systems
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="events">Available Events</TabsTrigger>
          <TabsTrigger value="logs">Event Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-6">
          {/* Create Webhook Form */}
          {showCreateForm && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Create New Webhook</CardTitle>
                <CardDescription>
                  Configure a webhook endpoint to receive real-time notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhookName">Webhook Name</Label>
                    <Input
                      id="webhookName"
                      placeholder="e.g., Slack Notifications"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({...newWebhook, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://your-system.com/webhook"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({...newWebhook, url: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhookSecret">Secret Key (Optional)</Label>
                  <Input
                    id="webhookSecret"
                    placeholder="webhook_secret_key"
                    value={newWebhook.secret}
                    onChange={(e) => setNewWebhook({...newWebhook, secret: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used to verify webhook authenticity. Leave blank to auto-generate.
                  </p>
                </div>

                <div>
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {availableEvents.map((event) => (
                      <Card key={event.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <Switch
                            checked={newWebhook.events.includes(event.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: [...newWebhook.events, event.id]
                                });
                              } else {
                                setNewWebhook({
                                  ...newWebhook,
                                  events: newWebhook.events.filter(e => e !== event.id)
                                });
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium text-sm">{event.name}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createWebhook} className="btn-gradient">
                    Create Webhook
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhooks List */}
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {webhook.name}
                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                          {webhook.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {webhook.url} • Created {new Date(webhook.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => testWebhook(webhook)}>
                        Test
                      </Button>
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => toggleWebhookStatus(webhook.id)}
                      />
                      <Button variant="outline" size="sm" onClick={() => deleteWebhook(webhook.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        <strong>{webhook.success_count}</strong> successful
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm">
                        <strong>{webhook.failure_count}</strong> failed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        Last: {webhook.last_triggered 
                          ? new Date(webhook.last_triggered).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Subscribed Events</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {webhook.events.map((eventId) => {
                        const event = availableEvents.find(e => e.id === eventId);
                        return (
                          <Badge key={eventId} variant="outline">
                            {event?.name || eventId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {webhooks.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Webhooks Configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Start receiving real-time notifications by creating your first webhook
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="btn-gradient">
                    Create Webhook
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="grid gap-4">
            {availableEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label>Example Payload:</Label>
                  <Textarea
                    readOnly
                    rows={6}
                    className="mt-2 font-mono text-sm"
                    value={JSON.stringify(event.example_payload, null, 2)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Logs</CardTitle>
              <CardDescription>Recent webhook delivery attempts and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock event logs */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">gpt.chat.completed</p>
                      <p className="text-sm text-muted-foreground">Slack Notifications • 2 minutes ago</p>
                    </div>
                  </div>
                  <Badge variant="default">200 OK</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">gpt.created</p>
                      <p className="text-sm text-muted-foreground">Analytics Dashboard • 1 hour ago</p>
                    </div>
                  </div>
                  <Badge variant="default">200 OK</Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium">api.limit.reached</p>
                      <p className="text-sm text-muted-foreground">Slack Notifications • 3 hours ago</p>
                    </div>
                  </div>
                  <Badge variant="destructive">404 Not Found</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhookNotifications;