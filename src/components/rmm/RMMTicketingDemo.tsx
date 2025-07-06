import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Monitor, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Ticket,
  ExternalLink
} from "lucide-react";

// Mock data for demo
const mockDevices = [
  {
    id: "1",
    hostname: "WORKSTATION-01",
    ip: "192.168.1.100",
    customer: "Acme Corp",
    lastUser: "john.doe",
    status: "online",
    contact: {
      name: "John Smith",
      email: "john@acmecorp.com",
      phone: "(555) 123-4567",
      address: "123 Business St, City, ST 12345"
    },
    tickets: 2
  },
  {
    id: "2", 
    hostname: "LAPTOP-SALES-02",
    ip: "192.168.1.105",
    customer: "TechStart LLC",
    lastUser: "sarah.wilson",
    status: "offline",
    contact: {
      name: "Sarah Wilson",
      email: "sarah@techstart.com", 
      phone: "(555) 987-6543",
      address: "456 Tech Ave, City, ST 12345"
    },
    tickets: 0
  }
];

export const RMMTicketingDemo = () => {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [showContact, setShowContact] = useState(false);
  const [showRemote, setShowRemote] = useState(false);
  const { toast } = useToast();

  const handleUserClick = (device: any) => {
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

  const createTicket = () => {
    toast({
      title: "Ticket Created",
      description: `Support ticket created for ${selectedDevice?.customer}`,
    });
  };

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
                <TableHead>Open Tickets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockDevices.map((device) => (
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