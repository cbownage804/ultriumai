import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Mail, 
  Inbox, 
  Send, 
  FileText, 
  Settings, 
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  Reply,
  Forward,
  Trash2,
  Filter,
  Search,
  Link2,
  Zap,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EmailConfig {
  id: string;
  name: string;
  inboundEmail: string;
  outboundEmail: string;
  imapServer: string;
  smtpServer: string;
  isActive: boolean;
  autoCreateTicket: boolean;
  defaultPriority: string;
  lastSync: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'auto_reply' | 'ticket_created' | 'ticket_resolved' | 'sla_warning' | 'custom';
  isActive: boolean;
}

interface InboundEmail {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  status: 'pending' | 'converted' | 'ignored';
  ticketId?: string;
  hasAttachments: boolean;
}

export function EmailIntegrationHub() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [inboundEmails, setInboundEmails] = useState<InboundEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newConfig, setNewConfig] = useState({
    name: '',
    inboundEmail: '',
    outboundEmail: '',
    imapServer: '',
    smtpServer: '',
    autoCreateTicket: true,
    defaultPriority: 'medium',
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'custom' as EmailTemplate['type'],
    isActive: true,
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load email configs
      const { data: configsData, error: configsError } = await (supabase as any)
        .from('vanguard_email_configs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!configsError && configsData) {
        const mapped: EmailConfig[] = configsData.map((c: any) => ({
          id: c.id,
          name: c.config_name,
          inboundEmail: c.inbound_email,
          outboundEmail: c.outbound_email,
          imapServer: c.imap_server || '',
          smtpServer: c.smtp_server || '',
          isActive: c.is_active,
          autoCreateTicket: c.auto_create_ticket,
          defaultPriority: c.default_priority || 'medium',
          lastSync: c.last_sync || c.updated_at,
        }));
        setConfigs(mapped);
      }

      // Load email templates
      const { data: templatesData, error: templatesError } = await (supabase as any)
        .from('vanguard_email_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (!templatesError && templatesData) {
        const mapped: EmailTemplate[] = templatesData.map((t: any) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
          type: t.template_type as EmailTemplate['type'],
          isActive: t.is_active,
        }));
        setTemplates(mapped);
      }

      // Load inbound emails
      const { data: emailsData, error: emailsError } = await (supabase as any)
        .from('vanguard_inbound_emails')
        .select('*')
        .eq('user_id', user?.id)
        .order('received_at', { ascending: false })
        .limit(50);

      if (!emailsError && emailsData) {
        const mapped: InboundEmail[] = emailsData.map((e: any) => ({
          id: e.id,
          from: e.from_address,
          subject: e.subject,
          receivedAt: e.received_at,
          status: e.status as InboundEmail['status'],
          ticketId: e.ticket_id,
          hasAttachments: e.has_attachments,
        }));
        setInboundEmails(mapped);
      }
    } catch (err) {
      console.error('Failed to load email data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!newConfig.name || !newConfig.inboundEmail) {
      toast.error('Name and inbound email are required');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_email_configs')
        .insert({
          user_id: user?.id,
          config_name: newConfig.name,
          inbound_email: newConfig.inboundEmail,
          outbound_email: newConfig.outboundEmail || newConfig.inboundEmail,
          imap_server: newConfig.imapServer,
          smtp_server: newConfig.smtpServer,
          auto_create_ticket: newConfig.autoCreateTicket,
          default_priority: newConfig.defaultPriority,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      loadData();
      setShowConfigDialog(false);
      setNewConfig({
        name: '',
        inboundEmail: '',
        outboundEmail: '',
        imapServer: '',
        smtpServer: '',
        autoCreateTicket: true,
        defaultPriority: 'medium',
      });
      toast.success('Email configuration created');
    } catch (err) {
      console.error('Failed to create config:', err);
      toast.error('Failed to create configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject) {
      toast.error('Name and subject are required');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('vanguard_email_templates')
        .insert({
          user_id: user?.id,
          name: newTemplate.name,
          subject: newTemplate.subject,
          body: newTemplate.body,
          template_type: newTemplate.type,
          is_active: newTemplate.isActive,
        });

      if (error) throw error;

      loadData();
      setShowTemplateDialog(false);
      setNewTemplate({ name: '', subject: '', body: '', type: 'custom', isActive: true });
      toast.success('Email template created');
    } catch (err) {
      console.error('Failed to create template:', err);
      toast.error('Failed to create template');
    } finally {
      setIsSaving(false);
    }
  };

  const convertToTicket = async (emailId: string) => {
    try {
      await (supabase as any)
        .from('vanguard_inbound_emails')
        .update({ status: 'converted' })
        .eq('id', emailId);

      setInboundEmails(emails => emails.map(e => 
        e.id === emailId ? { ...e, status: 'converted' as const } : e
      ));
      toast.success('Email converted to ticket');
    } catch (err) {
      console.error('Failed to convert email:', err);
    }
  };

  const ignoreEmail = async (emailId: string) => {
    try {
      await (supabase as any)
        .from('vanguard_inbound_emails')
        .update({ status: 'ignored' })
        .eq('id', emailId);

      setInboundEmails(emails => emails.map(e => 
        e.id === emailId ? { ...e, status: 'ignored' as const } : e
      ));
      toast.success('Email ignored');
    } catch (err) {
      console.error('Failed to ignore email:', err);
    }
  };

  const pendingCount = inboundEmails.filter(e => e.status === 'pending').length;
  const convertedCount = inboundEmails.filter(e => e.status === 'converted').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Mailboxes</p>
                <p className="text-2xl font-bold">{configs.filter(c => c.isActive).length}</p>
              </div>
              <Inbox className="h-6 w-6 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingCount}</p>
              </div>
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Converted Today</p>
                <p className="text-2xl font-bold text-green-500">{convertedCount}</p>
              </div>
              <Link2 className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Templates</p>
                <p className="text-2xl font-bold">{templates.filter(t => t.isActive).length}</p>
              </div>
              <FileText className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-cyan-500" />
                Email Integration Hub
              </CardTitle>
              <CardDescription>Manage email-to-ticket conversion and templates</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="inbox">
                Inbox
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>

            {/* Inbox Tab */}
            <TabsContent value="inbox" className="mt-4">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search emails..." className="pl-10" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Emails</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inboundEmails.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No inbound emails yet</p>
                  <p className="text-sm">Configure a mailbox to start receiving emails</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inboundEmails.map(email => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">{email.from}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {email.hasAttachments && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                            <span className={cn(
                              email.status === 'pending' && "font-semibold"
                            )}>{email.subject}</span>
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(email.receivedAt), 'MMM dd, HH:mm')}</TableCell>
                        <TableCell>
                          <Badge variant={
                            email.status === 'converted' ? 'default' :
                            email.status === 'pending' ? 'secondary' : 'outline'
                          }>
                            {email.status}
                            {email.ticketId && ` → ${email.ticketId}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {email.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm" title="Create Ticket" onClick={() => convertToTicket(email.id)}>
                                  <Zap className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Ignore" onClick={() => ignoreEmail(email.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" title="View">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-4">
              <div className="flex justify-end mb-4">
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Email Template</DialogTitle>
                      <DialogDescription>
                        Use variables like {'#{ticket_id}'}, {'#{ticket_title}'}, {'#{priority}'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Template Name</Label>
                          <Input 
                            value={newTemplate.name}
                            onChange={e => setNewTemplate({...newTemplate, name: e.target.value})}
                            placeholder="My Template" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select 
                            value={newTemplate.type} 
                            onValueChange={v => setNewTemplate({...newTemplate, type: v as EmailTemplate['type']})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto_reply">Auto Reply</SelectItem>
                              <SelectItem value="ticket_created">Ticket Created</SelectItem>
                              <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                              <SelectItem value="sla_warning">SLA Warning</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input 
                          value={newTemplate.subject}
                          onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})}
                          placeholder="Re: Your request #{ticket_id}" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Body</Label>
                        <Textarea 
                          value={newTemplate.body}
                          onChange={e => setNewTemplate({...newTemplate, body: e.target.value})}
                          placeholder="Enter your email template here..." 
                          className="min-h-[200px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={newTemplate.isActive} 
                          onCheckedChange={v => setNewTemplate({...newTemplate, isActive: v})}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateTemplate} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Template
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates yet</p>
                  <p className="text-sm">Create templates for automated email responses</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{template.name}</p>
                              <Badge variant="outline">{template.type.replace('_', ' ')}</Badge>
                              {template.isActive && <Badge variant="default" className="text-xs">Active</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{template.body}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="config" className="mt-4">
              <div className="flex justify-end mb-4">
                <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Mailbox
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configure Email Mailbox</DialogTitle>
                      <DialogDescription>Set up inbound and outbound email settings</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Mailbox Name</Label>
                        <Input 
                          value={newConfig.name}
                          onChange={e => setNewConfig({...newConfig, name: e.target.value})}
                          placeholder="Support Inbox" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Inbound Email</Label>
                          <Input 
                            value={newConfig.inboundEmail}
                            onChange={e => setNewConfig({...newConfig, inboundEmail: e.target.value})}
                            placeholder="support@company.com" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Outbound Email</Label>
                          <Input 
                            value={newConfig.outboundEmail}
                            onChange={e => setNewConfig({...newConfig, outboundEmail: e.target.value})}
                            placeholder="noreply@company.com" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>IMAP Server</Label>
                          <Input 
                            value={newConfig.imapServer}
                            onChange={e => setNewConfig({...newConfig, imapServer: e.target.value})}
                            placeholder="imap.company.com" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>SMTP Server</Label>
                          <Input 
                            value={newConfig.smtpServer}
                            onChange={e => setNewConfig({...newConfig, smtpServer: e.target.value})}
                            placeholder="smtp.company.com" 
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={newConfig.autoCreateTicket} 
                          onCheckedChange={v => setNewConfig({...newConfig, autoCreateTicket: v})}
                        />
                        <Label>Auto-create tickets from emails</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreateConfig} disabled={isSaving}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Configuration
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {configs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No mailboxes configured</p>
                  <p className="text-sm">Add a mailbox to start receiving emails</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {configs.map(config => (
                    <Card key={config.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{config.name}</p>
                              {config.isActive ? (
                                <Badge variant="default" className="text-xs">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{config.inboundEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              Last sync: {format(new Date(config.lastSync), 'MMM dd, HH:mm')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
