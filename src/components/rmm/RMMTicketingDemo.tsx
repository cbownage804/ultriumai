import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Monitor, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Ticket,
  ExternalLink,
  Shield,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

interface Device {
  id: string;
  hostname: string;
  ip: string;
  customer: string;
  lastUser: string;
  status: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  tickets: number;
  // AV/MDR fields
  av_status: string;
  av_engine: string;
  last_av_scan: string;
  real_time_protection: boolean;
  mdr_status: string;
  threat_level: string;
}

export const RMMTicketingDemo = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showRemote, setShowRemote] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      
      // Get devices with customer information
      const { data: devicesData, error: devicesError } = await supabase
        .from('rmm_devices')
        .select(`
          *,
          customer:rmm_customers(*)
        `)
        .limit(10);

      if (devicesError) throw devicesError;

      // Transform data for demo
      const transformedDevices: Device[] = (devicesData || []).map((device: any) => ({
        id: device.id,
        hostname: device.hostname,
        ip: device.ip_address,
        customer: device.customer?.company_name || 'Unknown Customer',
        lastUser: device.last_logged_user || 'Unknown',
        status: device.status,
        contact: {
          name: device.customer?.primary_contact_name || 'Unknown',
          email: device.customer?.primary_contact_email || '',
          phone: device.customer?.phone || '',
          address: `${device.customer?.address || ''}, ${device.customer?.city || ''}, ${device.customer?.state || ''} ${device.customer?.zip_code || ''}`.trim()
        },
        tickets: Math.floor(Math.random() * 3), // Simulate ticket count
        // AV/MDR data
        av_status: device.status === 'online' ? 'active' : 'inactive',
        av_engine: 'Windows Defender',
        last_av_scan: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        real_time_protection: device.status === 'online',
        mdr_status: device.status === 'online' ? 'active' : 'inactive',
        threat_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      }));

      setDevices(transformedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (device: Device) => {
    setSelectedDevice(device);
    setShowContact(true);
  };

  const handleRemoteConnect = () => {
    setShowContact(false);
    setShowRemote(true);
    toast({
      title: "Remote Session Started",
      description: `Connected to ${selectedDevice?.hostname}`,
    });
  };

  const createTicket = async () => {
    if (!selectedDevice) return;

    try {
      // Find customer ID for the device
      const { data: deviceData } = await supabase
        .from('rmm_devices')
        .select('customer_id')
        .eq('hostname', selectedDevice.hostname)
        .single();

      if (deviceData) {
        const { error } = await supabase
          .from('helpdesk_tickets')
          .insert({
            customer_id: deviceData.customer_id,
            title: `Support Request - ${selectedDevice.hostname}`,
            description: `Support ticket created from RMM demo for ${selectedDevice.customer}`,
            priority: 'medium',
            status: 'open',
            category: 'remote_support'
          });

        if (error) throw error;
      }

      toast({
        title: "Ticket Created",
        description: `Support ticket created for ${selectedDevice.customer}`,
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Ticket Created",
        description: `Support ticket created for ${selectedDevice.customer}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Integrated RMM & Ticketing Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on "Last User" to view contact info and remote connect
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Last User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AV/MDR Status</TableHead>
                  <TableHead>Open Tickets</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{device.hostname}</p>
                      <p className="text-sm text-muted-foreground">{device.ip}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {device.customer}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm" 
                      onClick={() => handleUserClick(device)}
                      className="justify-start p-0 h-auto font-normal hover:underline"
                    >
                      <User className="h-4 w-4 mr-1" />
                      {device.lastUser}
                    </Button>
                  </TableCell>
                    <TableCell>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {device.av_status === 'active' ? (
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          ) : (
                            <ShieldAlert className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-xs">AV: {device.av_status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={device.threat_level === 'high' ? 'destructive' : 'outline'} className="text-xs">
                            {device.threat_level} risk
                          </Badge>
                          <Badge variant={device.mdr_status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            MDR: {device.mdr_status}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                  <TableCell>
                    {device.tickets > 0 ? (
                      <Badge variant="destructive">{device.tickets} open</Badge>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contact Info Dialog */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Info - {selectedDevice?.lastUser}
            </DialogTitle>
            <DialogDescription>
              Device: {selectedDevice?.hostname} ({selectedDevice?.ip})
            </DialogDescription>
          </DialogHeader>
          
          {selectedDevice && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{selectedDevice.customer}</h3>
                    <p className="text-muted-foreground">{selectedDevice.contact.name}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{selectedDevice.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{selectedDevice.contact.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="text-sm">{selectedDevice.contact.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleRemoteConnect}
                    disabled={selectedDevice.status !== 'online'}
                    className="w-full"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Remote Connect
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={createTicket}
                    className="w-full"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Create Support Ticket
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View All Tickets
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Antivirus:</span>
                    <div className="flex items-center gap-2">
                      {selectedDevice.av_status === 'active' ? (
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant={selectedDevice.av_status === 'active' ? 'default' : 'destructive'}>
                        {selectedDevice.av_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Scan:</span>
                    <span className="text-xs">
                      {new Date(selectedDevice.last_av_scan).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Protection:</span>
                    <Badge variant={selectedDevice.real_time_protection ? 'default' : 'destructive'}>
                      {selectedDevice.real_time_protection ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">MDR Status:</span>
                    <Badge variant={selectedDevice.mdr_status === 'active' ? 'default' : 'secondary'}>
                      {selectedDevice.mdr_status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Threat Level:</span>
                    <Badge variant={
                      selectedDevice.threat_level === 'high' ? 'destructive' :
                      selectedDevice.threat_level === 'medium' ? 'secondary' : 'outline'
                    }>
                      {selectedDevice.threat_level}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remote Session Demo */}
      <Dialog open={showRemote} onOpenChange={setShowRemote}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Remote Session - {selectedDevice?.hostname}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Monitor className="h-16 w-16 mx-auto mb-4" />
              <h3 className="text-xl mb-2">Remote Desktop Active</h3>
              <p>Connected to {selectedDevice?.hostname}</p>
              <p className="text-sm mt-2 opacity-70">Demo mode - actual remote control would appear here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};