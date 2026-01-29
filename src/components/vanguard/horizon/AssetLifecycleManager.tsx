import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
  Loader2
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Asset {
  id: string;
  name: string;
  type: 'workstation' | 'server' | 'laptop' | 'network' | 'peripheral' | 'mobile';
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: string;
  purchasePrice: number;
  vendor?: string;
  warrantyExpiry?: string;
  status: 'active' | 'maintenance' | 'retired' | 'disposed';
  assignedTo?: string;
  location?: string;
  depreciationMethod: 'straight-line' | 'declining-balance';
  usefulLife: number;
  salvageValue: number;
  lastMaintenanceDate?: string;
  eolDate?: string;
  notes?: string;
}

function calculateDepreciation(asset: Asset): { currentValue: number; depreciatedAmount: number; percentDepreciated: number } {
  if (!asset.purchaseDate) return { currentValue: asset.purchasePrice, depreciatedAmount: 0, percentDepreciated: 0 };
  
  const purchaseDate = new Date(asset.purchaseDate);
  const today = new Date();
  const yearsOwned = differenceInDays(today, purchaseDate) / 365;
  
  let currentValue: number;
  
  if (asset.depreciationMethod === 'straight-line') {
    const annualDepreciation = (asset.purchasePrice - asset.salvageValue) / asset.usefulLife;
    const totalDepreciation = annualDepreciation * Math.min(yearsOwned, asset.usefulLife);
    currentValue = Math.max(asset.purchasePrice - totalDepreciation, asset.salvageValue);
  } else {
    const rate = 2 / asset.usefulLife;
    currentValue = asset.purchasePrice * Math.pow(1 - rate, yearsOwned);
    currentValue = Math.max(currentValue, asset.salvageValue);
  }
  
  const depreciatedAmount = asset.purchasePrice - currentValue;
  const percentDepreciated = (depreciatedAmount / (asset.purchasePrice - asset.salvageValue)) * 100;
  
  return { currentValue, depreciatedAmount, percentDepreciated: Math.min(percentDepreciated, 100) };
}

function getWarrantyStatus(expiryDate?: string): { status: 'valid' | 'expiring' | 'expired' | 'unknown'; daysRemaining: number } {
  if (!expiryDate) return { status: 'unknown', daysRemaining: 0 };
  const expiry = new Date(expiryDate);
  const today = new Date();
  const daysRemaining = differenceInDays(expiry, today);
  
  if (daysRemaining < 0) return { status: 'expired', daysRemaining };
  if (daysRemaining <= 90) return { status: 'expiring', daysRemaining };
  return { status: 'valid', daysRemaining };
}

export function AssetLifecycleManager() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('inventory');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: '',
    type: 'workstation' as const,
    serialNumber: '',
    manufacturer: '',
    model: '',
    purchasePrice: 0,
    usefulLife: 5,
    salvageValue: 0
  });

  useEffect(() => {
    if (user) {
      loadAssets();
    }
  }, [user]);

  const loadAssets = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_asset_lifecycle')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setAssets(data.map((a: any) => ({
          id: a.id,
          name: a.name,
          type: a.asset_type,
          serialNumber: a.serial_number,
          manufacturer: a.manufacturer,
          model: a.model,
          purchaseDate: a.purchase_date,
          purchasePrice: a.purchase_price || 0,
          vendor: a.vendor,
          warrantyExpiry: a.warranty_expiry,
          status: a.status,
          assignedTo: a.assigned_to,
          location: a.location,
          depreciationMethod: a.depreciation_method || 'straight-line',
          usefulLife: a.useful_life_years || 5,
          salvageValue: a.salvage_value || 0,
          lastMaintenanceDate: a.last_maintenance_date,
          eolDate: a.eol_date,
          notes: a.notes
        })));
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAsset = async () => {
    if (!user || !newAsset.name) return;
    try {
      const { error } = await (supabase as any).from('vanguard_asset_lifecycle').insert({
        user_id: user.id,
        name: newAsset.name,
        asset_type: newAsset.type,
        serial_number: newAsset.serialNumber || null,
        manufacturer: newAsset.manufacturer || null,
        model: newAsset.model || null,
        purchase_price: newAsset.purchasePrice,
        useful_life_years: newAsset.usefulLife,
        salvage_value: newAsset.salvageValue,
        status: 'active',
        depreciation_method: 'straight-line'
      });
      if (error) throw error;
      toast.success('Asset created');
      setShowAddDialog(false);
      setNewAsset({ name: '', type: 'workstation', serialNumber: '', manufacturer: '', model: '', purchasePrice: 0, usefulLife: 5, salvageValue: 0 });
      loadAssets();
    } catch (error) {
      console.error('Error creating asset:', error);
      toast.error('Failed to create asset');
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate summary stats
  const totalValue = assets.reduce((sum, asset) => sum + calculateDepreciation(asset).currentValue, 0);
  const expiringWarranties = assets.filter(a => getWarrantyStatus(a.warrantyExpiry).status === 'expiring').length;
  const expiredWarranties = assets.filter(a => getWarrantyStatus(a.warrantyExpiry).status === 'expired').length;
  const activeAssets = assets.filter(a => a.status === 'active').length;

  const typeIcons: Record<string, string> = {
    workstation: '🖥️',
    server: '🗄️',
    laptop: '💻',
    network: '🌐',
    peripheral: '🖨️',
    mobile: '📱',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Current book value</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/30 bg-cyan-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Active Assets</p>
                <p className="text-2xl font-bold">{activeAssets}</p>
                <p className="text-xs text-muted-foreground">of {assets.length} total</p>
              </div>
              <Package className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Expiring Warranty</p>
                <p className="text-2xl font-bold text-yellow-500">{expiringWarranties}</p>
                <p className="text-xs text-muted-foreground">Within 90 days</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Expired Warranty</p>
                <p className="text-2xl font-bold text-red-500">{expiredWarranties}</p>
                <p className="text-xs text-muted-foreground">Needs attention</p>
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
                <Package className="h-5 w-5 text-cyan-500" />
                Asset Lifecycle Manager
              </CardTitle>
              <CardDescription>Track assets, depreciation, and warranty status</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription>Track a new asset in your inventory</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Asset Name</Label>
                      <Input 
                        placeholder="Dell OptiPlex 7090"
                        value={newAsset.name}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={newAsset.type}
                        onValueChange={(val) => setNewAsset(prev => ({ ...prev, type: val as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workstation">Workstation</SelectItem>
                          <SelectItem value="laptop">Laptop</SelectItem>
                          <SelectItem value="server">Server</SelectItem>
                          <SelectItem value="network">Network</SelectItem>
                          <SelectItem value="peripheral">Peripheral</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Manufacturer</Label>
                      <Input 
                        placeholder="Dell"
                        value={newAsset.manufacturer}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, manufacturer: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input 
                        placeholder="OptiPlex 7090"
                        value={newAsset.model}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, model: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Serial Number</Label>
                      <Input 
                        placeholder="SN-12345"
                        value={newAsset.serialNumber}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Price ($)</Label>
                      <Input 
                        type="number"
                        value={newAsset.purchasePrice}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateAsset}>Add Asset</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="depreciation">Depreciation</TabsTrigger>
              <TabsTrigger value="warranty">Warranty</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-4">
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="workstation">Workstation</SelectItem>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>{assets.length === 0 ? 'No assets tracked yet' : 'No assets match your filters'}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map(asset => {
                      const depreciation = calculateDepreciation(asset);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="mr-2">{typeIcons[asset.type]}</span>
                            {asset.type}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{asset.serialNumber || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              asset.status === 'active' ? 'default' :
                              asset.status === 'maintenance' ? 'secondary' : 'outline'
                            }>
                              {asset.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{asset.assignedTo || '-'}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${depreciation.currentValue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="depreciation" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Current Value</TableHead>
                    <TableHead>Depreciated</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.filter(a => a.status === 'active').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No active assets to show depreciation
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.filter(a => a.status === 'active').map(asset => {
                      const dep = calculateDepreciation(asset);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>${asset.purchasePrice.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">${dep.currentValue.toLocaleString()}</TableCell>
                          <TableCell className="text-red-500">-${dep.depreciatedAmount.toLocaleString()}</TableCell>
                          <TableCell className="w-48">
                            <div className="flex items-center gap-2">
                              <Progress value={dep.percentDepreciated} className="flex-1" />
                              <span className="text-xs text-muted-foreground w-12">{dep.percentDepreciated.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="warranty" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.filter(a => a.warrantyExpiry).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No warranty information available
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.filter(a => a.warrantyExpiry).map(asset => {
                      const warranty = getWarrantyStatus(asset.warrantyExpiry);
                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-medium">{asset.name}</TableCell>
                          <TableCell>{asset.vendor || '-'}</TableCell>
                          <TableCell>{asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), 'MMM dd, yyyy') : '-'}</TableCell>
                          <TableCell>{warranty.daysRemaining} days</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              warranty.status === 'valid' ? 'bg-green-500/20 text-green-500' :
                              warranty.status === 'expiring' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            )}>
                              {warranty.status === 'valid' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {warranty.status === 'expiring' && <Clock className="h-3 w-3 mr-1" />}
                              {warranty.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {warranty.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}