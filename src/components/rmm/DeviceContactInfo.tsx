import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Monitor, 
  Calendar, 
  Activity,
  ExternalLink,
  Ticket,
  MessageSquare
} from "lucide-react";

interface ContactInfo {
  id: string;
  customer_id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  device_hostname: string;
  device_ip: string;
  last_logged_user: string;
  last_activity: string;
  device_status: string;
  ticket_count: number;
  notes?: string;
}

interface DeviceContactInfoProps {
  deviceId: string;
  lastLoggedUser: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoteConnect?: (deviceId: string, hostname: string) => void;
}

interface MockTicket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  created_at: string;
}

// Mock data
const mockContactInfo: Record<string, ContactInfo> = {
  "1": {
    id: "1",
    customer_id: "customer-1",
    company_name: "Acme Corporation",
    primary_contact_name: "John Smith",
    primary_contact_email: "john@acmecorp.com",
    phone: "(555) 123-4567",
    address: "123 Business St",
    city: "Business City",
    state: "NY",
    zip_code: "12345",
    device_hostname: "WORKSTATION-01",
    device_ip: "192.168.1.100",
    last_logged_user: "john.doe",
    last_activity: "2024-01-06T10:30:00Z",
    device_status: "online",
    ticket_count: 2,
    notes: "Primary workstation for John Smith"
  },
  "2": {
    id: "2",
    customer_id: "customer-2",
    company_name: "TechStart LLC",
    primary_contact_name: "Sarah Wilson",
    primary_contact_email: "sarah@techstart.com",
    phone: "(555) 987-6543",
    address: "456 Tech Ave",
    city: "Innovation City",
    state: "CA",
    zip_code: "94102",
    device_hostname: "LAPTOP-SALES-02",
    device_ip: "192.168.1.105",
    last_logged_user: "sarah.wilson",
    last_activity: "2024-01-05T14:22:00Z",
    device_status: "offline",
    ticket_count: 1,
    notes: "Sales team laptop"
  }
};

const mockTickets: Record<string, MockTicket[]> = {
  "customer-1": [
    {
      id: "1",
      title: "Network connectivity issues",
      description: "Intermittent network drops during peak hours",
      priority: "high",
      status: "open",
      category: "network",
      created_at: "2024-01-05T09:15:00Z"
    },
    {
      id: "2",
      title: "Software update required",
      description: "Critical security update for workstation software",
      priority: "medium",
      status: "in_progress",
      category: "software",
      created_at: "2024-01-04T14:30:00Z"
    }
  ],
  "customer-2": [
    {
      id: "3",
      title: "Performance optimization",
      description: "Laptop running slowly, needs cleanup",
      priority: "low",
      status: "open",
      category: "performance",
      created_at: "2024-01-03T11:45:00Z"
    }
  ]
};

export const DeviceContactInfo = ({ 
  deviceId, 
  lastLoggedUser, 
  open, 
  onOpenChange,
  onRemoteConnect 
}: DeviceContactInfoProps) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<MockTicket[]>([]);
  const { toast } = useToast();

  const loadContactInfo = async () => {
    if (!deviceId) return;

    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get mock data
      const contact = mockContactInfo[deviceId];
      const ticketData = mockTickets[contact?.customer_id] || [];
      
      if (contact) {
        setContactInfo(contact);
        setTickets(ticketData);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
      toast({
        title: "Error",
        description: "Failed to load contact information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && deviceId) {
      loadContactInfo();
    }
  }, [open, deviceId]);

  const handleRemoteConnect = () => {
    if (contactInfo && onRemoteConnect) {
      onRemoteConnect(contactInfo.id, contactInfo.device_hostname);
    }
  };

  const createTicket = async () => {
    if (!contactInfo) return;

    try {
      const newTicket: MockTicket = {
        id: Date.now().toString(),
        title: `Remote Support - ${contactInfo.device_hostname}`,
        description: `Remote support session requested for device ${contactInfo.device_hostname} (${contactInfo.device_ip})`,
        priority: 'medium',
        status: 'open',
        category: 'remote_support',
        created_at: new Date().toISOString()
      };

      // Add to mock data
      setTickets(prev => [newTicket, ...prev]);
      
      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!contactInfo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Information</DialogTitle>
            <DialogDescription>
              No contact information found for this device
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information - {contactInfo.last_logged_user}
          </DialogTitle>
          <DialogDescription>
            Device: {contactInfo.device_hostname} ({contactInfo.device_ip})
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" />
                Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{contactInfo.company_name}</h3>
                <p className="text-muted-foreground">{contactInfo.primary_contact_name}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{contactInfo.primary_contact_email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{contactInfo.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p>{contactInfo.address}</p>
                    <p>{contactInfo.city}, {contactInfo.state} {contactInfo.zip_code}</p>
                  </div>
                </div>
              </div>

              {contactInfo.notes && (
                <div>
                  <h4 className="font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{contactInfo.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="h-4 w-4" />
                Device Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hostname:</span>
                  <span className="text-sm">{contactInfo.device_hostname}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">IP Address:</span>
                  <span className="text-sm font-mono">{contactInfo.device_ip}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last User:</span>
                  <span className="text-sm">{contactInfo.last_logged_user}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant={contactInfo.device_status === 'online' ? 'default' : 'secondary'}>
                    {contactInfo.device_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Activity:</span>
                  <span className="text-sm">{new Date(contactInfo.last_activity).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleRemoteConnect}
                  disabled={contactInfo.device_status !== 'online'}
                  className="flex-1"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Remote Connect
                </Button>
                <Button 
                  variant="outline" 
                  onClick={createTicket}
                  className="flex-1"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Tickets */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-4 w-4" />
                Recent Support Tickets ({contactInfo.ticket_count})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{ticket.title}</h4>
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {ticket.priority}
                          </Badge>
                          <Badge variant={ticket.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                            {ticket.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No support tickets found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};