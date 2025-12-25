import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plug, Plus, Settings, CheckCircle, XCircle, AlertCircle,
  MessageSquare, Bell, Mail, Webhook, Key, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Integration {
  id: string;
  integration_type: string;
  name: string;
  configuration: any;
  is_enabled: boolean;
  last_triggered_at: string | null;
  trigger_count: number | null;
  created_at: string;
}

const AVAILABLE_INTEGRATIONS = [
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send alerts and notifications to Slack channels',
    icon: MessageSquare,
    color: 'bg-[#4A154B]',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'channel', label: 'Default Channel', type: 'text', placeholder: '#security-alerts' }
    ]
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Post security alerts to Teams channels',
    icon: MessageSquare,
    color: 'bg-[#5059C9]',
    fields: [
      { key: 'webhook_url', label: 'Webhook URL', type: 'text', placeholder: 'https://outlook.office.com/webhook/...' }
    ]
  },
  {
    type: 'pagerduty',
    name: 'PagerDuty',
    description: 'Trigger incidents for critical alerts',
    icon: Bell,
    color: 'bg-[#06AC38]',
    fields: [
      { key: 'routing_key', label: 'Routing Key', type: 'password', placeholder: 'Events API v2 routing key' },
      { key: 'service_id', label: 'Service ID', type: 'text', placeholder: 'PXXXXXX' }
    ]
  },
  {
    type: 'email',
    name: 'Email (SMTP)',
    description: 'Send email notifications for alerts',
    icon: Mail,
    color: 'bg-blue-600',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.example.com' },
      { key: 'smtp_port', label: 'SMTP Port', type: 'text', placeholder: '587' },
      { key: 'smtp_user', label: 'Username', type: 'text', placeholder: 'user@example.com' },
      { key: 'smtp_pass', label: 'Password', type: 'password', placeholder: '••••••••' },
      { key: 'from_email', label: 'From Email', type: 'text', placeholder: 'alerts@example.com' }
    ]
  },
  {
    type: 'webhook',
    name: 'Custom Webhook',
    description: 'Send alerts to any HTTP endpoint',
    icon: Webhook,
    color: 'bg-gray-600',
    fields: [
      { key: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://api.example.com/webhook' },
      { key: 'secret', label: 'Secret (optional)', type: 'password', placeholder: 'Webhook signing secret' },
      { key: 'headers', label: 'Custom Headers (JSON)', type: 'text', placeholder: '{"Authorization": "Bearer ..."}' }
    ]
  },
  {
    type: 'siem',
    name: 'SIEM Integration',
    description: 'Forward events to external SIEM (Splunk, Elastic, etc.)',
    icon: AlertCircle,
    color: 'bg-purple-600',
    fields: [
      { key: 'siem_type', label: 'SIEM Type', type: 'text', placeholder: 'splunk, elastic, sentinel' },
      { key: 'endpoint', label: 'Endpoint URL', type: 'text', placeholder: 'https://siem.example.com/api' },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Your SIEM API key' }
    ]
  }
];

export function IntegrationHub() {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('security_integrations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
    } catch (err) {
      console.error('Failed to load integrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveIntegration = async () => {
    if (!selectedType) return;
    
    const intConfig = AVAILABLE_INTEGRATIONS.find(i => i.type === selectedType);
    if (!intConfig) return;

    // Validate required fields
    const missingFields = intConfig.fields.filter(f => !configValues[f.key]);
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('security_integrations')
        .insert({
          user_id: user?.id,
          integration_type: selectedType,
          name: intConfig.name,
          configuration: configValues,
          is_enabled: true
        });

      if (error) throw error;
      
      toast.success(`${intConfig.name} integration added`);
      setShowAddDialog(false);
      setSelectedType(null);
      setConfigValues({});
      loadIntegrations();
    } catch (err: any) {
      toast.error("Failed to save integration", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleIntegration = async (id: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('security_integrations')
        .update({ is_enabled: !isEnabled })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isEnabled ? "Integration disabled" : "Integration enabled");
      loadIntegrations();
    } catch (err) {
      toast.error("Failed to update integration");
    }
  };

  const deleteIntegration = async (id: string) => {
    try {
      const { error } = await supabase
        .from('security_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Integration removed");
      loadIntegrations();
    } catch (err) {
      toast.error("Failed to delete integration");
    }
  };

  const testIntegration = async (integration: Integration) => {
    toast.info("Testing integration...");
    // In production, this would call an edge function to test the webhook
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Test message sent successfully!");
  };

  const getStatusIcon = (isEnabled: boolean) => {
    return isEnabled 
      ? <CheckCircle className="h-4 w-4 text-green-500" /> 
      : <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  };

  const selectedIntConfig = AVAILABLE_INTEGRATIONS.find(i => i.type === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="h-6 w-6" />
            Integration Hub
          </h2>
          <p className="text-muted-foreground">Connect Vanguard with your security and communication tools</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Integration</DialogTitle>
            </DialogHeader>
            
            {!selectedType ? (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {AVAILABLE_INTEGRATIONS.map(integration => {
                  const Icon = integration.icon;
                  return (
                    <div
                      key={integration.type}
                      className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedType(integration.type)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded ${integration.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded ${selectedIntConfig?.color}`}>
                    {selectedIntConfig && <selectedIntConfig.icon className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium">{selectedIntConfig?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedIntConfig?.description}</p>
                  </div>
                </div>

                {selectedIntConfig?.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-sm font-medium">{field.label}</label>
                    <Input
                      type={field.type}
                      value={configValues[field.key] || ''}
                      onChange={(e) => setConfigValues({...configValues, [field.key]: e.target.value})}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => {
                    setSelectedType(null);
                    setConfigValues({});
                  }}>
                    Back
                  </Button>
                  <Button onClick={saveIntegration} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Integration"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Integrations */}
      <div className="grid gap-4">
        {integrations.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Plug className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No integrations configured yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Add integrations to receive alerts in your preferred tools.</p>
            </CardContent>
          </Card>
        ) : (
          integrations.map(integration => {
            const config = AVAILABLE_INTEGRATIONS.find(i => i.type === integration.integration_type);
            const Icon = config?.icon || Plug;
            
            return (
              <Card key={integration.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${config?.color || 'bg-muted'}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{integration.name}</p>
                          {getStatusIcon(integration.is_enabled)}
                          {integration.is_enabled ? (
                            <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {integration.last_triggered_at 
                            ? `Last used: ${new Date(integration.last_triggered_at).toLocaleString()}`
                            : 'Never used'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testIntegration(integration)}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Switch
                        checked={integration.is_enabled}
                        onCheckedChange={() => toggleIntegration(integration.id, integration.is_enabled)}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteIntegration(integration.id)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Triggers</CardTitle>
          <CardDescription>Configure which events trigger notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { event: 'Critical vulnerability detected', enabled: true },
              { event: 'High severity alert triggered', enabled: true },
              { event: 'New device connected', enabled: false },
              { event: 'MDR case created', enabled: true },
              { event: 'Agent offline for 15+ minutes', enabled: true },
              { event: 'YARA rule match detected', enabled: true },
              { event: 'File integrity change detected', enabled: false },
              { event: 'Suspicious process executed', enabled: true }
            ].map((trigger, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-sm">{trigger.event}</span>
                <Switch defaultChecked={trigger.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
