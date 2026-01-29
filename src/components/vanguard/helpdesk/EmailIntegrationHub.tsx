import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

const mockConfigs: EmailConfig[] = [
  {
    id: '1',
    name: 'Support Inbox',
    inboundEmail: 'support@company.com',
    outboundEmail: 'noreply@company.com',
    imapServer: 'imap.company.com',
    smtpServer: 'smtp.company.com',
    isActive: true,
    autoCreateTicket: true,
    defaultPriority: 'medium',
    lastSync: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'Billing Support',
    inboundEmail: 'billing@company.com',
    outboundEmail: 'billing-noreply@company.com',
    imapServer: 'imap.company.com',
    smtpServer: 'smtp.company.com',
    isActive: true,
    autoCreateTicket: true,
    defaultPriority: 'high',
    lastSync: '2024-01-15T10:28:00Z',
  },
];

const mockTemplates: EmailTemplate[] = [
  { id: '1', name: 'Auto-Reply', subject: 'We received your request [#{ticket_id}]', body: 'Thank you for contacting support. Your request has been received and assigned ticket ID #{ticket_id}. We will respond within our SLA timeframe.', type: 'auto_reply', isActive: true },
  { id: '2', name: 'Ticket Created', subject: 'New ticket created: #{ticket_title}', body: 'A new support ticket has been created:\n\nTicket ID: #{ticket_id}\nTitle: #{ticket_title}\nPriority: #{priority}\n\nWe will begin working on your request shortly.', type: 'ticket_created', isActive: true },
  { id: '3', name: 'Ticket Resolved', subject: 'Your ticket #{ticket_id} has been resolved', body: 'Your support request has been resolved. Please let us know if you need any further assistance.', type: 'ticket_resolved', isActive: true },
  { id: '4', name: 'SLA Warning', subject: 'SLA at risk for ticket #{ticket_id}', body: 'This is an internal notification that ticket #{ticket_id} is approaching its SLA deadline.', type: 'sla_warning', isActive: true },
];

const mockInboundEmails: InboundEmail[] = [
  { id: '1', from: 'john.doe@acme.com', subject: 'Cannot access email', receivedAt: '2024-01-15T10:15:00Z', status: 'converted', ticketId: 'TKT-001', hasAttachments: false },
  { id: '2', from: 'sarah@techstart.io', subject: 'RE: Server maintenance', receivedAt: '2024-01-15T09:45:00Z', status: 'converted', ticketId: 'TKT-002', hasAttachments: true },
  { id: '3', from: 'noreply@spam.com', subject: 'You have won!', receivedAt: '2024-01-15T09:30:00Z', status: 'ignored', hasAttachments: false },
  { id: '4', from: 'mike@globallogistics.com', subject: 'Urgent: Printer issue', receivedAt: '2024-01-15T10:25:00Z', status: 'pending', hasAttachments: true },
];

export function EmailIntegrationHub() {
  const [configs] = useState<EmailConfig[]>(mockConfigs);
  const [templates] = useState<EmailTemplate[]>(mockTemplates);
  const [inboundEmails] = useState<InboundEmail[]>(mockInboundEmails);
  const [activeTab, setActiveTab] = useState('inbox');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const pendingCount = inboundEmails.filter(e => e.status === 'pending').length;
  const convertedCount = inboundEmails.filter(e => e.status === 'converted').length;

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
            <Button variant="outline" size="sm">
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
                              <Button variant="ghost" size="sm" title="Create Ticket">
                                <Zap className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Ignore">
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
                          <Input placeholder="My Template" />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select>
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
                        <Input placeholder="Re: Your request #{ticket_id}" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Body</Label>
                        <Textarea 
                          placeholder="Enter your email template here..." 
                          className="min-h-[200px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <Label>Active</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>Cancel</Button>
                      <Button onClick={() => setShowTemplateDialog(false)}>Save Template</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

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
                        <Input placeholder="Support Inbox" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Inbound Email</Label>
                          <Input placeholder="support@company.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>Outbound Email</Label>
                          <Input placeholder="noreply@company.com" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>IMAP Server</Label>
                          <Input placeholder="imap.company.com" />
                        </div>
                        <div className="space-y-2">
                          <Label>SMTP Server</Label>
                          <Input placeholder="smtp.company.com" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Auto-create tickets from emails</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Priority</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Medium" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowConfigDialog(false)}>Cancel</Button>
                      <Button onClick={() => setShowConfigDialog(false)}>Save Configuration</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {configs.map(config => (
                  <Card key={config.id} className={cn(
                    config.isActive ? "border-green-500/30" : "border-muted"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className={cn(
                              "h-5 w-5",
                              config.isActive ? "text-green-500" : "text-muted-foreground"
                            )} />
                            <p className="font-medium">{config.name}</p>
                            {config.isActive && <Badge variant="default">Active</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{config.inboundEmail}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>IMAP: {config.imapServer}</span>
                            <span>SMTP: {config.smtpServer}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Last sync: {format(new Date(config.lastSync), 'HH:mm')}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Sync
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
