import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NetworkTopologyViewer } from "./NetworkTopologyViewer";
import { DeviceManagementPanel } from "./DeviceManagementPanel";
import { VulnerabilityDashboard } from "./VulnerabilityDashboard";
import { EnhancedDeviceCard } from "./EnhancedDeviceCard";
import { NetworkStatistics } from "./NetworkStatistics";
import { RealTimeMonitor } from "./RealTimeMonitor";
import { useSafeNetData } from "@/hooks/useSafeNetData";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Network, AlertTriangle, Activity, Search, Filter, RefreshCw, Upload, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const SafeNetDashboard = () => {
  const { devices, vulnerabilities, isLoading } = useSafeNetData();
  
  // Debug logging
  console.log('SafeNet Dashboard - devices:', devices);
  console.log('SafeNet Dashboard - isLoading:', isLoading);
  console.log('SafeNet Dashboard - devices length:', devices?.length);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [organizationKey, setOrganizationKey] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [uploadedAgents, setUploadedAgents] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Generate or retrieve organization key for this user
    let storedKey = localStorage.getItem('safenet_organization_key');
    if (!storedKey) {
      storedKey = `sk-safenet-${user?.id?.slice(0, 8) || 'demo'}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('safenet_organization_key', storedKey);
    }
    setOrganizationKey(storedKey);
    loadUploadedAgents();
  }, [user]);

  const loadUploadedAgents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('rmm-agents')
        .list(`${user.id}/`, { limit: 100 });

      if (error) throw error;
      setUploadedAgents(data || []);
    } catch (error) {
      console.error('Error loading uploaded agents:', error);
    }
  };

  const handleAgentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.name.endsWith('.msi') && !file.name.endsWith('.exe')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an MSI or EXE file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error } = await supabase.storage
        .from('rmm-agents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      toast({
        title: "Upload Successful",
        description: `${file.name} has been uploaded successfully.`
      });

      loadUploadedAgents();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleAgentDownload = async (fileName: string, originalName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('rmm-agents')
        .download(fileName);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the agent.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAgent = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('rmm-agents')
        .remove([fileName]);

      if (error) throw error;

      toast({
        title: "File Deleted",
        description: "Agent file has been deleted successfully."
      });

      loadUploadedAgents();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the agent file.",
        variant: "destructive"
      });
    }
  };

  // Filter devices based on search and filters
  const filteredDevices = devices.filter(device => {
    const matchesSearch = !searchQuery || 
      (device.device_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (device.hostname?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (String(device.ip_address || '').toLowerCase().includes(searchQuery.toLowerCase())) ||
      (device.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
    const matchesType = filterType === 'all' || device.device_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDownload = async (platform: string, filename: string) => {
    try {
      const response = await fetch(`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/${platform}?agentId=${organizationKey}`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
  const onlineDevices = filteredDevices.filter(d => d.status === 'online').length;
  const managedDevices = filteredDevices.filter(d => d.is_managed).length;
  
  // Get unique device types for filter
  const deviceTypes = [...new Set(devices.map(d => d.device_type).filter(Boolean))];
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SafeNet Dashboard</h1>
          <p className="text-muted-foreground">Network topology and security monitoring</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant={isRealTimeActive ? 'default' : 'secondary'} className="text-sm px-3 py-1">
            <Activity className={`h-4 w-4 mr-1 ${isRealTimeActive ? 'animate-pulse' : ''}`} />
            {isRealTimeActive ? 'Live Monitoring' : 'Monitoring Paused'}
          </Badge>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              {onlineDevices} online, {filteredDevices.length - onlineDevices} offline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalVulns}</div>
            <p className="text-xs text-muted-foreground">
              {highVulns} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Connections</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Active topology mappings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Management</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.round((managedDevices / Math.max(filteredDevices.length, 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {managedDevices} of {filteredDevices.length} managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.max(0, 100 - (criticalVulns * 10 + highVulns * 5))}%
            </div>
            <p className="text-xs text-muted-foreground">
              Network security health
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="topology">Network Map</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Security</TabsTrigger>
          <TabsTrigger value="connector">Connector</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Recent Devices with Search and Filters */}
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Network Devices</CardTitle>
                  <Badge variant="outline">{filteredDevices.length} devices</Badge>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search devices, IPs, or manufacturers..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {deviceTypes.map(type => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {filteredDevices.slice(0, 8).map((device, index) => (
                    <EnhancedDeviceCard
                      key={device.id || index}
                      device={{
                        ...device,
                        vulnerability_count: device.vulnerability_count || 0,
                        is_critical: device.is_critical || false
                      } as any}
                      onClick={() => setActiveTab('devices')}
                    />
                  ))}
                  
                  {filteredDevices.length === 0 && (
                    <div className="text-center py-8">
                      <Network className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
                          ? 'No devices match your filters' 
                          : 'No devices discovered yet'
                        }
                      </p>
                      {(!searchQuery && filterStatus === 'all' && filterType === 'all') && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Run the SafeNet connector to discover devices
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Real-Time Activity Monitor */}
            <RealTimeMonitor 
              isActive={isRealTimeActive}
              onToggle={setIsRealTimeActive}
            />
          </div>
          
          {/* Network Scan History - Temporarily disabled until networkScans data is available */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Network Scans</CardTitle>
              <CardDescription>Latest scan results and discovery activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No scan history available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Download and run the SafeNet connector to start scanning
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <NetworkStatistics devices={devices as any} />
        </TabsContent>

        <TabsContent value="topology">
          <Card>
            <CardHeader>
              <CardTitle>Network Topology Map</CardTitle>
              <CardDescription>Interactive network visualization and device relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <NetworkTopologyViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Management</CardTitle>
              <CardDescription>Monitor and manage all discovered network devices</CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceManagementPanel />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities">
          <Card>
            <CardHeader>
              <CardTitle>Security Dashboard</CardTitle>
              <CardDescription>Vulnerability management and threat monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <VulnerabilityDashboard />
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="connector">
          <Card>
            <CardHeader>
              <CardTitle>SafeNet Connector Management</CardTitle>
              <CardDescription>Download and configure the SafeNet network scanner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Download Connector</h3>
                  <p className="text-sm text-muted-foreground">
                    Download the SafeNet connector to start monitoring your network infrastructure.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/python?agentId=${organizationKey}`} 
                      download="safenet_connector.py"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Python Script
                    </a>
                    <button 
                      onClick={() => handleDownload('powershell', 'safenet-installer.ps1')}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      PowerShell Script
                    </button>
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/linux?agentId=${organizationKey}`} 
                      download="safenet_connector"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      Linux Binary
                    </a>
                    <a 
                      href={`https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/safenet-connector-download/macos?agentId=${organizationKey}`} 
                      download="safenet_connector.app"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      macOS App
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Connection Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Main Office</span>
                      </div>
                      <Badge variant="secondary">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Branch Office</span>
                      </div>
                      <Badge variant="outline">Connecting</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Remote Site</span>
                      </div>
                      <Badge variant="destructive">Offline</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* RMM Agent Management Section */}
              <div className="border-t pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">RMM Agent Management</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your RMM agent MSI/EXE files to distribute via the PowerShell installer.
                  </p>

                  {/* Upload Section */}
                  <div className="bg-muted p-4 rounded-lg space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".msi,.exe"
                        onChange={handleAgentUpload}
                        className="hidden"
                        id="agent-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="agent-upload"
                        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload RMM Agent'}
                      </label>
                      <span className="text-sm text-muted-foreground">
                        Supported formats: .msi, .exe
                      </span>
                    </div>

                    {/* Uploaded Agents List */}
                    {uploadedAgents.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Uploaded Agents</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {uploadedAgents.map((agent, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{agent.name.split('-').slice(1).join('-')}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(agent.metadata?.size ? (agent.metadata.size / 1024 / 1024).toFixed(1) : '0')} MB
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAgentDownload(agent.name, agent.name.split('-').slice(1).join('-'))}
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteAgent(agent.name)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  ✕
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PowerShell Script Download */}
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                          Enhanced PowerShell RMM Agent
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Download the comprehensive PowerShell script that includes system monitoring, security checks, and remote management.
                        </p>
                      </div>
                      <a
                        href="/UltriumRMMAgent.ps1"
                        download="UltriumRMMAgent.ps1"
                        className="ml-4 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PS1
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Installation Instructions</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">1. Download the connector for your operating system</p>
                  <p className="text-sm font-medium">2. Run the installer with administrator privileges</p>
                  <p className="text-sm font-medium">3. Enter your organization key when prompted</p>
                  <p className="text-sm font-medium">4. Configure network scanning preferences</p>
                  <p className="text-sm font-medium">5. Start the service and verify connection</p>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Organization Key:</strong> {organizationKey}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Use this key during connector installation to link it to your account.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newKey = `sk-safenet-${user?.id?.slice(0, 8) || 'demo'}-${Math.random().toString(36).substring(2, 8)}`;
                        localStorage.setItem('safenet_organization_key', newKey);
                        setOrganizationKey(newKey);
                      }}
                      className="ml-4"
                    >
                      Generate New Key
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};