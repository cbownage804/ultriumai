import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Settings, Webhook, DollarSign, BarChart3, AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StripeConfig {
  enabled: boolean;
  publishableKey: string;
  webhookUrl: string;
  webhookSecret: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string | null;
}

interface WebhookEvent {
  id: string;
  type: string;
  created: string;
  status: 'processed' | 'failed' | 'pending';
  data: any;
}

const StripeIntegration = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<StripeConfig>({
    enabled: false,
    publishableKey: '',
    webhookUrl: '',
    webhookSecret: '',
    status: 'disconnected',
    lastSync: null
  });
  
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<string>('');

  useEffect(() => {
    loadStripeConfig();
    loadWebhookEvents();
  }, []);

  const loadStripeConfig = async () => {
    try {
      // In a real implementation, this would load from your integrations table
      const mockConfig: StripeConfig = {
        enabled: true,
        publishableKey: 'pk_test_...',
        webhookUrl: `${window.location.origin}/api/stripe/webhook`,
        webhookSecret: '••••••••••••••••',
        status: 'connected',
        lastSync: new Date().toISOString()
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load Stripe config:', error);
    }
  };

  const loadWebhookEvents = async () => {
    try {
      // Mock webhook events - in real implementation, load from logs table
      const mockEvents: WebhookEvent[] = [
        {
          id: 'evt_1234567890',
          type: 'customer.subscription.created',
          created: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'processed',
          data: { customer: 'cus_1234567890' }
        },
        {
          id: 'evt_0987654321',
          type: 'invoice.payment_succeeded',
          created: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          status: 'processed',
          data: { amount: 2999 }
        },
        {
          id: 'evt_1122334455',
          type: 'customer.subscription.updated',
          created: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: 'failed',
          data: { customer: 'cus_9876543210' }
        }
      ];
      setWebhookEvents(mockEvents);
    } catch (error) {
      console.error('Failed to load webhook events:', error);
    }
  };

  const handleToggleIntegration = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      setConfig(prev => ({ ...prev, enabled, status: enabled ? 'connected' : 'disconnected' }));
      toast({
        title: enabled ? "Stripe Integration Enabled" : "Stripe Integration Disabled",
        description: enabled ? "Your Stripe integration is now active" : "Your Stripe integration has been disabled",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update integration status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConfig(prev => ({ ...prev, status: 'connected', lastSync: new Date().toISOString() }));
      toast({
        title: "Connection Successful",
        description: "Stripe integration is working correctly",
      });
    } catch (error) {
      setConfig(prev => ({ ...prev, status: 'error' }));
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Stripe. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(config.webhookUrl);
    toast({
      title: "Webhook URL Copied",
      description: "The webhook URL has been copied to your clipboard",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-success';
      case 'error': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-success';
      case 'failed': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  return (
    <div className="space-y-6">
      {/* Integration Status Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Stripe Integration
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(config.status)} text-white border-0`}
                  >
                    {config.status}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {config.lastSync ? `Last synced: ${new Date(config.lastSync).toLocaleString()}` : 'Never synced'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={config.enabled} 
                onCheckedChange={handleToggleIntegration}
                disabled={isLoading}
              />
              <Button variant="outline" onClick={handleTestConnection} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Tabs */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publishableKey">Publishable Key</Label>
                <Input
                  id="publishableKey"
                  value={config.publishableKey}
                  onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                  placeholder="pk_test_..."
                  type="password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  value={config.webhookSecret}
                  onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  placeholder="whsec_..."
                  type="password"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Save Configuration</Button>
                <Button variant="outline" asChild>
                  <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Stripe Dashboard
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Webhook Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input value={config.webhookUrl} readOnly />
                  <Button variant="outline" onClick={handleCopyWebhookUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add this URL to your Stripe webhook endpoints in the Stripe Dashboard
                </p>
              </div>

              <div className="space-y-2">
                <Label>Supported Events</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'customer.subscription.created',
                    'customer.subscription.updated',
                    'customer.subscription.deleted',
                    'invoice.payment_succeeded',
                    'invoice.payment_failed',
                    'checkout.session.completed'
                  ].map(event => (
                    <div key={event} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm font-mono">{event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Recent Webhook Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhookEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        event.status === 'processed' ? 'bg-success' :
                        event.status === 'failed' ? 'bg-destructive' : 'bg-warning'
                      }`} />
                      <div>
                        <p className="font-medium">{event.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.created).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getEventStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{event.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">$12,459</p>
                    <p className="text-xs text-success">+12% this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                    <p className="text-2xl font-bold">247</p>
                    <p className="text-xs text-success">+5 this week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Webhook className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Webhook Success Rate</p>
                    <p className="text-2xl font-bold">99.2%</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StripeIntegration;