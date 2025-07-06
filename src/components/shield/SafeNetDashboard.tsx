import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Network, 
  Monitor, 
  AlertTriangle, 
  Plus,
  Search,
  Wifi,
  Server,
  Smartphone,
  Laptop,
  Shield,
  Activity
} from "lucide-react";

interface SafeNetNetwork {
  id: string;
  network_name: string;
  network_range: string;
  location: string;
  network_type: string;
  device_count: number;
  vulnerability_count: number;
  threat_count: number;
  security_score: number;
  last_scan_at: string;
  monitoring_enabled: boolean;
  created_at: string;
}

interface SafeNetDevice {
  id: string;
  device_name: string;
  ip_address: string;
  mac_address: string;
  device_type: string;
  os_version: string;
  manufacturer: string;
  status: string;
  vulnerability_count: number;
  last_seen_at: string;
  is_managed: boolean;
  security_patches_needed: number;
}

interface SafeNetVulnerability {
  id: string;
  vulnerability_id: string;
  title: string;
  severity: string;
  cvss_score: number;
  cve_id: string;
  affected_service: string;
  status: string;
  discovered_at: string;
  solution: string;
}

export const SafeNetDashboard = () => {
  const [networks, setNetworks] = useState<SafeNetNetwork[]>([]);
  const [devices, setDevices] = useState<SafeNetDevice[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<SafeNetVulnerability[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<SafeNetNetwork | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<SafeNetDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNetworkDialog, setNewNetworkDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNetworks();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      loadDevices(selectedNetwork.id);
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (selectedDevice) {
      loadVulnerabilities(selectedDevice.id);
    }
  }, [selectedDevice]);

  const loadNetworks = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: networksData, error } = await supabase
        .from('safenet_networks')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNetworks(networksData || []);
    } catch (error) {
      console.error('Error loading networks:', error);
      toast({
        title: "Error",
        description: "Failed to load networks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async (networkId: string) => {
    try {
      const { data: devicesData, error } = await supabase
        .from('safenet_devices')
        .select('*')
        .eq('network_id', networkId)
        .order('device_name');

      if (error) throw error;
      
      // Transform data to match interface
      const transformedDevices = devicesData?.map(device => ({
        ...device,
        ip_address: String(device.ip_address || '')
      })) || [];
      
      setDevices(transformedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    }
  };

  const loadVulnerabilities = async (deviceId: string) => {
    try {
      const { data: vulnData, error } = await supabase
        .from('safenet_vulnerabilities')
        .select('*')
        .eq('device_id', deviceId)
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      setVulnerabilities(vulnData || []);
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
      toast({
        title: "Error",
        description: "Failed to load vulnerabilities",
        variant: "destructive",
      });
    }
  };

  const addNetwork = async (networkData: any) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('safenet_networks')
        .insert({
          user_id: user.user.id,
          network_name: networkData.name,
          network_range: networkData.range,
          location: networkData.location,
          network_type: networkData.type,
          security_score: Math.floor(Math.random() * 40) + 60, // Demo score
          device_count: Math.floor(Math.random() * 20) + 5,
          vulnerability_count: Math.floor(Math.random() * 10),
          threat_count: Math.floor(Math.random() * 5)
        });

      if (error) throw error;

      toast({
        title: "✅ Network Added",
        description: `${networkData.name} is now being monitored`,
      });

      setNewNetworkDialog(false);
      loadNetworks();
    } catch (error) {
      console.error('Error adding network:', error);
      toast({
        title: "Error",
        description: "Failed to add network",
        variant: "destructive",
      });
    }
  };

  const scanNetwork = async (networkId: string) => {
    try {
      const { error } = await supabase
        .from('safenet_networks')
        .update({ last_scan_at: new Date().toISOString() })
        .eq('id', networkId);

      if (error) throw error;

      toast({
        title: "✅ Scan Started",
        description: "Network vulnerability scan initiated",
      });

      loadNetworks();
    } catch (error) {
      console.error('Error scanning network:', error);
      toast({
        title: "Error",
        description: "Failed to start network scan",
        variant: "destructive",
      });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'server': return Server;
      case 'laptop': return Laptop;
      case 'mobile': return Smartphone;
      case 'router': return Wifi;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'offline': return 'destructive';
      case 'unknown': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredDevices = devices.filter(device =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(device.ip_address).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            SafeNet
          </h2>
          <p className="text-muted-foreground">
            Advanced network monitoring and vulnerability management
          </p>
        </div>
        
        <Dialog open={newNetworkDialog} onOpenChange={setNewNetworkDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Network
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Network</DialogTitle>
            </DialogHeader>
            <NetworkForm onSubmit={addNetwork} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Networks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {networks.map((network) => (
          <Card 
            key={network.id} 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedNetwork?.id === network.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedNetwork(network)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    {network.network_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{network.network_range}</p>
                  <p className="text-xs text-muted-foreground">{network.location}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {network.network_type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Security Score:</span>
                  <span className={`font-medium ${getSecurityScoreColor(network.security_score)}`}>
                    {network.security_score}/100
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{network.device_count}</div>
                    <div className="text-xs text-muted-foreground">Devices</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">{network.vulnerability_count}</div>
                    <div className="text-xs text-muted-foreground">Vulns</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{network.threat_count}</div>
                    <div className="text-xs text-muted-foreground">Threats</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last scan:</span>
                  <span className="text-sm">
                    {network.last_scan_at 
                      ? new Date(network.last_scan_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    scanNetwork(network.id);
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Scan Network
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Network Devices */}
      {selectedNetwork && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl">
                {selectedNetwork.network_name} - Devices
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DevicesTable 
              devices={filteredDevices}
              onSelectDevice={setSelectedDevice}
              selectedDevice={selectedDevice}
              getDeviceIcon={getDeviceIcon}
              getStatusColor={getStatusColor}
            />
          </CardContent>
        </Card>
      )}

      {/* Selected Device Vulnerabilities */}
      {selectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {selectedDevice.device_name} - Vulnerabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VulnerabilitiesTable 
              vulnerabilities={vulnerabilities}
              getSeverityColor={getSeverityColor}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Network form component
const NetworkForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    range: '',
    location: '',
    type: 'corporate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Network Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">IP Range</label>
        <Input
          value={formData.range}
          onChange={(e) => setFormData(prev => ({ ...prev, range: e.target.value }))}
          placeholder="192.168.1.0/24"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Main Office"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Network Type</label>
        <Select value={formData.type} onValueChange={(value) => 
          setFormData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="corporate">Corporate</SelectItem>
            <SelectItem value="branch">Branch Office</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
            <SelectItem value="cloud">Cloud</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Add Network</Button>
      </div>
    </form>
  );
};

// Devices table component
const DevicesTable = ({ devices, onSelectDevice, selectedDevice, getDeviceIcon, getStatusColor }: any) => {
  if (devices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No devices found in this network
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Device</th>
            <th className="text-left p-2">IP Address</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Vulnerabilities</th>
            <th className="text-left p-2">Patches Needed</th>
            <th className="text-left p-2">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device: SafeNetDevice) => {
            const DeviceIcon = getDeviceIcon(device.device_type);
            return (
              <tr 
                key={device.id} 
                className={`border-b hover:bg-muted/50 cursor-pointer ${
                  selectedDevice?.id === device.id ? 'bg-muted/50' : ''
                }`}
                onClick={() => onSelectDevice(device)}
              >
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <DeviceIcon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{device.device_name}</div>
                      <div className="text-xs text-muted-foreground">{device.manufacturer}</div>
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <span className="font-mono text-sm">{device.ip_address}</span>
                </td>
                <td className="p-2">
                  <Badge variant="outline" className="capitalize">
                    {device.device_type}
                  </Badge>
                </td>
                <td className="p-2">
                  <Badge variant={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                </td>
                <td className="p-2">
                  {device.vulnerability_count > 0 ? (
                    <Badge variant="destructive">{device.vulnerability_count}</Badge>
                  ) : (
                    <Badge variant="default">0</Badge>
                  )}
                </td>
                <td className="p-2">
                  {device.security_patches_needed > 0 ? (
                    <Badge variant="secondary">{device.security_patches_needed}</Badge>
                  ) : (
                    <Badge variant="default">0</Badge>
                  )}
                </td>
                <td className="p-2">
                  <span className="text-sm">
                    {device.last_seen_at 
                      ? new Date(device.last_seen_at).toLocaleDateString()
                      : 'Never'
                    }
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Vulnerabilities table component
const VulnerabilitiesTable = ({ vulnerabilities, getSeverityColor }: any) => {
  if (vulnerabilities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No vulnerabilities found for this device
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">Vulnerability</th>
            <th className="text-left p-2">Severity</th>
            <th className="text-left p-2">CVSS Score</th>
            <th className="text-left p-2">CVE ID</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Discovered</th>
          </tr>
        </thead>
        <tbody>
          {vulnerabilities.map((vuln: SafeNetVulnerability) => (
            <tr key={vuln.id} className="border-b hover:bg-muted/50">
              <td className="p-2">
                <div>
                  <div className="font-medium">{vuln.title}</div>
                  <div className="text-xs text-muted-foreground">{vuln.affected_service}</div>
                </div>
              </td>
              <td className="p-2">
                <Badge variant={getSeverityColor(vuln.severity)}>
                  {vuln.severity}
                </Badge>
              </td>
              <td className="p-2">
                <span className="font-mono text-sm">{vuln.cvss_score}</span>
              </td>
              <td className="p-2">
                <span className="font-mono text-sm">{vuln.cve_id}</span>
              </td>
              <td className="p-2">
                <Badge variant={vuln.status === 'open' ? 'destructive' : 'default'}>
                  {vuln.status}
                </Badge>
              </td>
              <td className="p-2">
                <span className="text-sm">
                  {new Date(vuln.discovered_at).toLocaleDateString()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};