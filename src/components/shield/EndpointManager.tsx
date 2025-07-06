import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Monitor, 
  Shield, 
  Wifi, 
  WifiOff, 
  Lock, 
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Settings,
  MoreVertical,
  Eye,
  Power,
  RefreshCw,
  Filter,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Endpoint {
  id: string;
  hostname: string;
  ip_address: string;
  os_version: string;
  agent_version: string;
  status: 'online' | 'offline' | 'threat_detected' | 'isolated';
  last_seen: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  threats_count?: number;
  location?: string;
  department?: string;
}

interface EndpointManagerProps {
  endpoints: Endpoint[];
  onEndpointAction: () => void;
}

export const EndpointManager = ({ endpoints, onEndpointAction }: EndpointManagerProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'secondary';
      case 'threat_detected': return 'destructive';
      case 'isolated': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'offline': return <WifiOff className="h-4 w-4 text-gray-500" />;
      case 'threat_detected': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'isolated': return <Lock className="h-4 w-4 text-orange-600" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.ip_address.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || endpoint.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEndpointAction = async (action: string, endpointId: string, hostname: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const response = await supabase.functions.invoke('safe-shield-agent', {
        body: { 
          action: action,
          endpoint_id: endpointId,
          hostname: hostname,
          user_id: user.user.id
        }
      });

      if (response.error) throw response.error;

      toast({
        title: "Action Executed",
        description: `${action.replace('_', ' ')} completed for ${hostname}`,
      });

      onEndpointAction();
    } catch (error) {
      console.error('Error executing action:', error);
      toast({
        title: "Error",
        description: "Failed to execute action",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEndpoints.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select endpoints first",
        variant: "destructive",
      });
      return;
    }

    try {
      const promises = selectedEndpoints.map(endpointId => {
        const endpoint = endpoints.find(e => e.id === endpointId);
        return handleEndpointAction(action, endpointId, endpoint?.hostname || '');
      });

      await Promise.all(promises);
      setSelectedEndpoints([]);
      
      toast({
        title: "Bulk Action Completed",
        description: `${action.replace('_', ' ')} executed on ${selectedEndpoints.length} endpoints`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Some actions failed to execute",
        variant: "destructive",
      });
    }
  };

  const toggleEndpointSelection = (endpointId: string) => {
    setSelectedEndpoints(prev => 
      prev.includes(endpointId) 
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Monitor className="h-6 w-6" />
          Endpoint Manager
        </h2>
        <p className="text-muted-foreground">
          Monitor and manage protected endpoints across your organization
        </p>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="threat_detected">Threat Detected</SelectItem>
                <SelectItem value="isolated">Isolated</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={() => handleBulkAction('isolate_endpoint')}
              disabled={selectedEndpoints.length === 0}
            >
              <Lock className="h-4 w-4 mr-2" />
              Isolate Selected
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleBulkAction('release_isolation')}
              disabled={selectedEndpoints.length === 0}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Release Selected
            </Button>
          </div>
          
          {selectedEndpoints.length > 0 && (
            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {selectedEndpoints.length} endpoint(s) selected for bulk operations
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Endpoint Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {endpoints.filter(e => e.status === 'online').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Threats</p>
                <p className="text-2xl font-bold text-red-600">
                  {endpoints.filter(e => e.status === 'threat_detected').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Isolated</p>
                <p className="text-2xl font-bold text-orange-600">
                  {endpoints.filter(e => e.status === 'isolated').length}
                </p>
              </div>
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{endpoints.length}</p>
              </div>
              <Monitor className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Endpoints List */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEndpoints.length === 0 ? (
            <div className="text-center py-8">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No endpoints found matching your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEndpoints.map((endpoint) => (
                <Card key={endpoint.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedEndpoints.includes(endpoint.id)}
                          onChange={() => toggleEndpointSelection(endpoint.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Monitor className="h-5 w-5" />
                            <h3 className="font-medium">{endpoint.hostname}</h3>
                            <Badge variant={getStatusColor(endpoint.status)}>
                              {getStatusIcon(endpoint.status)}
                              <span className="ml-1">{endpoint.status.replace('_', ' ')}</span>
                            </Badge>
                            {endpoint.threats_count && endpoint.threats_count > 0 && (
                              <Badge variant="destructive">
                                {endpoint.threats_count} threats
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">IP Address:</span>
                              <span className="ml-2 font-mono">{endpoint.ip_address}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">OS:</span>
                              <span className="ml-2">{endpoint.os_version}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Agent:</span>
                              <span className="ml-2">{endpoint.agent_version}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Last Seen:</span>
                              <span className="ml-2">{new Date(endpoint.last_seen).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          {endpoint.cpu_usage && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">CPU:</span>
                                <span className="ml-2">{endpoint.cpu_usage}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Memory:</span>
                                <span className="ml-2">{endpoint.memory_usage}%</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Disk:</span>
                                <span className="ml-2">{endpoint.disk_usage}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEndpointAction('scan_endpoint', endpoint.id, endpoint.hostname)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Scan
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEndpointAction('restart_agent', endpoint.id, endpoint.hostname)}
                            >
                              <Power className="h-4 w-4 mr-2" />
                              Restart Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEndpointAction('update_agent', endpoint.id, endpoint.hostname)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Update Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEndpointAction('isolate_endpoint', endpoint.id, endpoint.hostname)}
                              className="text-red-600"
                            >
                              <Lock className="h-4 w-4 mr-2" />
                              Isolate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEndpointAction('release_isolation', endpoint.id, endpoint.hostname)}
                              className="text-green-600"
                            >
                              <Unlock className="h-4 w-4 mr-2" />
                              Release
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};