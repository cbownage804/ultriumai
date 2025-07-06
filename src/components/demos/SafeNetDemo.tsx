import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Network, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Building,
  Router,
  Server,
  Monitor,
  Smartphone,
  Activity,
  Download,
  Eye
} from "lucide-react";

const mockNetworkDevices = [
  {
    id: "1",
    client: "ABC Manufacturing",
    ip: "192.168.1.1",
    hostname: "gateway-router",
    type: "router",
    status: "online",
    riskLevel: "safe",
    vulnerabilities: 0
  },
  {
    id: "2",
    client: "XYZ Legal",
    ip: "10.0.1.50",
    hostname: "file-server-01",
    type: "server",
    status: "online",
    riskLevel: "high",
    vulnerabilities: 3
  }
];

export const SafeNetDemo = () => {
  const [selectedClient, setSelectedClient] = useState("All Clients");
  const [scanningClient, setScanningClient] = useState<string | null>(null);

  const clients = ["All Clients", "ABC Manufacturing", "XYZ Legal"];

  const filteredDevices = selectedClient === "All Clients" 
    ? mockNetworkDevices 
    : mockNetworkDevices.filter(device => device.client === selectedClient);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'router': return Router;
      case 'server': return Server;
      case 'workstation': return Monitor;
      default: return Network;
    }
  };

  const startClientScan = (clientName: string) => {
    setScanningClient(clientName);
    setTimeout(() => setScanningClient(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Network className="h-16 w-16 mx-auto text-primary" />
        <h2 className="text-3xl font-bold">SafeNet MSP Demo</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Network security monitoring for MSP clients with device discovery and vulnerability assessment.
        </p>
      </div>

      {/* MSP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Network monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">347</div>
            <p className="text-xs text-muted-foreground">Across all networks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />  
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">23</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime Average</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">99.7%</div>
            <Progress value={99.7} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Network Devices</CardTitle>
          <CardDescription>Client network security overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              return (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DeviceIcon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {device.hostname}
                        <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {device.client} • {device.ip}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={device.riskLevel === 'high' ? 'destructive' : 'default'}>
                      {device.riskLevel}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};