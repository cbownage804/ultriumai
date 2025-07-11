import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Settings, Save, Copy, TestTube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MSPClient {
  id: string;
  company_name: string;
}

interface ClientEmailConfig {
  id: string;
  client_id: string;
  incoming_email: string;
  outgoing_from_email: string;
  outgoing_from_name: string;
  reply_signature: string;
  auto_reply_enabled: boolean;
  default_priority: string;
  default_category: string;
  is_active: boolean;
  client_name?: string;
}

export const MSPClientEmailConfig = () => {
  const [clients, setClients] = useState<MSPClient[]>([]);
  const [emailConfigs, setEmailConfigs] = useState<ClientEmailConfig[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [formData, setFormData] = useState({
    incoming_email: '',
    outgoing_from_email: '',
    outgoing_from_name: '',
    reply_signature: '',
    auto_reply_enabled: true,
    default_priority: 'medium',
    default_category: 'general',
    is_active: true
  });
  const [editingConfig, setEditingConfig] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    fetchEmailConfigs();
  }, []);

  const fetchClients = async () => {
    try {
      // Get MSP ID first
      const { data: mspData, error: mspError } = await supabase
        .from('msps')
        .select('id')
        .single();

      if (mspError) throw mspError;

      const { data, error } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .eq('msp_id', mspData.id)
        .order('company_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
  };

  const fetchEmailConfigs = async () => {
    try {
      const { data: mspData, error: mspError } = await supabase
        .from('msps')
        .select('id')
        .single();

      if (mspError) throw mspError;

      const { data, error } = await supabase
        .from('client_email_configs')
        .select(`
          *,
          msp_clients!inner(company_name, msp_id)
        `)
        .eq('msp_clients.msp_id', mspData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedConfigs = data?.map(config => ({
        ...config,
        client_name: config.msp_clients?.company_name
      })) || [];

      setEmailConfigs(formattedConfigs);
    } catch (error) {
      console.error('Error fetching email configs:', error);
      toast.error('Failed to load email configurations');
    }
  };

  const generateIncomingEmail = (clientName: string) => {
    const cleanName = clientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}-tickets@safedesk.io`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    try {
      const configData = {
        ...formData,
        client_id: selectedClient,
        incoming_email: formData.incoming_email || generateIncomingEmail(
          clients.find(c => c.id === selectedClient)?.company_name || ''
        )
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('client_email_configs')
          .update(configData)
          .eq('id', editingConfig);

        if (error) throw error;
        toast.success('Email configuration updated');
        setEditingConfig(null);
      } else {
        const { error } = await supabase
          .from('client_email_configs')
          .insert(configData);

        if (error) throw error;
        toast.success('Email configuration created');
      }

      setFormData({
        incoming_email: '',
        outgoing_from_email: '',
        outgoing_from_name: '',
        reply_signature: '',
        auto_reply_enabled: true,
        default_priority: 'medium',
        default_category: 'general',
        is_active: true
      });
      setSelectedClient('');
      fetchEmailConfigs();
    } catch (error) {
      console.error('Error saving email config:', error);
      toast.error('Failed to save email configuration');
    }
  };

  const editConfig = (config: ClientEmailConfig) => {
    setEditingConfig(config.id);
    setSelectedClient(config.client_id);
    setFormData({
      incoming_email: config.incoming_email,
      outgoing_from_email: config.outgoing_from_email,
      outgoing_from_name: config.outgoing_from_name,
      reply_signature: config.reply_signature,
      auto_reply_enabled: config.auto_reply_enabled,
      default_priority: config.default_priority,
      default_category: config.default_category,
      is_active: config.is_active
    });
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('client_email_configs')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success('Configuration updated');
      fetchEmailConfigs();
    } catch (error) {
      console.error('Error updating config:', error);
      toast.error('Failed to update configuration');
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email address copied to clipboard');
  };

  const testEmailConfig = async (config: ClientEmailConfig) => {
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: config.outgoing_from_email,
          subject: 'SafeDesk Email Configuration Test',
          htmlContent: `
            <h2>Email Configuration Test</h2>
            <p>This is a test email to verify your SafeDesk email configuration for ${config.client_name}.</p>
            <ul>
              <li><strong>Incoming Email:</strong> ${config.incoming_email}</li>
              <li><strong>Outgoing From:</strong> ${config.outgoing_from_email}</li>
              <li><strong>From Name:</strong> ${config.outgoing_from_name}</li>
            </ul>
            <p>If you received this email, your configuration is working correctly!</p>
            ${config.reply_signature ? `<br><br>${config.reply_signature}` : ''}
          `,
          textContent: `SafeDesk Email Configuration Test for ${config.client_name} - Configuration working correctly!`
        }
      });

      if (error) throw error;
      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Client Email Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure email addresses for ticket creation and responses per client
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {editingConfig ? 'Edit' : 'Create'} Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="incoming_email">Incoming Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="incoming_email"
                    value={formData.incoming_email}
                    onChange={(e) => setFormData({ ...formData, incoming_email: e.target.value })}
                    placeholder="clients-send-emails-here@safedesk.io"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      if (selectedClient) {
                        const client = clients.find(c => c.id === selectedClient);
                        if (client) {
                          setFormData({ ...formData, incoming_email: generateIncomingEmail(client.company_name) });
                        }
                      }
                    }}
                    disabled={!selectedClient}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Email address where clients send emails to create tickets
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outgoing_from_email">Outgoing Reply Email</Label>
                <Input
                  id="outgoing_from_email"
                  type="email"
                  value={formData.outgoing_from_email}
                  onChange={(e) => setFormData({ ...formData, outgoing_from_email: e.target.value })}
                  placeholder="support@yourclientdomain.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Email address that ticket replies come FROM
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outgoing_from_name">From Name</Label>
              <Input
                id="outgoing_from_name"
                value={formData.outgoing_from_name}
                onChange={(e) => setFormData({ ...formData, outgoing_from_name: e.target.value })}
                placeholder="ACME Corp Support Team"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Priority</Label>
                <Select value={formData.default_priority} onValueChange={(value) => setFormData({ ...formData, default_priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default Category</Label>
                <Select value={formData.default_category} onValueChange={(value) => setFormData({ ...formData, default_category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply_signature">Email Signature</Label>
              <Textarea
                id="reply_signature"
                value={formData.reply_signature}
                onChange={(e) => setFormData({ ...formData, reply_signature: e.target.value })}
                placeholder="Best regards,&#10;ACME Corp Support Team&#10;Phone: (555) 123-4567&#10;https://support.acmecorp.com"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_reply"
                  checked={formData.auto_reply_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_reply_enabled: checked })}
                />
                <Label htmlFor="auto_reply">Enable Auto-Reply</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingConfig && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditingConfig(null);
                    setSelectedClient('');
                    setFormData({
                      incoming_email: '',
                      outgoing_from_email: '',
                      outgoing_from_name: '',
                      reply_signature: '',
                      auto_reply_enabled: true,
                      default_priority: 'medium',
                      default_category: 'general',
                      is_active: true
                    });
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={!selectedClient}>
                <Save className="h-4 w-4 mr-2" />
                {editingConfig ? 'Update' : 'Create'} Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Configurations */}
      <div className="space-y-4">
        <h4 className="font-medium">Client Email Configurations</h4>
        
        {emailConfigs.map((config) => (
          <Card key={config.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <h4 className="font-medium">{config.client_name}</h4>
                    <Badge variant={config.is_active ? "default" : "secondary"}>
                      {config.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Incoming (Clients send TO):</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{config.incoming_email}</code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyEmail(config.incoming_email)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Outgoing (Replies FROM):</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {config.outgoing_from_name} &lt;{config.outgoing_from_email}&gt;
                        </code>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyEmail(config.outgoing_from_email)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Priority: {config.default_priority}</span>
                    <span>Category: {config.default_category}</span>
                    <span>Auto-reply: {config.auto_reply_enabled ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testEmailConfig(config)}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editConfig(config)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Switch
                    checked={config.is_active}
                    onCheckedChange={() => toggleActive(config.id, config.is_active)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {emailConfigs.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Email Configurations</h3>
              <p className="text-muted-foreground">
                Create email configurations for your clients to enable ticket creation and responses
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Clients send emails to the "Incoming" address to create tickets. 
          SafeDesk automatically replies and sends updates from the "Outgoing" address using your client's domain, 
          maintaining professional branding and ensuring replies reach the right inbox.
        </AlertDescription>
      </Alert>
    </div>
  );
};
