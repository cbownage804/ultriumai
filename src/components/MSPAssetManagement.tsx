import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Laptop, 
  Server, 
  Monitor, 
  Smartphone,
  Router,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Search,
  Plus,
  Download,
  Upload,
  Settings,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  Users,
  Building2,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  name: string;
  type: 'laptop' | 'desktop' | 'server' | 'mobile' | 'network' | 'printer' | 'other';
  client_id: string;
  client_name: string;
  location: string;
  ip_address?: string;
  mac_address?: string;
  serial_number?: string;
  manufacturer: string;
  model: string;
  os: string;
  os_version: string;
  status: 'online' | 'offline' | 'maintenance' | 'decommissioned';
  security_status: 'secure' | 'at_risk' | 'vulnerable' | 'critical';
  last_seen: string;
  installed_software: string[];
  vulnerabilities: number;
  compliance_score: number;
  assigned_user?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  cost?: number;
}

interface SoftwareAsset {
  id: string;
  name: string;
  version: string;
  vendor: string;
  license_type: 'perpetual' | 'subscription' | 'free' | 'trial';
  licenses_total: number;
  licenses_used: number;
  cost_per_license: number;
  renewal_date?: string;
  installations: { asset_id: string; asset_name: string; installed_date: string }[];
}

const assetIcons = {
  laptop: Laptop,
  desktop: Monitor,
  server: Server,
  mobile: Smartphone,
  network: Router,
  printer: Activity,
  other: Activity
};

const statusColors = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  decommissioned: 'bg-red-100 text-red-800'
};

const securityColors = {
  secure: 'bg-green-100 text-green-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
  vulnerable: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

export const MSPAssetManagement = () => {
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [software, setSoftware] = useState<SoftwareAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');

  useEffect(() => {
    // Mock data
    setAssets([
      {
        id: '1',
        name: 'CEO-LAPTOP-001',
        type: 'laptop',
        client_id: 'client-1',
        client_name: 'Acme Corp',
        location: 'New York Office',
        ip_address: '192.168.1.101',
        mac_address: '00:1B:44:11:3A:B7',
        serial_number: 'AC123456789',
        manufacturer: 'Dell',
        model: 'Latitude 7420',
        os: 'Windows',
        os_version: '11 Pro',
        status: 'online',
        security_status: 'secure',
        last_seen: new Date().toISOString(),
        installed_software: ['Microsoft Office 365', 'Adobe Acrobat', 'Chrome'],
        vulnerabilities: 0,
        compliance_score: 95,
        assigned_user: 'John Smith',
        purchase_date: '2023-03-15',
        warranty_expiry: '2026-03-15',
        cost: 1500
      },
      {
        id: '2',
        name: 'MAIN-SERVER-001',
        type: 'server',
        client_id: 'client-1',
        client_name: 'Acme Corp',
        location: 'Data Center',
        ip_address: '192.168.1.10',
        mac_address: '00:1B:44:11:3A:C8',
        serial_number: 'SRV987654321',
        manufacturer: 'HPE',
        model: 'ProLiant DL380',
        os: 'Windows Server',
        os_version: '2022 Standard',
        status: 'online',
        security_status: 'at_risk',
        last_seen: new Date().toISOString(),
        installed_software: ['IIS', 'SQL Server', 'Antivirus'],
        vulnerabilities: 3,
        compliance_score: 78,
        purchase_date: '2022-01-10',
        warranty_expiry: '2025-01-10',
        cost: 8500
      },
      {
        id: '3',
        name: 'OFFICE-PC-015',
        type: 'desktop',
        client_id: 'client-2',
        client_name: 'TechStart LLC',
        location: 'Austin Office',
        ip_address: '10.0.1.45',
        mac_address: '00:1B:44:11:3A:D9',
        serial_number: 'PC456789123',
        manufacturer: 'HP',
        model: 'EliteDesk 800',
        os: 'Windows',
        os_version: '10 Pro',
        status: 'offline',
        security_status: 'vulnerable',
        last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        installed_software: ['Microsoft Office', 'AutoCAD', 'Chrome'],
        vulnerabilities: 7,
        compliance_score: 62,
        assigned_user: 'Sarah Johnson',
        purchase_date: '2021-11-20',
        warranty_expiry: '2024-11-20',
        cost: 1200
      }
    ]);

    setSoftware([
      {
        id: '1',
        name: 'Microsoft Office 365',
        version: 'Business Premium',
        vendor: 'Microsoft',
        license_type: 'subscription',
        licenses_total: 50,
        licenses_used: 42,
        cost_per_license: 22,
        renewal_date: '2024-12-31',
        installations: [
          { asset_id: '1', asset_name: 'CEO-LAPTOP-001', installed_date: '2023-03-15' },
          { asset_id: '3', asset_name: 'OFFICE-PC-015', installed_date: '2021-11-20' }
        ]
      },
      {
        id: '2',
        name: 'Adobe Creative Suite',
        version: 'CC 2024',
        vendor: 'Adobe',
        license_type: 'subscription',
        licenses_total: 10,
        licenses_used: 8,
        cost_per_license: 79.99,
        renewal_date: '2024-08-15',
        installations: [
          { asset_id: '1', asset_name: 'CEO-LAPTOP-001', installed_date: '2023-03-15' }
        ]
      }
    ]);
  }, []);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assigned_user?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesClient = filterClient === 'all' || asset.client_id === filterClient;
    
    return matchesSearch && matchesType && matchesClient;
  });

  const handleDiscoverAssets = () => {
    toast({
      title: "Asset Discovery Started",
      description: "Network scan initiated to discover new assets across all client networks.",
    });
  };

  const handleExportInventory = () => {
    toast({
      title: "Inventory Exported",
      description: "Complete asset inventory has been exported to CSV format.",
    });
  };

  const getAssetIcon = (type: Asset['type']) => {
    const Icon = assetIcons[type];
    return <Icon className="h-4 w-4" />;
  };

  const calculateTotalValue = () => {
    return assets.reduce((sum, asset) => sum + (asset.cost || 0), 0);
  };

  const getSecurityRiskCount = () => {
    return assets.filter(asset => asset.security_status === 'vulnerable' || asset.security_status === 'critical').length;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="h-8 w-8 text-primary" />
            Asset Management
          </h1>
          <p className="text-muted-foreground">
            Comprehensive IT asset tracking and lifecycle management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDiscoverAssets}>
            <Search className="h-4 w-4 mr-2" />
            Discover Assets
          </Button>
          <Button variant="outline" onClick={handleExportInventory}>
            <Download className="h-4 w-4 mr-2" />
            Export Inventory
          </Button>
          <Button variant="hero">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{getSecurityRiskCount()}</div>
            <p className="text-xs text-muted-foreground">Assets requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${calculateTotalValue().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Hardware investment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Assets</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {assets.filter(a => a.status === 'online').length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hardware" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hardware">Hardware Assets</TabsTrigger>
          <TabsTrigger value="software">Software Licenses</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Tracking</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="hardware" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Assets</Label>
              <Input
                id="search"
                placeholder="Search by name, client, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type-filter">Asset Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="type-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="laptop">Laptops</SelectItem>
                  <SelectItem value="desktop">Desktops</SelectItem>
                  <SelectItem value="server">Servers</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-filter">Client</Label>
              <Select value={filterClient} onValueChange={setFilterClient}>
                <SelectTrigger id="client-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="client-1">Acme Corp</SelectItem>
                  <SelectItem value="client-2">TechStart LLC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assets List */}
          <div className="space-y-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <Badge className={statusColors[asset.status]}>
                            {asset.status}
                          </Badge>
                          <Badge className={securityColors[asset.security_status]}>
                            {asset.security_status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {asset.client_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {asset.assigned_user || 'Unassigned'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last seen: {new Date(asset.last_seen).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Hardware:</span> {asset.manufacturer} {asset.model}
                    </div>
                    <div>
                      <span className="font-medium">OS:</span> {asset.os} {asset.os_version}
                    </div>
                    <div>
                      <span className="font-medium">IP Address:</span> {asset.ip_address || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {asset.location}
                    </div>
                    <div>
                      <span className="font-medium">Vulnerabilities:</span> 
                      <span className={asset.vulnerabilities > 0 ? 'text-red-500 ml-1' : 'text-green-500 ml-1'}>
                        {asset.vulnerabilities}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Compliance:</span> 
                      <span className="ml-1">{asset.compliance_score}%</span>
                    </div>
                    <div>
                      <span className="font-medium">Purchase Date:</span> {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Warranty:</span> {asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                  
                  {asset.installed_software.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Installed Software:</p>
                      <div className="flex flex-wrap gap-1">
                        {asset.installed_software.map((software, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {software}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="software" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Software License Management</h3>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add License
            </Button>
          </div>

          <div className="space-y-4">
            {software.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base">{item.name}</CardTitle>
                      <CardDescription>{item.vendor} • {item.version}</CardDescription>
                    </div>
                    <Badge variant={item.license_type === 'subscription' ? 'default' : 'secondary'}>
                      {item.license_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Licenses Used:</span> {item.licenses_used}/{item.licenses_total}
                      </div>
                      <div>
                        <span className="font-medium">Cost per License:</span> ${item.cost_per_license}
                      </div>
                      <div>
                        <span className="font-medium">Total Cost:</span> ${(item.licenses_total * item.cost_per_license).toFixed(2)}
                      </div>
                      {item.renewal_date && (
                        <div>
                          <span className="font-medium">Renewal:</span> {new Date(item.renewal_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Installations ({item.installations.length}):</p>
                      <div className="space-y-1">
                        {item.installations.slice(0, 3).map((installation, index) => (
                          <div key={index} className="text-xs text-muted-foreground">
                            {installation.asset_name} • Installed: {new Date(installation.installed_date).toLocaleDateString()}
                          </div>
                        ))}
                        {item.installations.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{item.installations.length - 3} more installations
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Track compliance status across all managed assets including patch levels, security configurations, and policy adherence.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="reports">
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Generate comprehensive reports on asset utilization, security posture, and compliance metrics.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};