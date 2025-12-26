import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Search, Plus, Filter, Server, Laptop, Monitor, Smartphone, HardDrive, Download, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  status: string;
  assigned_to: string;
  location: string;
  purchase_date: string;
  warranty_expiry: string;
  purchase_price: number;
  current_value: number;
}

export const AssetInventory = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    retired: 0,
    totalValue: 0
  });

  useEffect(() => {
    if (user) loadAssets();
  }, [user]);

  const loadAssets = async () => {
    const { data } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      const assetList: Asset[] = data.map(a => ({
        id: a.id,
        name: a.name,
        type: a.category_id || 'hardware',
        category: 'Hardware',
        serial_number: a.serial_number || 'N/A',
        manufacturer: a.manufacturer || 'Unknown',
        model: a.model || 'Unknown',
        status: a.status || 'active',
        assigned_to: a.assigned_to || 'Unassigned',
        location: a.location || 'Unknown',
        purchase_date: a.purchase_date || '',
        warranty_expiry: a.warranty_expiry || '',
        purchase_price: a.purchase_price || 0,
        current_value: a.current_value || 0
      }));
      setAssets(assetList);
      calculateStats(assetList);
    } else {
      // No real assets - show empty state
      setAssets([]);
      calculateStats([]);
    }
  };

  const calculateStats = (assetList: Asset[]) => {
    setStats({
      total: assetList.length,
      active: assetList.filter(a => a.status === 'active').length,
      maintenance: assetList.filter(a => a.status === 'maintenance').length,
      retired: assetList.filter(a => a.status === 'retired').length,
      totalValue: assetList.reduce((sum, a) => sum + a.current_value, 0)
    });
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.assigned_to.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-4 w-4" />;
      case 'laptop': return <Laptop className="h-4 w-4" />;
      case 'workstation': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'network': return <HardDrive className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      maintenance: 'bg-yellow-500',
      retired: 'bg-gray-500',
      disposed: 'bg-red-500'
    };
    return <Badge className={colors[status] || 'bg-muted'}>{status}</Badge>;
  };

  const exportAssets = () => {
    const csv = [
      ['Name', 'Type', 'Serial Number', 'Manufacturer', 'Model', 'Status', 'Assigned To', 'Location', 'Current Value'].join(','),
      ...filteredAssets.map(a => [a.name, a.type, a.serial_number, a.manufacturer, a.model, a.status, a.assigned_to, a.location, a.current_value].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'asset-inventory.csv';
    link.click();
    toast.success('Asset inventory exported');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.maintenance}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              Retired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.retired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Asset Inventory
              </CardTitle>
              <CardDescription>
                Complete inventory management system
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportAssets}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="workstation">Workstation</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="network">Network</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
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

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(asset.type)}
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{asset.serial_number}</TableCell>
                    <TableCell>{asset.assigned_to}</TableCell>
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell>${asset.current_value.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
