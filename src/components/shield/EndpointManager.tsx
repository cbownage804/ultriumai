import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Monitor, 
  Search, 
  Activity, 
  Lock,
  Unlock,
  Info,
  Clock,
  Shield,
  AlertTriangle
} from "lucide-react";

interface Endpoint {
  id: string;
  hostname: string;
  ip_address: string;
  os_version: string;
  agent_version: string;
  status: 'online' | 'offline' | 'threat_detected' | 'isolated';
  last_seen: string;
  metadata?: any;
}

interface EndpointManagerProps {
  endpoints: Endpoint[];
  onEndpointAction: () => void;
}

export const EndpointManager = ({ endpoints, onEndpointAction }: EndpointManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.ip_address.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || endpoint.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'isolated': return 'destructive';
      case 'threat_detected': return 'secondary';
      case 'offline': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Activity className="h-4 w-4 text-green-600" />;
      case 'isolated': return <Lock className="h-4 w-4 text-red-600" />;
      case 'threat_detected': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'offline': return <Monitor className="h-4 w-4 text-gray-500" />;
      default: return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const isolateEndpoint = async (hostname: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const response = await supabase.functions.invoke('ultrium-shield-agent', {
        body: { 
          action: 'isolate_endpoint',
          hostname,
          user_id: user.user.id
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Endpoint Isolated",
        description: `${hostname} has been isolated from the network`,
      });

      onEndpointAction();
    } catch (error) {
      console.error('Error isolating endpoint:', error);
      toast({
        title: "Error",
        description: "Failed to isolate endpoint",
        variant: "destructive",
      });
    }
  };

  const viewEndpointDetails = (endpoint: Endpoint) => {
    setSelectedEndpoint(endpoint);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Endpoint Management
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search endpoints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="threat_detected">Threat Detected</option>
                <option value="isolated">Isolated</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEndpoints.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {endpoints.length === 0 ? "No endpoints registered" : "No endpoints match your search criteria"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>OS Version</TableHead>
                    <TableHead>Agent Version</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEndpoints.map((endpoint) => (
                    <TableRow key={endpoint.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(endpoint.status)}
                          <div>
                            <p className="font-medium">{endpoint.hostname}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {endpoint.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-sm">{endpoint.ip_address}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{endpoint.os_version}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          v{endpoint.agent_version}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(endpoint.status)}>
                          {endpoint.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(endpoint.last_seen).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewEndpointDetails(endpoint)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          {endpoint.status !== 'isolated' ? (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => isolateEndpoint(endpoint.hostname)}
                            >
                              <Lock className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {endpoints.filter(e => e.status === 'online').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Offline</p>
                <p className="text-2xl font-bold text-gray-500">
                  {endpoints.filter(e => e.status === 'offline').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Threats</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {endpoints.filter(e => e.status === 'threat_detected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Isolated</p>
                <p className="text-2xl font-bold text-red-600">
                  {endpoints.filter(e => e.status === 'isolated').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Endpoint Details - {selectedEndpoint?.hostname}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this endpoint
            </DialogDescription>
          </DialogHeader>
          
          {selectedEndpoint && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">System Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hostname:</span>
                      <span className="font-mono">{selectedEndpoint.hostname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono">{selectedEndpoint.ip_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">OS Version:</span>
                      <span>{selectedEndpoint.os_version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agent Version:</span>
                      <span>v{selectedEndpoint.agent_version}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Status Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusColor(selectedEndpoint.status)}>
                        {selectedEndpoint.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Seen:</span>
                      <span>{new Date(selectedEndpoint.last_seen).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime:</span>
                      <span>
                        {Math.floor((Date.now() - new Date(selectedEndpoint.last_seen).getTime()) / (1000 * 60 * 60))}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};