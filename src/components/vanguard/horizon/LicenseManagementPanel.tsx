import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Download,
  Edit,
  Trash2,
  Bell,
  Loader2,
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface License {
  id: string;
  software_name: string;
  vendor: string;
  license_type: 'perpetual' | 'subscription' | 'volume' | 'oem';
  license_key?: string;
  total_seats: number;
  used_seats: number;
  purchase_date?: string;
  expiration_date?: string;
  cost: number;
  renewal_cost?: number;
  auto_renew: boolean;
  assigned_to: string[];
  category: 'productivity' | 'security' | 'development' | 'infrastructure' | 'other';
  notes?: string;
}

export function LicenseManagementPanel() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({
    software_name: '',
    vendor: '',
    license_type: 'subscription' as const,
    total_seats: 1,
    cost: 0,
    category: 'other' as const,
    expiration_date: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchLicenses();
    }
  }, [user?.id]);

  const fetchLicenses = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vanguard_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expiration_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      const transformed: License[] = (data || []).map((l: any) => ({
        id: l.id,
        software_name: l.software_name,
        vendor: l.vendor || '',
        license_type: l.license_type || 'subscription',
        license_key: l.license_key,
        total_seats: l.total_seats || 1,
        used_seats: l.used_seats || 0,
        purchase_date: l.purchase_date,
        expiration_date: l.expiration_date,
        cost: Number(l.cost) || 0,
        renewal_cost: l.renewal_cost ? Number(l.renewal_cost) : undefined,
        auto_renew: l.auto_renew ?? false,
        assigned_to: l.assigned_to || [],
        category: l.category || 'other',
        notes: l.notes,
      }));

      setLicenses(transformed);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast.error('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLicense = async () => {
    if (!user?.id || !newLicense.software_name) return;

    try {
      const { error } = await supabase
        .from('vanguard_licenses')
        .insert({
          user_id: user.id,
          software_name: newLicense.software_name,
          vendor: newLicense.vendor,
          license_type: newLicense.license_type,
          total_seats: newLicense.total_seats,
          cost: newLicense.cost,
          category: newLicense.category,
          expiration_date: newLicense.expiration_date || null,
          purchase_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;
      toast.success('License added');
      setShowAddDialog(false);
      setNewLicense({
        software_name: '',
        vendor: '',
        license_type: 'subscription',
        total_seats: 1,
        cost: 0,
        category: 'other',
        expiration_date: '',
      });
      fetchLicenses();
    } catch (error) {
      console.error('Error adding license:', error);
      toast.error('Failed to add license');
    }
  };

  const handleDeleteLicense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vanguard_licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLicenses(prev => prev.filter(l => l.id !== id));
      toast.success('License deleted');
    } catch (error) {
      console.error('Error deleting license:', error);
      toast.error('Failed to delete license');
    }
  };

  const getLicenseStatus = (license: License): { status: string; color: string; icon: React.ReactNode } => {
    if (!license.expiration_date) {
      return { status: 'Perpetual', color: 'text-blue-500', icon: <CheckCircle className="h-4 w-4 text-blue-500" /> };
    }
    
    const daysUntilExpiry = differenceInDays(new Date(license.expiration_date), new Date());
    
    if (daysUntilExpiry < 0) {
      return { status: 'Expired', color: 'text-red-500', icon: <XCircle className="h-4 w-4 text-red-500" /> };
    }
    if (daysUntilExpiry <= 30) {
      return { status: 'Expiring Soon', color: 'text-yellow-500', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> };
    }
    return { status: 'Active', color: 'text-green-500', icon: <CheckCircle className="h-4 w-4 text-green-500" /> };
  };

  const getUtilization = (license: License): number => {
    return Math.round((license.used_seats / license.total_seats) * 100);
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.software_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         license.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || license.category === filterCategory;
    
    if (filterStatus === 'all') return matchesSearch && matchesCategory;
    
    const status = getLicenseStatus(license).status.toLowerCase().replace(' ', '-');
    return matchesSearch && matchesCategory && 
           (filterStatus === 'active' && status === 'active' ||
            filterStatus === 'expiring' && status === 'expiring-soon' ||
            filterStatus === 'expired' && status === 'expired');
  });

  const totalMonthlyCost = licenses.reduce((acc, l) => {
    if (l.license_type === 'subscription') {
      return acc + (l.cost * l.total_seats);
    }
    return acc;
  }, 0);

  const expiringCount = licenses.filter(l => {
    const status = getLicenseStatus(l);
    return status.status === 'Expiring Soon';
  }).length;

  const expiredCount = licenses.filter(l => {
    const status = getLicenseStatus(l);
    return status.status === 'Expired';
  }).length;

  const totalSeats = licenses.reduce((acc, l) => acc + l.total_seats, 0);
  const usedSeats = licenses.reduce((acc, l) => acc + l.used_seats, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Key className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{licenses.length}</p>
                <p className="text-xs text-muted-foreground">Total Licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalMonthlyCost.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Monthly Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringCount}</p>
                <p className="text-xs text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiredCount}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{usedSeats}/{totalSeats}</p>
                <p className="text-xs text-muted-foreground">Seats Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/20">
                <TrendingUp className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">Utilization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search licenses..."
              className="pl-9 w-[200px]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="infrastructure">Infrastructure</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add License
          </Button>
        </div>
      </div>

      {/* License Table */}
      <Card>
        <CardContent className="p-0">
          {filteredLicenses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No licenses found. Add your first software license to track.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Software</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map(license => {
                  const status = getLicenseStatus(license);
                  const utilization = getUtilization(license);
                  
                  return (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{license.software_name}</p>
                          <p className="text-xs text-muted-foreground">{license.vendor}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {license.license_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{license.used_seats}</span>
                        <span className="text-muted-foreground">/{license.total_seats}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={utilization} 
                            className={cn(
                              'h-2 w-16',
                              utilization >= 100 && 'bg-red-500/20',
                              utilization >= 80 && utilization < 100 && 'bg-yellow-500/20'
                            )} 
                          />
                          <span className={cn(
                            'text-xs',
                            utilization >= 100 && 'text-red-500',
                            utilization >= 80 && utilization < 100 && 'text-yellow-500'
                          )}>
                            {utilization}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {license.expiration_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(license.expiration_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {status.icon}
                          <span className={cn('text-sm', status.color)}>
                            {status.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            ${license.license_type === 'subscription' 
                              ? (license.cost * license.total_seats).toFixed(2)
                              : license.cost.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {license.license_type === 'subscription' ? '/mo' : 'one-time'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteLicense(license.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expiring Soon Alert */}
      {expiringCount > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Bell className="h-5 w-5" />
              Licenses Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {licenses
                .filter(l => getLicenseStatus(l).status === 'Expiring Soon')
                .map(license => (
                  <div key={license.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">{license.software_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires {license.expiration_date && format(new Date(license.expiration_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Renew</Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add License Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add License</DialogTitle>
            <DialogDescription>Track a new software license</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Software Name</Label>
                <Input
                  value={newLicense.software_name}
                  onChange={(e) => setNewLicense({ ...newLicense, software_name: e.target.value })}
                  placeholder="Microsoft 365"
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  value={newLicense.vendor}
                  onChange={(e) => setNewLicense({ ...newLicense, vendor: e.target.value })}
                  placeholder="Microsoft"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Type</Label>
                <Select
                  value={newLicense.license_type}
                  onValueChange={(v: any) => setNewLicense({ ...newLicense, license_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="perpetual">Perpetual</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="oem">OEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newLicense.category}
                  onValueChange={(v: any) => setNewLicense({ ...newLicense, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Seats</Label>
                <Input
                  type="number"
                  value={newLicense.total_seats}
                  onChange={(e) => setNewLicense({ ...newLicense, total_seats: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cost (per seat/mo)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newLicense.cost}
                  onChange={(e) => setNewLicense({ ...newLicense, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiration Date (optional)</Label>
              <Input
                type="date"
                value={newLicense.expiration_date}
                onChange={(e) => setNewLicense({ ...newLicense, expiration_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLicense}>Add License</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
