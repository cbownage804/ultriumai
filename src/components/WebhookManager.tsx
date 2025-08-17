import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, TestTube, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret: string;
  created_at: string;
  last_triggered_at?: string;
}

const WebhookManager = () => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: '1',
      url: 'https://example.com/webhook',
      events: ['threat.detected', 'alert.created'],
      is_active: true,
      secret: 'wh_secret_123',
      created_at: new Date().toISOString(),
      last_triggered_at: new Date().toISOString()
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: ''
  });

  const { toast } = useToast();

  const availableEvents = [
    'threat.detected',
    'alert.created', 
    'alert.resolved',
    'scan.completed',
    'vulnerability.found',
    'incident.created'
  ];

  const handleEventToggle = (event: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const handleAddWebhook = () => {
    if (!newWebhook.url) {
      toast({ 
        title: "Error", 
        description: "URL is required",
        variant: "destructive" 
      });
      return;
    }

    const webhook: Webhook = {
      id: Date.now().toString(),
      ...newWebhook,
      is_active: true,
      created_at: new Date().toISOString()
    };

    setWebhooks([...webhooks, webhook]);
    setNewWebhook({ url: '', events: [], secret: '' });
    setShowAddForm(false);
    
    toast({ title: "Webhook added successfully" });
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks(webhooks.filter(w => w.id !== id));
    toast({ title: "Webhook deleted" });
  };

  const handleToggleWebhook = (id: string) => {
    setWebhooks(webhooks.map(w => 
      w.id === id ? { ...w, is_active: !w.is_active } : w
    ));
  };

  const testWebhook = (webhook: Webhook) => {
    toast({ 
      title: "Testing webhook...",
      description: `Sending test payload to ${webhook.url}`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Webhook Management</h2>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time notifications
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-app.com/webhook"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Secret (Optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                value={newWebhook.secret}
                onChange={(e) => setNewWebhook(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="webhook_secret_key"
              />
            </div>

            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={event}
                      checked={newWebhook.events.includes(event)}
                      onChange={() => handleEventToggle(event)}
                      className="rounded"
                    />
                    <Label htmlFor={event} className="text-sm">
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddWebhook}>Add Webhook</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <Card key={webhook.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium">{webhook.url}</span>
                    <Badge variant={webhook.is_active ? "default" : "secondary"}>
                      {webhook.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(webhook.created_at).toLocaleDateString()}
                      {webhook.last_triggered_at && (
                        <span className="ml-4">
                          Last triggered: {new Date(webhook.last_triggered_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={webhook.is_active}
                    onCheckedChange={() => handleToggleWebhook(webhook.id)}
                  />
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook(webhook)}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {webhooks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first webhook to start receiving real-time notifications
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebhookManager;