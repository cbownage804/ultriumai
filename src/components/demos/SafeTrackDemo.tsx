import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Package, 
  Laptop, 
  Server, 
  Monitor, 
  Smartphone,
  Search,
  Plus,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Wrench,
  Filter
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'laptop' | 'desktop' | 'server' | 'monitor' | 'phone' | 'other';
  serialNumber: string;
  assignedTo: string;
  location: string;
  status: 'active' | 'maintenance' | 'retired' | 'available';
  purchaseDate: string;
  warrantyExpiry: string;
  value: number;
  depreciation: number;
}

interface License {
  id: string;
  name: string;
  vendor: string;
  seats: number;
  used: number;
  expiryDate: string;
  cost: number;
  status: 'active' | 'expiring' | 'expired';
}

interface CompactProps {
  compactMode?: boolean;
}

export const SafeTrackDemo = ({ compactMode = false }: CompactProps) => {
  const [activeTab, setActiveTab] = useState('assets');
  const [searchQuery, setSearchQuery] = useState('');

  const assets: Asset[] = [
    { id: '1', name: 'MacBook Pro 16"', type: 'laptop', serialNumber: 'C02G8KXZMD6T', assignedTo: 'John Smith', location: 'HQ - Floor 3', status: 'active', purchaseDate: '2023-06-15', warrantyExpiry: '2026-06-15', value: 2499, depreciation: 25 },
    { id: '2', name: 'Dell PowerEdge R740', type: 'server', serialNumber: 'SVCTAG123456', assignedTo: 'IT Infrastructure', location: 'Data Center A', status: 'active', purchaseDate: '2022-01-10', warrantyExpiry: '2025-01-10', value: 8500, depreciation: 40 },
    { id: '3', name: 'Dell Latitude 5520', type: 'laptop', serialNumber: 'DL5520789ABC', assignedTo: 'Sarah Johnson', location: 'Remote - Denver', status: 'active', purchaseDate: '2023-03-20', warrantyExpiry: '2026-03-20', value: 1299, depreciation: 20 },
    { id: '4', name: 'LG UltraWide 34"', type: 'monitor', serialNumber: 'LG34UW456DEF', assignedTo: 'Design Team', location: 'HQ - Floor 2', status: 'available', purchaseDate: '2023-09-01', warrantyExpiry: '2026-09-01', value: 699, depreciation: 15 },
    { id: '5', name: 'iPhone 15 Pro', type: 'phone', serialNumber: 'DNPXYZABC123', assignedTo: 'Michael Chen', location: 'Remote - NYC', status: 'active', purchaseDate: '2024-01-05', warrantyExpiry: '2025-01-05', value: 1199, depreciation: 10 },
    { id: '6', name: 'HP ProDesk 400', type: 'desktop', serialNumber: 'HP400GHIJK78', assignedTo: 'Reception', location: 'HQ - Lobby', status: 'maintenance', purchaseDate: '2021-11-20', warrantyExpiry: '2024-11-20', value: 899, depreciation: 60 },
  ];

  const licenses: License[] = [
    { id: '1', name: 'Microsoft 365 E3', vendor: 'Microsoft', seats: 100, used: 87, expiryDate: '2025-03-31', cost: 2700, status: 'active' },
    { id: '2', name: 'Adobe Creative Cloud', vendor: 'Adobe', seats: 25, used: 23, expiryDate: '2024-12-15', cost: 1250, status: 'expiring' },
    { id: '3', name: 'Slack Business+', vendor: 'Salesforce', seats: 150, used: 142, expiryDate: '2025-06-30', cost: 1875, status: 'active' },
    { id: '4', name: 'Zoom Enterprise', vendor: 'Zoom', seats: 50, used: 48, expiryDate: '2024-09-30', cost: 999, status: 'expiring' },
    { id: '5', name: 'AutoCAD', vendor: 'Autodesk', seats: 10, used: 8, expiryDate: '2024-08-01', cost: 1700, status: 'expired' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'laptop': return Laptop;
      case 'server': return Server;
      case 'monitor': return Monitor;
      case 'phone': return Smartphone;
      case 'desktop': return Monitor;
      default: return Package;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Active</Badge>;
      case 'maintenance': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Maintenance</Badge>;
      case 'retired': return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Retired</Badge>;
      case 'available': return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Available</Badge>;
      case 'expiring': return <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">Expiring Soon</Badge>;
      case 'expired': return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Expired</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalAssets: assets.length,
    activeAssets: assets.filter(a => a.status === 'active').length,
    inMaintenance: assets.filter(a => a.status === 'maintenance').length,
    totalValue: assets.reduce((sum, a) => sum + a.value, 0),
    warrantyExpiring: assets.filter(a => {
      const exp = new Date(a.warrantyExpiry);
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return exp <= thirtyDays && exp >= new Date();
    }).length,
    licensesExpiring: licenses.filter(l => l.status === 'expiring' || l.status === 'expired').length
  };

  return (
    <div className={compactMode ? 'p-4' : 'p-6 space-y-6'}>
      {!compactMode && (
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">📦 SafeTrack Asset Management</h3>
          <p className="text-muted-foreground">Complete IT asset lifecycle management</p>
        </div>
      )}

      {/* Stats Overview */}
      <div className={`grid gap-4 ${compactMode ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'}`}>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold">{stats.totalAssets}</div>
            <div className="text-xs text-muted-foreground">Total Assets</div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
            <div className="text-2xl font-bold">{stats.activeAssets}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        {!compactMode && (
          <>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <Wrench className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <div className="text-2xl font-bold">{stats.inMaintenance}</div>
                <div className="text-xs text-muted-foreground">In Maintenance</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">${(stats.totalValue / 1000).toFixed(1)}k</div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <div className="text-2xl font-bold">{stats.warrantyExpiring}</div>
                <div className="text-xs text-muted-foreground">Warranty Expiring</div>
              </CardContent>
            </Card>
          </>
        )}
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto mb-2 text-violet-500" />
            <div className="text-2xl font-bold">{licenses.length}</div>
            <div className="text-xs text-muted-foreground">Licenses</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="assets">
              <Package className="h-4 w-4 mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="licenses">
              <FileText className="h-4 w-4 mr-2" />
              Licenses
            </TabsTrigger>
            {!compactMode && (
              <TabsTrigger value="maintenance">
                <Wrench className="h-4 w-4 mr-2" />
                Maintenance
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search assets..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {!compactMode && (
              <>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="assets" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead className={compactMode ? 'hidden' : ''}>Serial</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className={compactMode ? 'hidden' : ''}>Location</TableHead>
                    <TableHead>Status</TableHead>
                    {!compactMode && <TableHead className="text-right">Value</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.slice(0, compactMode ? 4 : undefined).map((asset) => {
                    const Icon = getTypeIcon(asset.type);
                    return (
                      <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-orange-500" />
                            </div>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              {compactMode && (
                                <div className="text-xs text-muted-foreground">{asset.serialNumber}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className={compactMode ? 'hidden' : 'font-mono text-sm'}>
                          {asset.serialNumber}
                        </TableCell>
                        <TableCell>{asset.assignedTo}</TableCell>
                        <TableCell className={compactMode ? 'hidden' : ''}>{asset.location}</TableCell>
                        <TableCell>{getStatusBadge(asset.status)}</TableCell>
                        {!compactMode && (
                          <TableCell className="text-right">
                            <div>${asset.value.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">-{asset.depreciation}% dep.</div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="licenses" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Software</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className={compactMode ? 'hidden' : ''}>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    {!compactMode && <TableHead className="text-right">Monthly Cost</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.slice(0, compactMode ? 4 : undefined).map((license) => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div className="font-medium">{license.name}</div>
                        <div className="text-xs text-muted-foreground">{license.vendor}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{license.used} / {license.seats} seats</div>
                          <Progress value={(license.used / license.seats) * 100} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className={compactMode ? 'hidden' : ''}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(license.expiryDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(license.status)}</TableCell>
                      {!compactMode && (
                        <TableCell className="text-right font-medium">
                          ${license.cost.toLocaleString()}/mo
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {!compactMode && (
          <TabsContent value="maintenance" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-500" />
                  Scheduled Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Server className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="font-medium">Dell PowerEdge R740 - Firmware Update</div>
                        <div className="text-sm text-muted-foreground">Scheduled for Mar 15, 2024 at 2:00 AM</div>
                      </div>
                    </div>
                    <Badge className="bg-amber-500/20 text-amber-500">Upcoming</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <div className="font-medium">HP ProDesk 400 - Hardware Repair</div>
                        <div className="text-sm text-muted-foreground">In progress - Est. completion Mar 12, 2024</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-500">In Progress</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Demo Footer */}
      {!compactMode && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-orange-500" />
            <h4 className="text-xl font-bold mb-2">Complete Asset Lifecycle Management</h4>
            <p className="text-muted-foreground mb-4">
              Track hardware, software, and licenses from procurement to retirement
            </p>
            <div className="flex gap-3 justify-center">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Start Free Trial
              </Button>
              <Button variant="outline">
                <QrCode className="h-4 w-4 mr-2" />
                Scan Asset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
