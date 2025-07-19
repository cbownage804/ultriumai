import { useState, useEffect } from "react";
import { useSafeNetData, SafeNetDevice } from "@/hooks/useSafeNetData";
import { AgentInstallationPanel } from "./AgentInstallationPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Monitor, 
  Server, 
  Smartphone, 
  Router, 
  Printer, 
  HardDrive,
  Wifi,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const getDeviceIcon = (deviceType: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'router':
    case 'gateway':
      return Router;
    case 'server':
      return Server;
    case 'workstation':
    case 'desktop':
    case 'laptop':
      return Monitor;
    case 'mobile':
    case 'phone':
      return Smartphone;
    case 'printer':
      return Printer;
    case 'storage':
    case 'nas':
      return HardDrive;
    case 'iot':
    case 'smart_device':
      return Wifi;
    default:
      return Monitor;
  }
};

export const DeviceManagementPanel = () => {
  const { devices, vulnerabilities, services, isLoading, refreshData } = useSafeNetData();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterManufacturer, setFilterManufacturer] = useState("all");
  const [filterOSFamily, setFilterOSFamily] = useState("all");
  const [filterDiscoveryMethod, setFilterDiscoveryMethod] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [historicalDevices, setHistoricalDevices] = useState<SafeNetDevice[]>([]);

  // Time filter options
  const timeFilters = [
    { value: "all", label: "All Time" },
    { value: "5m", label: "Last 5 minutes" },
    { value: "30m", label: "Last 30 minutes" },
    { value: "1h", label: "Last 1 hour" },
    { value: "6h", label: "Last 6 hours" },
    { value: "12h", label: "Last 12 hours" },
    { value: "24h", label: "Last 24 hours" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" }
  ];

  // Load historical devices based on time filter
  useEffect(() => {
    const loadHistoricalDevices = async () => {
      if (historyFilter === "all") {
        setHistoricalDevices(devices);
        return;
      }

      let timeQuery = new Date();
      switch (historyFilter) {
        case "5m":
          timeQuery.setMinutes(timeQuery.getMinutes() - 5);
          break;
        case "30m":
          timeQuery.setMinutes(timeQuery.getMinutes() - 30);
          break;
        case "1h":
          timeQuery.setHours(timeQuery.getHours() - 1);
          break;
        case "6h":
          timeQuery.setHours(timeQuery.getHours() - 6);
          break;
        case "12h":
          timeQuery.setHours(timeQuery.getHours() - 12);
          break;
        case "24h":
          timeQuery.setDate(timeQuery.getDate() - 1);
          break;
        case "7d":
          timeQuery.setDate(timeQuery.getDate() - 7);
          break;
        case "30d":
          timeQuery.setDate(timeQuery.getDate() - 30);
          break;
      }

      try {
        const { data: historicalData, error } = await supabase
          .from('safenet_devices')
          .select('*')
          .gte('last_seen_at', timeQuery.toISOString())
          .order('last_seen_at', { ascending: false });

        if (error) {
          console.error('Error fetching historical devices:', error);
          setHistoricalDevices(devices);
        } else {
          // Combine current devices with historical ones, removing duplicates
          const combinedDevices = [...devices];
          historicalData?.forEach(historical => {
            if (!combinedDevices.find(d => String(d.ip_address) === String(historical.ip_address))) {
              combinedDevices.push(historical as any);
            }
          });
          setHistoricalDevices(combinedDevices);
        }
      } catch (error) {
        console.error('Error loading historical devices:', error);
        setHistoricalDevices(devices);
      }
    };

    loadHistoricalDevices();
  }, [historyFilter, devices]);

  const getDeviceVulnerabilities = (deviceId: string) => {
    return vulnerabilities.filter(v => v.device_id === deviceId);
  };

  const getDeviceServices = (deviceId: string) => {
    return services.filter(s => s.device_id === deviceId);
  };

  const filteredDevices = historicalDevices.filter(device => {
    const matchesSearch = !searchTerm || 
      device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(device.ip_address)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || device.device_type === filterType;
    const matchesStatus = filterStatus === "all" || device.status === filterStatus;
    const matchesManufacturer = filterManufacturer === "all" || device.manufacturer === filterManufacturer;
    const matchesOSFamily = filterOSFamily === "all" || device.os_family === filterOSFamily;
    const matchesDiscoveryMethod = filterDiscoveryMethod === "all" || 
      (device.discovery_method && device.discovery_method.includes(filterDiscoveryMethod));
    
    return matchesSearch && matchesType && matchesStatus && matchesManufacturer && matchesOSFamily && matchesDiscoveryMethod;
  });

  const deviceTypes = [...new Set(historicalDevices.map(d => d.device_type).filter(Boolean))];
  const manufacturers = [...new Set(historicalDevices.map(d => d.manufacturer).filter(Boolean))];
  const osFamilies = [...new Set(historicalDevices.map(d => d.os_family).filter(Boolean))];
  const discoveryMethods = [...new Set(historicalDevices.flatMap(d => d.discovery_method || []).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices by hostname, IP, MAC, manufacturer, model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Device Type" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="all">All Types</SelectItem>
              {deviceTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterManufacturer} onValueChange={setFilterManufacturer}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Manufacturer" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="all">All Manufacturers</SelectItem>
              {manufacturers.map(manufacturer => (
                <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOSFamily} onValueChange={setFilterOSFamily}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="OS Family" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="all">All OS</SelectItem>
              {osFamilies.map(os => (
                <SelectItem key={os} value={os}>{os}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterDiscoveryMethod} onValueChange={setFilterDiscoveryMethod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Discovery Method" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              <SelectItem value="all">All Methods</SelectItem>
              {discoveryMethods.map(method => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={historyFilter} onValueChange={setHistoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50">
              {timeFilters.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    {filter.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Device Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Vulnerabilities</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device) => {
              const Icon = getDeviceIcon(device.device_type);
              const deviceVulns = getDeviceVulnerabilities(device.id);
              const deviceServices = getDeviceServices(device.id);
              const criticalVulns = deviceVulns.filter(v => v.severity === 'critical').length;

              return (
                <TableRow 
                  key={device.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    setSelectedDevice(selectedDevice === device.id ? null : device.id);
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {device.device_name || 'Unknown Device'}
                        </div>
                        {device.mac_address && (
                          <div className="text-sm text-muted-foreground">
                            {device.mac_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {device.device_type || 'Unknown'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {device.status === 'online' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                        {device.status}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell className="font-mono text-sm">
                    {String(device.ip_address)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {criticalVulns > 0 && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      <Badge variant={deviceVulns.length > 0 ? "destructive" : "default"}>
                        {deviceVulns.length}
                      </Badge>
                      {criticalVulns > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {criticalVulns} critical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {deviceServices.length} services
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span>
                        {device.last_seen_at 
                          ? new Date(device.last_seen_at).toLocaleString()
                          : 'Never'
                        }
                      </span>
                      {/* Show if device is currently offline but was seen recently */}
                      {device.status === 'offline' && device.last_seen_at && (
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          Historical
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Device Details Panel */}
      {selectedDevice && (
        <Card>
          <CardHeader>
            <CardTitle>Device Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const device = historicalDevices.find(d => d.id === selectedDevice);
              const deviceVulns = getDeviceVulnerabilities(selectedDevice);
              const deviceServices = getDeviceServices(selectedDevice);
              
              if (!device) return null;

              return (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="services">Services ({deviceServices.length})</TabsTrigger>
                    <TabsTrigger value="vulnerabilities">Vulnerabilities ({deviceVulns.length})</TabsTrigger>
                    <TabsTrigger value="agent">Agent Installation</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium">Device Name</label>
                        <p className="text-sm text-muted-foreground">
                          {device.device_name || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">IP Address</label>
                        <p className="text-sm text-muted-foreground font-mono">
                          {String(device.ip_address)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">MAC Address</label>
                        <p className="text-sm text-muted-foreground font-mono">
                          {device.mac_address || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Device Type</label>
                        <p className="text-sm text-muted-foreground">
                          {device.device_type || 'Unknown'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Manufacturer</label>
                        <p className="text-sm text-muted-foreground">
                          {device.manufacturer || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Model</label>
                        <p className="text-sm text-muted-foreground">
                          {device.model || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Security Patches</label>
                        <p className="text-sm text-muted-foreground">
                          {device.security_patches_needed || 0} needed
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">OS Version</label>
                        <p className="text-sm text-muted-foreground">
                          {device.os_version || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="services">
                    <div className="space-y-2">
                      {deviceServices.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Port</TableHead>
                              <TableHead>Protocol</TableHead>
                              <TableHead>Service</TableHead>
                              <TableHead>Version</TableHead>
                              <TableHead>State</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deviceServices.map((service) => (
                              <TableRow key={service.id}>
                                <TableCell className="font-mono">{service.port}</TableCell>
                                <TableCell>{service.protocol.toUpperCase()}</TableCell>
                                <TableCell>{service.service_name || 'Unknown'}</TableCell>
                                <TableCell>{service.service_version || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge variant={service.service_state === 'open' ? 'default' : 'secondary'}>
                                    {service.service_state}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No services detected on this device
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="vulnerabilities">
                    <div className="space-y-2">
                      {deviceVulns.length > 0 ? (
                        <div className="space-y-3">
                          {deviceVulns.map((vuln) => (
                            <Card key={vuln.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={
                                        vuln.severity === 'critical' ? 'destructive' :
                                        vuln.severity === 'high' ? 'destructive' :
                                        vuln.severity === 'medium' ? 'default' : 'secondary'
                                      }>
                                        {vuln.severity}
                                      </Badge>
                                      {vuln.cve_id && (
                                        <Badge variant="outline">{vuln.cve_id}</Badge>
                                      )}
                                    </div>
                                    <h4 className="font-medium">{vuln.title}</h4>
                                    {vuln.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {vuln.description}
                                      </p>
                                    )}
                                    {vuln.solution && (
                                      <div className="mt-2">
                                        <label className="text-sm font-medium">Solution:</label>
                                        <p className="text-sm text-muted-foreground">
                                          {vuln.solution}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  {vuln.cvss_score && (
                                    <Badge variant="outline">
                                      CVSS: {vuln.cvss_score}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No vulnerabilities found on this device
                        </p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="agent">
                    <AgentInstallationPanel 
                      selectedDevice={device}
                      connectorKey={device.connector_key || 'sk-safenet-demo-default'}
                    />
                  </TabsContent>
                </Tabs>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {filteredDevices.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No devices found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? "Try adjusting your search filters"
              : "Start by running a network scan to discover devices"
            }
          </p>
        </div>
      )}
    </div>
  );
};