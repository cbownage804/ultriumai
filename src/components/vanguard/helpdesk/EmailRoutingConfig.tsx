import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, 
  User, 
  Monitor, 
  Plus,
  Trash2,
  Settings2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Link2,
  Building2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DomainMapping {
  id: string;
  domain: string;
  client_id: string | null;
  client_name?: string;
  is_active: boolean;
  priority: number;
  match_type: 'exact' | 'wildcard' | 'regex';
}

interface ContactMapping {
  id: string;
  email_address: string;
  client_id: string | null;
  client_name?: string;
  contact_id: string | null;
  contact_name?: string;
  is_active: boolean;
  auto_created: boolean;
}

interface DeviceMapping {
  id: string;
  device_identifier: string;
  identifier_type: 'hostname' | 'ip_address' | 'device_id' | 'mac_address';
  agent_id: string | null;
  agent_name?: string;
  client_id: string | null;
  client_name?: string;
  is_active: boolean;
}

interface RoutingSettings {
  enable_contact_matching: boolean;
  enable_domain_matching: boolean;
  enable_device_matching: boolean;
  enable_auto_learning: boolean;
  unknown_sender_action: 'create_unassigned' | 'hold_for_review' | 'reject' | 'assign_default';
  default_client_id: string | null;
  enable_thread_tracking: boolean;
  parse_device_info: boolean;
  notify_on_unknown_sender: boolean;
  notify_email: string;
}

interface Client {
  id: string;
  company_name: string;
}

interface EmailRoutingConfigProps {
  configId?: string;
}

export function EmailRoutingConfig({ configId }: EmailRoutingConfigProps) {
  const { user } = useAuth();
  const [domainMappings, setDomainMappings] = useState<DomainMapping[]>([]);
  const [contactMappings, setContactMappings] = useState<ContactMapping[]>([]);
  const [deviceMappings, setDeviceMappings] = useState<DeviceMapping[]>([]);
  const [routingSettings, setRoutingSettings] = useState<RoutingSettings>({
    enable_contact_matching: true,
    enable_domain_matching: true,
    enable_device_matching: true,
    enable_auto_learning: true,
    unknown_sender_action: 'create_unassigned',
    default_client_id: null,
    enable_thread_tracking: true,
    parse_device_info: false,
    notify_on_unknown_sender: false,
    notify_email: ''
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('domains');
  
  // Dialog states
  const [showDomainDialog, setShowDomainDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  
  // New item states
  const [newDomain, setNewDomain] = useState({ domain: '', client_id: '', match_type: 'exact' as const });
  const [newContact, setNewContact] = useState({ email_address: '', client_id: '' });
  const [newDevice, setNewDevice] = useState({ device_identifier: '', identifier_type: 'hostname' as const, client_id: '' });

  useEffect(() => {
    if (user) loadData();
  }, [user, configId]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // Load clients for dropdowns
      const { data: clientsData } = await supabase
        .from('msp_clients')
        .select('id, company_name')
        .eq('msp_id', user.id)
        .eq('is_active', true)
        .order('company_name');

      if (clientsData) setClients(clientsData);

      // Load domain mappings
      const { data: domains } = await (supabase as any)
        .from('email_domain_mappings')
        .select('*, msp_clients(company_name)')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (domains) {
        setDomainMappings(domains.map((d: any) => ({
          id: d.id,
          domain: d.domain,
          client_id: d.client_id,
          client_name: d.msp_clients?.company_name,
          is_active: d.is_active,
          priority: d.priority,
          match_type: d.match_type
        })));
      }

      // Load contact mappings
      const { data: contacts } = await (supabase as any)
        .from('email_contact_mappings')
        .select('*, msp_clients(company_name), client_contacts(contact_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (contacts) {
        setContactMappings(contacts.map((c: any) => ({
          id: c.id,
          email_address: c.email_address,
          client_id: c.client_id,
          client_name: c.msp_clients?.company_name,
          contact_id: c.contact_id,
          contact_name: c.client_contacts?.contact_name,
          is_active: c.is_active,
          auto_created: c.auto_created
        })));
      }

      // Load device mappings
      const { data: devices } = await (supabase as any)
        .from('email_device_mappings')
        .select('*, msp_clients(company_name), vanguard_agents(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (devices) {
        setDeviceMappings(devices.map((d: any) => ({
          id: d.id,
          device_identifier: d.device_identifier,
          identifier_type: d.identifier_type,
          agent_id: d.agent_id,
          agent_name: d.vanguard_agents?.name,
          client_id: d.client_id,
          client_name: d.msp_clients?.company_name,
          is_active: d.is_active
        })));
      }

      // Load routing settings
      if (configId) {
        const { data: settings } = await (supabase as any)
          .from('email_routing_settings')
          .select('*')
          .eq('email_config_id', configId)
          .single();

        if (settings) {
          setRoutingSettings({
            enable_contact_matching: settings.enable_contact_matching,
            enable_domain_matching: settings.enable_domain_matching,
            enable_device_matching: settings.enable_device_matching,
            enable_auto_learning: settings.enable_auto_learning,
            unknown_sender_action: settings.unknown_sender_action,
            default_client_id: settings.default_client_id,
            enable_thread_tracking: settings.enable_thread_tracking,
            parse_device_info: settings.parse_device_info,
            notify_on_unknown_sender: settings.notify_on_unknown_sender,
            notify_email: settings.notify_email || ''
          });
        }
      }
    } catch (err) {
      console.error('Failed to load routing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain.domain || !newDomain.client_id) {
      toast.error('Domain and client are required');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('email_domain_mappings')
        .insert({
          user_id: user?.id,
          email_config_id: configId,
          domain: newDomain.domain.toLowerCase(),
          client_id: newDomain.client_id,
          match_type: newDomain.match_type,
          is_active: true,
          priority: 0
        });

      if (error) throw error;

      toast.success('Domain mapping added');
      setShowDomainDialog(false);
      setNewDomain({ domain: '', client_id: '', match_type: 'exact' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add domain');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.email_address || !newContact.client_id) {
      toast.error('Email and client are required');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('email_contact_mappings')
        .insert({
          user_id: user?.id,
          email_config_id: configId,
          email_address: newContact.email_address.toLowerCase(),
          client_id: newContact.client_id,
          is_active: true,
          auto_created: false
        });

      if (error) throw error;

      toast.success('Contact mapping added');
      setShowContactDialog(false);
      setNewContact({ email_address: '', client_id: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add contact');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.device_identifier || !newDevice.client_id) {
      toast.error('Device identifier and client are required');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('email_device_mappings')
        .insert({
          user_id: user?.id,
          email_config_id: configId,
          device_identifier: newDevice.device_identifier.toLowerCase(),
          identifier_type: newDevice.identifier_type,
          client_id: newDevice.client_id,
          is_active: true
        });

      if (error) throw error;

      toast.success('Device mapping added');
      setShowDeviceDialog(false);
      setNewDevice({ device_identifier: '', identifier_type: 'hostname', client_id: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add device');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMapping = async (table: string, id: string) => {
    try {
      await (supabase as any).from(table).delete().eq('id', id);
      toast.success('Mapping deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete mapping');
    }
  };

  const handleSaveSettings = async () => {
    if (!configId) return;

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('email_routing_settings')
        .upsert({
          user_id: user?.id,
          email_config_id: configId,
          ...routingSettings
        }, { onConflict: 'email_config_id' });

      if (error) throw error;
      toast.success('Routing settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Routing Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="h-5 w-5 text-cyan-500" />
            Client Matching Settings
          </CardTitle>
          <CardDescription>
            Configure how incoming emails are automatically matched to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Matching options */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase">Matching Methods</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Email Matching
                  </Label>
                  <p className="text-xs text-muted-foreground">Match sender email to known contacts</p>
                </div>
                <Switch
                  checked={routingSettings.enable_contact_matching}
                  onCheckedChange={v => setRoutingSettings({...routingSettings, enable_contact_matching: v})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Domain Matching
                  </Label>
                  <p className="text-xs text-muted-foreground">Match sender domain to client</p>
                </div>
                <Switch
                  checked={routingSettings.enable_domain_matching}
                  onCheckedChange={v => setRoutingSettings({...routingSettings, enable_domain_matching: v})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Device Matching (RMM)
                  </Label>
                  <p className="text-xs text-muted-foreground">Match device info from email body</p>
                </div>
                <Switch
                  checked={routingSettings.enable_device_matching}
                  onCheckedChange={v => setRoutingSettings({...routingSettings, enable_device_matching: v})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Auto-Learn Mappings
                  </Label>
                  <p className="text-xs text-muted-foreground">Automatically create contact mappings</p>
                </div>
                <Switch
                  checked={routingSettings.enable_auto_learning}
                  onCheckedChange={v => setRoutingSettings({...routingSettings, enable_auto_learning: v})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Thread Tracking
                  </Label>
                  <p className="text-xs text-muted-foreground">Keep email threads together</p>
                </div>
                <Switch
                  checked={routingSettings.enable_thread_tracking}
                  onCheckedChange={v => setRoutingSettings({...routingSettings, enable_thread_tracking: v})}
                />
              </div>
            </div>

            {/* Right column - Unknown sender handling */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase">Unknown Sender Handling</h4>
              
              <div className="space-y-2">
                <Label>When sender is not recognized</Label>
                <Select
                  value={routingSettings.unknown_sender_action}
                  onValueChange={v => setRoutingSettings({...routingSettings, unknown_sender_action: v as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="create_unassigned">Create unassigned ticket</SelectItem>
                    <SelectItem value="hold_for_review">Hold for manual review</SelectItem>
                    <SelectItem value="assign_default">Assign to default client</SelectItem>
                    <SelectItem value="reject">Reject email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {routingSettings.unknown_sender_action === 'assign_default' && (
                <div className="space-y-2">
                  <Label>Default Client</Label>
                  <Select
                    value={routingSettings.default_client_id || ''}
                    onValueChange={v => setRoutingSettings({...routingSettings, default_client_id: v || null})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Notify on Unknown Sender
                  </Label>
                  <p className="text-xs text-muted-foreground">Send alert when sender not matched</p>
                </div>
                <Switch
                  checked={routingSettings.notify_on_unknown_sender}
                  onCheckedChange={v => setRoutingSettings({...routingSettings, notify_on_unknown_sender: v})}
                />
              </div>

              {routingSettings.notify_on_unknown_sender && (
                <div className="space-y-2">
                  <Label>Notification Email</Label>
                  <Input
                    value={routingSettings.notify_email}
                    onChange={e => setRoutingSettings({...routingSettings, notify_email: e.target.value})}
                    placeholder="admin@company.com"
                    type="email"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client Matching Rules</CardTitle>
          <CardDescription>
            Define how email addresses, domains, and devices map to your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="domains" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Domains
                <Badge variant="secondary" className="ml-1">{domainMappings.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Contacts
                <Badge variant="secondary" className="ml-1">{contactMappings.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="devices" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Devices
                <Badge variant="secondary" className="ml-1">{deviceMappings.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Domains Tab */}
            <TabsContent value="domains" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Map email domains to clients (e.g., all emails from @acme.com go to Acme Corp)
                </p>
                <Dialog open={showDomainDialog} onOpenChange={setShowDomainDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Domain
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Domain Mapping</DialogTitle>
                      <DialogDescription>
                        Emails from this domain will be matched to the selected client
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Domain</Label>
                        <Input
                          value={newDomain.domain}
                          onChange={e => setNewDomain({...newDomain, domain: e.target.value})}
                          placeholder="acme.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                          value={newDomain.client_id}
                          onValueChange={v => setNewDomain({...newDomain, client_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Match Type</Label>
                        <Select
                          value={newDomain.match_type}
                          onValueChange={v => setNewDomain({...newDomain, match_type: v as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exact">Exact Match</SelectItem>
                            <SelectItem value="wildcard">Wildcard (*.domain.com)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDomainDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddDomain} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Domain
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {domainMappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No domain mappings yet</p>
                  <p className="text-sm">Add domains to automatically route emails by sender domain</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domainMappings.map(mapping => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-mono">{mapping.domain}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {mapping.client_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{mapping.match_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {mapping.is_active ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMapping('email_domain_mappings', mapping.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Map specific email addresses to clients (takes priority over domain matching)
                </p>
                <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Contact Mapping</DialogTitle>
                      <DialogDescription>
                        Emails from this address will be matched to the selected client
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                          value={newContact.email_address}
                          onChange={e => setNewContact({...newContact, email_address: e.target.value})}
                          placeholder="john@acme.com"
                          type="email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                          value={newContact.client_id}
                          onValueChange={v => setNewContact({...newContact, client_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddContact} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Contact
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {contactMappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No contact mappings yet</p>
                  <p className="text-sm">Contacts are auto-learned or can be added manually</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email Address</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactMappings.map(mapping => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-mono">{mapping.email_address}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {mapping.client_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {mapping.auto_created ? (
                              <Badge variant="outline" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Auto-learned
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Manual</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {mapping.is_active ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMapping('email_contact_mappings', mapping.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Devices Tab */}
            <TabsContent value="devices" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Map devices to clients for RMM-integrated email routing
                </p>
                <Dialog open={showDeviceDialog} onOpenChange={setShowDeviceDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Device
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Device Mapping</DialogTitle>
                      <DialogDescription>
                        Emails mentioning this device will be matched to the selected client
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Device Identifier</Label>
                        <Input
                          value={newDevice.device_identifier}
                          onChange={e => setNewDevice({...newDevice, device_identifier: e.target.value})}
                          placeholder="WORKSTATION-01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Identifier Type</Label>
                        <Select
                          value={newDevice.identifier_type}
                          onValueChange={v => setNewDevice({...newDevice, identifier_type: v as any})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hostname">Hostname</SelectItem>
                            <SelectItem value="ip_address">IP Address</SelectItem>
                            <SelectItem value="device_id">Device ID</SelectItem>
                            <SelectItem value="mac_address">MAC Address</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select
                          value={newDevice.client_id}
                          onValueChange={v => setNewDevice({...newDevice, client_id: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeviceDialog(false)}>Cancel</Button>
                      <Button onClick={handleAddDevice} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Add Device
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {deviceMappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No device mappings yet</p>
                  <p className="text-sm">Map devices for RMM-integrated email routing</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deviceMappings.map(mapping => (
                        <TableRow key={mapping.id}>
                          <TableCell className="font-mono">{mapping.device_identifier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{mapping.identifier_type.replace('_', ' ')}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {mapping.client_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {mapping.is_active ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMapping('email_device_mappings', mapping.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <CheckCircle2 className="h-6 w-6 text-cyan-400" />
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">How Email Routing Works</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. <strong>Thread Match</strong> - If replying to an existing conversation, use that client</p>
                <p>2. <strong>Contact Match</strong> - Check if sender email is a known contact</p>
                <p>3. <strong>Domain Match</strong> - Match sender's email domain to client domain</p>
                <p>4. <strong>Device Match</strong> - Parse email body for device info and match via RMM</p>
                <p>5. <strong>Default Action</strong> - Apply configured fallback for unknown senders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
