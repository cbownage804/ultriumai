import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingDown,
  Shield,
  Trash2,
  FileText,
  History,
  Download,
  Plus,
  Search,
  Filter,
  BarChart3,
  CalendarDays,
  AlertCircle,
  Archive
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface Asset {
  id: string;
  name: string;
  type: 'workstation' | 'server' | 'laptop' | 'network' | 'peripheral' | 'mobile';
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  purchasePrice: number;
  vendor: string;
  warrantyExpiry: string;
  status: 'active' | 'maintenance' | 'retired' | 'disposed';
  assignedTo?: string;
  location?: string;
  depreciationMethod: 'straight-line' | 'declining-balance';
  usefulLife: number; // years
  salvageValue: number;
  lastMaintenanceDate?: string;
  eolDate?: string;
  notes?: string;
}

interface AssetHistory {
  id: string;
  assetId: string;
  action: string;
  date: string;
  performedBy: string;
  details: string;
}

// Mock data
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Dell OptiPlex 7090',
    type: 'workstation',
    serialNumber: 'SN-DELL-7090-001',
    manufacturer: 'Dell',
    model: 'OptiPlex 7090',
    purchaseDate: '2022-03-15',
    purchasePrice: 1299,
    vendor: 'Dell Direct',
    warrantyExpiry: '2025-03-15',
    status: 'active',
    assignedTo: 'John Smith',
    location: 'HQ - Floor 2',
    depreciationMethod: 'straight-line',
    usefulLife: 5,
    salvageValue: 100,
  },
  {
    id: '2',
    name: 'HP ProLiant DL380',
    type: 'server',
    serialNumber: 'SN-HP-DL380-001',
    manufacturer: 'HP',
    model: 'ProLiant DL380 Gen10',
    purchaseDate: '2021-06-01',
    purchasePrice: 8500,
    vendor: 'CDW',
    warrantyExpiry: '2024-06-01',
    status: 'active',
    location: 'Data Center A',
    depreciationMethod: 'straight-line',
    usefulLife: 7,
    salvageValue: 500,
    eolDate: '2028-06-01',
  },
  {
    id: '3',
    name: 'MacBook Pro 14"',
    type: 'laptop',
    serialNumber: 'SN-APPLE-MBP-001',
    manufacturer: 'Apple',
    model: 'MacBook Pro 14" M3',
    purchaseDate: '2023-11-01',
    purchasePrice: 2499,
    vendor: 'Apple Store',
    warrantyExpiry: '2024-11-01',
    status: 'active',
    assignedTo: 'Sarah Johnson',
    depreciationMethod: 'declining-balance',
    usefulLife: 4,
    salvageValue: 200,
  },
  {
    id: '4',
    name: 'Cisco Catalyst 9300',
    type: 'network',
    serialNumber: 'SN-CISCO-9300-001',
    manufacturer: 'Cisco',
    model: 'Catalyst 9300-48P',
    purchaseDate: '2020-01-15',
    purchasePrice: 4200,
    vendor: 'Cisco Partner',
    warrantyExpiry: '2024-01-15',
    status: 'maintenance',
    location: 'Network Closet B',
    depreciationMethod: 'straight-line',
    usefulLife: 10,
    salvageValue: 300,
    lastMaintenanceDate: '2024-01-10',
  },
  {
    id: '5',
    name: 'Dell PowerEdge R740',
    type: 'server',
    serialNumber: 'SN-DELL-R740-001',
    manufacturer: 'Dell',
    model: 'PowerEdge R740',
    purchaseDate: '2019-08-20',
    purchasePrice: 12000,
    vendor: 'Dell Direct',
    warrantyExpiry: '2023-08-20',
    status: 'retired',
    location: 'Data Center A',
    depreciationMethod: 'straight-line',
    usefulLife: 7,
    salvageValue: 800,
    eolDate: '2024-08-20',
  },
];

const mockHistory: AssetHistory[] = [
  { id: '1', assetId: '1', action: 'Assigned', date: '2022-03-20', performedBy: 'Admin', details: 'Assigned to John Smith' },
  { id: '2', assetId: '1', action: 'Software Update', date: '2023-06-15', performedBy: 'IT Support', details: 'Windows 11 upgrade' },
  { id: '3', assetId: '2', action: 'Maintenance', date: '2024-01-10', performedBy: 'Vendor', details: 'Annual maintenance check' },
];

function calculateDepreciation(asset: Asset): { currentValue: number; depreciatedAmount: number; percentDepreciated: number } {
  const purchaseDate = new Date(asset.purchaseDate);
  const today = new Date();
  const yearsOwned = differenceInDays(today, purchaseDate) / 365;
  
  let currentValue: number;
  
  if (asset.depreciationMethod === 'straight-line') {
    const annualDepreciation = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
    const totalDepreciation = annualDepreciation * Math.min(yearsOwned, asset.usefulLife);
    currentValue = Math.max(asset.purchasePrice - totalDepreciation, asset.salvageValue);
  } else {
    // Declining balance (double declining)
    const rate = 2 / asset.usefulLife;
    currentValue = asset.purchasePrice * Math.pow(1 - rate, yearsOwned);
    currentValue = Math.max(currentValue, asset.salvageValue);
  }
  
  const depreciatedAmount = asset.purchasePrice - currentValue;
  const percentDepreciated = (depreciatedAmount / (asset.purchasePrice - asset.salvageValue)) * 100;
  
  return { currentValue, depreciatedAmount, percentDepreciated: Math.min(percentDepreciated, 100) };
}

function getWarrantyStatus(expiryDate: string): { status: 'valid' | 'expiring' | 'expired'; daysRemaining: number } {
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysRemaining = differenceInDays(expiry, today);
  
  if (daysRemaining < 0) return { status: 'expired', daysRemaining };
  if (daysRemaining <= 90) return { status: 'expiring', daysRemaining };
  return { status: 'valid', daysRemaining };
}

export function AssetLifecycleManager() {
  const [assets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('inventory');

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats
  const totalValue = assets.reduce((sum, asset) => sum + calculateDepreciation(asset).currentValue, 0);
  const expiringWarranties = assets.filter(a => getWarrantyStatus(a.warrantyExpiry).status === 'expiring').length;
  const expiredWarranties = assets.filter(a => getWarrantyStatus(a.warrantyExpiry).status === 'expired').length;
  const activeAssets = assets.filter(a => a.status === 'active').length;

  const typeIcons = {
    workstation: '🖥️',
    server: '🖲️',
    laptop: '💻',
    network: '🌐',
    peripheral: '🖨️',
    mobile: '📱',
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Assets</p>
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-xs text-muted-foreground">{activeAssets} active</p>
              </div>
              <Package className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Current Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total book value</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "border-yellow-500/30 bg-yellow-500/5",
          expiringWarranties > 0 && "animate-pulse"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Expiring Soon</p>
                <p className="text-2xl font-bold">{expiringWarranties}</p>
                <p className="text-xs text-muted-foreground">Within 90 days</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={cn(
          "border-red-500/30 bg-red-500/5",
          expiredWarranties > 0 && "border-red-500"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Expired</p>
                <p className="text-2xl font-bold">{expiredWarranties}</p>
                <p className="text-xs text-muted-foreground">Warranty expired</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-cyan-500" />
                Asset Lifecycle Management
              </CardTitle>
              <CardDescription>Track assets from procurement to disposal</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>Enter the asset details below</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Asset Name</Label>
                      <Input placeholder="Dell OptiPlex 7090" />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workstation">Workstation</SelectItem>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="laptop">Laptop</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="peripheral">Peripheral</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Serial Number</Label>
                      <Input placeholder="SN-XXXX-XXXX" />
                    </div>
                    <div className="space-y-2">
                      <Label>Manufacturer</Label>
                      <Input placeholder="Dell, HP, Apple..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Price</Label>
                      <Input type="number" placeholder="1299.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Warranty Expiry</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Input placeholder="Dell Direct, CDW..." />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Asset</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="warranties">Warranties</TabsTrigger>
              <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              <TabsTrigger value="eol">End of Life</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Filters */}
            <div className="flex gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search assets..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workstation">Workstation</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="peripheral">Peripheral</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Inventory Tab */}
            <TabsContent value="inventory">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map(asset => {
                    const depreciation = calculateDepreciation(asset);
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{typeIcons[asset.type]}</span>
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{asset.serialNumber}</TableCell>
                        <TableCell>{asset.assignedTo || '-'}</TableCell>
                        <TableCell>{format(new Date(asset.purchaseDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">${depreciation.currentValue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {depreciation.percentDepreciated.toFixed(0)}% depreciated
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            asset.status === 'active' ? 'default' :
                            asset.status === 'maintenance' ? 'secondary' :
                            asset.status === 'retired' ? 'outline' : 'destructive'
                          }>
                            {asset.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Warranties Tab */}
            <TabsContent value="warranties">
              <div className="space-y-4">
                {/* Warranty Calendar Preview */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="border-red-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <div>
                          <p className="text-2xl font-bold text-red-500">{expiredWarranties}</p>
                          <p className="text-sm text-muted-foreground">Expired</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-8 w-8 text-yellow-500" />
                        <div>
                          <p className="text-2xl font-bold text-yellow-500">{expiringWarranties}</p>
                          <p className="text-sm text-muted-foreground">Expiring (90 days)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold text-green-500">
                            {assets.filter(a => getWarrantyStatus(a.warrantyExpiry).status === 'valid').length}
                          </p>
                          <p className="text-sm text-muted-foreground">Valid</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Warranty Expiry</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.sort((a, b) => 
                      new Date(a.warrantyExpiry).getTime() - new Date(b.warrantyExpiry).getTime()
                    ).map(asset => {
                      const warranty = getWarrantyStatus(asset.warrantyExpiry);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeIcons[asset.type]}</span>
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">{asset.serialNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(asset.warrantyExpiry), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "font-medium",
                              warranty.status === 'expired' && "text-red-500",
                              warranty.status === 'expiring' && "text-yellow-500",
                              warranty.status === 'valid' && "text-green-500"
                            )}>
                              {warranty.daysRemaining < 0 
                                ? `${Math.abs(warranty.daysRemaining)} days ago`
                                : `${warranty.daysRemaining} days`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              warranty.status === 'valid' ? 'default' :
                              warranty.status === 'expiring' ? 'secondary' : 'destructive'
                            }>
                              {warranty.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">Renew</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Depreciation Tab */}
            <TabsContent value="depreciation">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Purchase Value</p>
                          <p className="text-2xl font-bold">
                            ${assets.reduce((sum, a) => sum + a.purchasePrice, 0).toLocaleString()}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-cyan-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Depreciation</p>
                          <p className="text-2xl font-bold text-red-500">
                            -${assets.reduce((sum, a) => sum + calculateDepreciation(a).depreciatedAmount, 0).toLocaleString()}
                          </p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Purchase Price</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Depreciation</TableHead>
                      <TableHead>Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map(asset => {
                      const dep = calculateDepreciation(asset);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeIcons[asset.type]}</span>
                              <p className="font-medium">{asset.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>${asset.purchasePrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {asset.depreciationMethod === 'straight-line' ? 'Straight Line' : 'Declining Balance'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">${dep.currentValue.toLocaleString()}</TableCell>
                          <TableCell className="text-red-500">-${dep.depreciatedAmount.toLocaleString()}</TableCell>
                          <TableCell className="w-40">
                            <div className="space-y-1">
                              <Progress value={dep.percentDepreciated} className="h-2" />
                              <p className="text-xs text-muted-foreground text-right">
                                {dep.percentDepreciated.toFixed(0)}%
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* End of Life Tab */}
            <TabsContent value="eol">
              <div className="space-y-4">
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                      <div>
                        <p className="font-medium">End of Life Planning</p>
                        <p className="text-sm text-muted-foreground">
                          Track hardware retirement schedules and disposal workflows
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Useful Life</TableHead>
                      <TableHead>EOL Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map(asset => {
                      const purchaseDate = new Date(asset.purchaseDate);
                      const ageYears = differenceInDays(new Date(), purchaseDate) / 365;
                      const eolDate = asset.eolDate || addDays(purchaseDate, asset.usefulLife * 365).toISOString();
                      const daysToEol = differenceInDays(new Date(eolDate), new Date());
                      
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeIcons[asset.type]}</span>
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                <p className="text-xs text-muted-foreground">{asset.serialNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{ageYears.toFixed(1)} years</TableCell>
                          <TableCell>{asset.usefulLife} years</TableCell>
                          <TableCell>{format(new Date(eolDate), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge variant={
                              daysToEol < 0 ? 'destructive' :
                              daysToEol < 180 ? 'secondary' : 'outline'
                            }>
                              {daysToEol < 0 ? 'Past EOL' : 
                               daysToEol < 180 ? 'Approaching' : 'On Track'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm">Schedule Retirement</Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockHistory.map(entry => {
                    const asset = assets.find(a => a.id === entry.assetId);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {asset ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{typeIcons[asset.type]}</span>
                              <p className="font-medium">{asset.name}</p>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.action}</Badge>
                        </TableCell>
                        <TableCell>{entry.performedBy}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.details}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
