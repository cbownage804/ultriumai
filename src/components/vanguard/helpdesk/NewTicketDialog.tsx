import { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (ticket: TicketFormData) => void;
}

interface TicketFormData {
  customer: string;
  contact: string;
  title: string;
  description: string;
  technician: string;
  type: string;
  contract: string;
  formTemplate: string;
  priority: string;
}

const mockCustomers = [
  { id: '1', name: 'Acme Corp' },
  { id: '2', name: 'TechStart Inc' },
  { id: '3', name: 'Global Logistics' },
  { id: '4', name: 'DataFlow Ltd' },
];

const mockContacts = [
  { id: '1', name: 'John Smith', email: 'john@acme.com', customerId: '1' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@techstart.io', customerId: '2' },
  { id: '3', name: 'Mike Wilson', email: 'mike@global.com', customerId: '3' },
];

const mockTechnicians = [
  { id: '1', name: 'Alex Thompson' },
  { id: '2', name: 'Emma Greszes' },
  { id: '3', name: 'David Chen' },
  { id: '4', name: 'Lisa Park' },
];

export function NewTicketDialog({ open, onOpenChange, onSubmit }: NewTicketDialogProps) {
  const [formData, setFormData] = useState<TicketFormData>({
    customer: '',
    contact: '',
    title: '',
    description: '',
    technician: '',
    type: 'incident',
    contract: '',
    formTemplate: '',
    priority: 'low',
  });

  const [contactSearch, setContactSearch] = useState('');

  const filteredContacts = formData.customer 
    ? mockContacts.filter(c => c.customerId === formData.customer)
    : mockContacts;

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
      priority: 'low',
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
                >
                  <SelectTrigger className="bg-background border-input">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCustomers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
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
                    {filteredContacts
                      .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                      .map(contact => (
                        <div 
                          key={contact.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, contact: contact.id }));
                            setContactSearch(contact.name);
                          }}
                        >
                          {contact.name} <span className="text-muted-foreground">({contact.email})</span>
                        </div>
                      ))}
                  </div>
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
