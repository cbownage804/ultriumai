import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Search,
  MessageSquare,
  Calendar,
  Tag,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticket: TicketFormData) => void;
}

export interface TicketFormData {
  customer: string;
  contact: string;
  title: string;
  description: string;
  technician: string;
  type: string;
  contract: string;
  formTemplate: string;
  priority: string;
  status: string;
  impact: string;
  dueDate: string;
  source: string;
  tags: string[];
}

interface Customer {
  id: string;
  company_name: string;
}

interface Contact {
  id: string;
  contact_name: string;
  email: string;
  client_id: string;
}

// Technicians are team members - we'll use profiles
const mockTechnicians = [
  { id: 'unassigned', name: 'Unassigned' },
];

export function NewTicketDialog({ open, onOpenChange, onSubmit }: NewTicketDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TicketFormData>({
    customer: '',
    contact: '',
    title: '',
    description: '',
    technician: '',
    type: 'incident',
    contract: '',
    formTemplate: '',
    priority: 'medium',
    status: 'open',
    impact: 'low',
    dueDate: '',
    source: 'manual',
    tags: [],
  });

  const [contactSearch, setContactSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Fetch real customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user || !open) return;
      
      setIsLoadingCustomers(true);
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase types can cause deep instantiation issues
        const { data, error } = await supabase
          .from('msp_clients')
          .select('id, company_name')
          .eq('user_id', user.id);
        
        if (error) throw error;
        const customerData = (data || []) as Customer[];
        setCustomers(customerData.sort((a, b) => a.company_name.localeCompare(b.company_name)));
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [user, open]);

  // Fetch contacts when customer changes
  useEffect(() => {
    const fetchContacts = async () => {
      if (!formData.customer) {
        setContacts([]);
        return;
      }
      
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Supabase types can cause deep instantiation issues
        const { data, error } = await supabase
          .from('client_contacts')
          .select('id, contact_name, email, client_id')
          .eq('client_id', formData.customer);
        
        if (error) throw error;
        setContacts((data || []) as Contact[]);
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    };

    fetchContacts();
  }, [formData.customer]);

  const filteredContacts = contacts.filter(c => 
    c.contact_name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const handleSubmit = () => {
    if (!formData.title || !formData.customer) return;
    onSubmit(formData);
    setFormData({
      customer: '',
      contact: '',
      title: '',
      description: '',
      technician: '',
      type: 'incident',
      contract: '',
      formTemplate: '',
      priority: 'medium',
      status: 'open',
      impact: 'low',
      dueDate: '',
      source: 'manual',
      tags: [],
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl font-semibold">New ticket</DialogTitle>
            <Button variant="ghost" size="sm" className="text-muted-foreground text-sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Give feedback
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Create
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex min-h-[600px]">
          {/* Left Column - Ticket Creation */}
          <div className="flex-1 p-6 border-r border-l-4 border-l-cyan-500">
            <h3 className="text-base font-semibold mb-6">Ticket creation and scheduling</h3>
            
            <div className="space-y-5">
              {/* Customer */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Customer <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.customer} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer: value, contact: '' }))}
                  disabled={isLoadingCustomers}
                >
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder={isLoadingCustomers ? "Loading..." : "Select customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Contact <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search contacts"
                    className="pl-10 bg-background"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                  />
                </div>
                {filteredContacts.length > 0 && contactSearch && (
                  <div className="border rounded-md mt-1 max-h-32 overflow-y-auto">
                    {filteredContacts.map(contact => (
                        <div 
                          key={contact.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, contact: contact.id }));
                            setContactSearch(contact.contact_name);
                          }}
                        >
                          {contact.contact_name} <span className="text-muted-foreground">({contact.email})</span>
                        </div>
                      ))}
                  </div>
                )}
                {contacts.length === 0 && formData.customer && (
                  <p className="text-xs text-muted-foreground">No contacts found for this customer.</p>
                )}
                <Button variant="ghost" size="sm" className="text-cyan-500 hover:text-cyan-600 p-0 h-auto">
                  <Plus className="h-4 w-4 mr-1" />
                  Add contact
                </Button>
              </div>

              {/* Ticket Title */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Ticket Title <span className="text-destructive">*</span>
                </Label>
                <Input 
                  placeholder="Add brief ticket summary"
                  className="bg-background"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea 
                  placeholder="Enter ticket details here"
                  className="min-h-[200px] bg-background resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
                {/* Rich Text Toolbar */}
                <div className="flex items-center gap-1 border rounded-md p-1 bg-muted/30">
                  <ToolbarButton>Aa</ToolbarButton>
                  <ToolbarButton>A</ToolbarButton>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <ToolbarButton bold>B</ToolbarButton>
                  <ToolbarButton italic>I</ToolbarButton>
                  <ToolbarButton underline>U</ToolbarButton>
                  <ToolbarButton strikethrough>S</ToolbarButton>
                  <Separator orientation="vertical" className="h-5 mx-1" />
                  <ToolbarButton>≡</ToolbarButton>
                  <ToolbarButton>•</ToolbarButton>
                  <ToolbarButton>○</ToolbarButton>
                  <ToolbarButton>¶</ToolbarButton>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Assignment & Properties */}
          <div className="w-80 p-6 bg-muted/20">
            {/* Assignment Section */}
            <h3 className="text-base font-semibold mb-6">Ticket assignment and type</h3>
            
            <div className="space-y-4">
              {/* Assign Technician */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Assign technician</Label>
                <Select 
                  value={formData.technician} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, technician: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select technician" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTechnicians.map(tech => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="request">Service Request</SelectItem>
                    <SelectItem value="problem">Problem</SelectItem>
                    <SelectItem value="change">Change Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Contract */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Contract</Label>
                <Select 
                  value={formData.contract} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, contract: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select contract" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Support</SelectItem>
                    <SelectItem value="premium">Premium Support</SelectItem>
                    <SelectItem value="enterprise">Enterprise SLA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Properties Section */}
            <h3 className="text-base font-semibold mb-4">Ticket properties</h3>
            
            <div className="space-y-4">
              {/* Form Template */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Form template</Label>
                <Select 
                  value={formData.formTemplate} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, formTemplate: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="hardware">Hardware Issue</SelectItem>
                    <SelectItem value="software">Software Issue</SelectItem>
                    <SelectItem value="network">Network Issue</SelectItem>
                    <SelectItem value="security">Security Incident</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting on Customer</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="bg-background">
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

              {/* Impact */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Impact</Label>
                <Select 
                  value={formData.impact} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, impact: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Single User</SelectItem>
                    <SelectItem value="medium">Medium - Department</SelectItem>
                    <SelectItem value="high">High - Business Unit</SelectItem>
                    <SelectItem value="critical">Critical - Entire Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Source</Label>
                <Select 
                  value={formData.source} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="portal">Customer Portal</SelectItem>
                    <SelectItem value="chat">Live Chat</SelectItem>
                    <SelectItem value="alert">System Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Due Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="datetime-local"
                    className="pl-10 bg-background"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {formData.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-destructive/20"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        tags: prev.tags.filter((_, i) => i !== index) 
                      }))}
                    >
                      {tag}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <Select 
                  onValueChange={(value) => {
                    if (!formData.tags.includes(value)) {
                      setFormData(prev => ({ ...prev, tags: [...prev.tags, value] }));
                    }
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Add tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="vip">VIP Customer</SelectItem>
                    <SelectItem value="escalated">Escalated</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToolbarButton({ 
  children, 
  bold, 
  italic, 
  underline, 
  strikethrough 
}: { 
  children: React.ReactNode; 
  bold?: boolean; 
  italic?: boolean; 
  underline?: boolean; 
  strikethrough?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-w-[28px] text-sm",
        bold && "font-bold",
        italic && "italic",
        underline && "underline",
        strikethrough && "line-through"
      )}
    >
      {children}
    </button>
  );
}
