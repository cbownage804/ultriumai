import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  MessageSquare,
  Shield,
  ShieldCheck,
  ShieldAlert
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
  // AV/MDR fields
  av_status: string;
  av_engine: string;
  av_version: string;
  last_av_scan: string;
  last_threat_found?: string;
  real_time_protection: boolean;
  mdr_status: string;
  threat_level: string;
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

// Helper functions
const getTicketCount = async (customerId: string) => {
  const { count } = await supabase
    .from('helpdesk_tickets')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .in('status', ['open', 'in_progress']);
  return count || 0;
};

const loadTicketsForCustomer = async (customerId: string): Promise<MockTicket[]> => {
  const { data, error } = await supabase
    .from('helpdesk_tickets')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error loading tickets:', error);
    return [];
  }

  return (data || []).map(ticket => ({
    id: ticket.id,
    title: ticket.title,
    description: ticket.description || '',
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category,
    created_at: ticket.created_at
  }));
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
      
      // Get device with customer information
      const { data: deviceData, error: deviceError } = await supabase
        .from('rmm_devices')
        .select(`
          *,
          customer:rmm_customers(*)
        `)
        .eq('id', deviceId)
        .single();

      if (deviceError) throw deviceError;

      if (deviceData && deviceData.customer) {
        const ticketCount = await getTicketCount(deviceData.customer_id);
        const ticketData = await loadTicketsForCustomer(deviceData.customer_id);
        
        const contactInfo: ContactInfo = {
          id: deviceData.id,
          customer_id: deviceData.customer_id,
          company_name: deviceData.customer.company_name,
          primary_contact_name: deviceData.customer.primary_contact_name,
          primary_contact_email: deviceData.customer.primary_contact_email,
          phone: deviceData.customer.phone,
          address: deviceData.customer.address,
          city: deviceData.customer.city,
          state: deviceData.customer.state,
          zip_code: deviceData.customer.zip_code,
          device_hostname: deviceData.hostname,
          device_ip: deviceData.ip_address,
          last_logged_user: deviceData.last_logged_user || 'Unknown',
          last_activity: deviceData.last_seen,
          device_status: deviceData.status,
          ticket_count: ticketCount,
          notes: deviceData.customer.notes,
          // AV/MDR data
          av_status: deviceData.status === 'online' ? 'active' : 'inactive',
          av_engine: 'Windows Defender',
          av_version: '4.18.2410.6',
          last_av_scan: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          last_threat_found: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          real_time_protection: deviceData.status === 'online',
          mdr_status: deviceData.status === 'online' ? 'active' : 'inactive',
          threat_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        };
        
        setContactInfo(contactInfo);
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
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .insert({
          customer_id: contactInfo.customer_id,
          title: `Remote Support - ${contactInfo.device_hostname}`,
          description: `Remote support session requested for device ${contactInfo.device_hostname} (${contactInfo.device_ip})`,
          priority: 'medium',
          status: 'open',
          category: 'remote_support',
          device_context: {
            device_id: contactInfo.id,
            hostname: contactInfo.device_hostname,
            ip_address: contactInfo.device_ip
          }
        })
        .select()
        .single();

      if (error) throw error;

      const newTicket: MockTicket = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        priority: data.priority,
        status: data.status,
        category: data.category,
        created_at: data.created_at
      };

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

          {/* AV/MDR Security Status */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-4 w-4" />
                Antivirus & MDR Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Antivirus Protection</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Status:</span>
                      <div className="flex items-center gap-2">
                        {contactInfo.av_status === 'active' ? (
                          <ShieldCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={contactInfo.av_status === 'active' ? 'default' : 'destructive'}>
                          {contactInfo.av_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Engine:</span>
                      <span className="text-sm font-mono">{contactInfo.av_engine}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Version:</span>
                      <span className="text-sm font-mono">{contactInfo.av_version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Scan:</span>
                      <span className="text-sm">{new Date(contactInfo.last_av_scan).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Real-time Protection:</span>
                      <Badge variant={contactInfo.real_time_protection ? 'default' : 'destructive'}>
                        {contactInfo.real_time_protection ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">MDR & Threat Detection</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">MDR Status:</span>
                      <Badge variant={contactInfo.mdr_status === 'active' ? 'default' : 'secondary'}>
                        {contactInfo.mdr_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Threat Level:</span>
                      <Badge variant={
                        contactInfo.threat_level === 'high' ? 'destructive' :
                        contactInfo.threat_level === 'medium' ? 'secondary' : 'outline'
                      }>
                        {contactInfo.threat_level}
                      </Badge>
                    </div>
                    {contactInfo.last_threat_found && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last Threat:</span>
                        <span className="text-sm text-red-600">
                          {new Date(contactInfo.last_threat_found).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="mt-3">
                      <Button variant="outline" size="sm" className="w-full">
                        Run Full System Scan
                      </Button>
                    </div>
                  </div>
                </div>
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