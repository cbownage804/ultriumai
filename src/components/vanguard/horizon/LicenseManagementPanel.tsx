import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Package,
  TrendingUp,
  Clock,
  Download,
  FileText,
  Edit,
  Trash2,
  Bell,
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface License {
  id: string;
  softwareName: string;
  vendor: string;
  licenseType: 'perpetual' | 'subscription' | 'volume' | 'oem';
  licenseKey?: string;
  totalSeats: number;
  usedSeats: number;
  purchaseDate: Date;
  expirationDate?: Date;
  cost: number;
  renewalCost?: number;
  autoRenew: boolean;
  assignedTo: string[];
  notes?: string;
  category: 'productivity' | 'security' | 'development' | 'infrastructure' | 'other';
}

const mockLicenses: License[] = [
  {
    id: '1',
    softwareName: 'Microsoft 365 Business',
    vendor: 'Microsoft',
    licenseType: 'subscription',
    totalSeats: 50,
    usedSeats: 42,
    purchaseDate: new Date(2024, 0, 1),
    expirationDate: addDays(new Date(), 45),
    cost: 12.50,
    renewalCost: 12.50,
    autoRenew: true,
    assignedTo: ['Acme Corp', 'TechStart Inc'],
    category: 'productivity',
  },
  {
    id: '2',
    softwareName: 'Adobe Creative Cloud',
    vendor: 'Adobe',
    licenseType: 'subscription',
    totalSeats: 10,
    usedSeats: 10,
    purchaseDate: new Date(2024, 3, 15),
    expirationDate: addDays(new Date(), 120),
    cost: 54.99,
    renewalCost: 59.99,
    autoRenew: true,
    assignedTo: ['Acme Corp'],
    category: 'productivity',
  },
  {
    id: '3',
    softwareName: 'SentinelOne',
    vendor: 'SentinelOne',
    licenseType: 'subscription',
    totalSeats: 100,
    usedSeats: 78,
    purchaseDate: new Date(2024, 2, 1),
    expirationDate: addDays(new Date(), 200),
    cost: 8.00,
    renewalCost: 8.50,
    autoRenew: true,
    assignedTo: ['Acme Corp', 'TechStart Inc', 'GlobalTech'],
    category: 'security',
  },
  {
    id: '4',
    softwareName: 'Windows Server 2022',
    vendor: 'Microsoft',
    licenseType: 'perpetual',
    licenseKey: 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
    totalSeats: 5,
    usedSeats: 3,
    purchaseDate: new Date(2023, 8, 1),
    cost: 1069.00,
    autoRenew: false,
    assignedTo: ['Acme Corp'],
    category: 'infrastructure',
  },
  {
    id: '5',
    softwareName: 'JetBrains All Products',
    vendor: 'JetBrains',
    licenseType: 'subscription',
    totalSeats: 5,
    usedSeats: 5,
    purchaseDate: new Date(2024, 1, 1),
    expirationDate: addDays(new Date(), 15),
    cost: 649.00,
    renewalCost: 519.00,
    autoRenew: false,
    assignedTo: ['TechStart Inc'],
    category: 'development',
  },
  {
    id: '6',
    softwareName: 'Veeam Backup',
    vendor: 'Veeam',
    licenseType: 'subscription',
    totalSeats: 25,
    usedSeats: 18,
    purchaseDate: new Date(2024, 0, 15),
    expirationDate: addDays(new Date(), -5),
    cost: 50.00,
    renewalCost: 55.00,
    autoRenew: false,
    assignedTo: ['Acme Corp', 'GlobalTech'],
    category: 'infrastructure',
  },
];

export function LicenseManagementPanel() {
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<License[]>(mockLicenses);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getLicenseStatus = (license: License): { status: string; color: string; icon: React.ReactNode } => {
    if (!license.expirationDate) {
      return { status: 'Perpetual', color: 'text-blue-500', icon: <CheckCircle className="h-4 w-4 text-blue-500" /> };
    }
    
    const daysUntilExpiry = differenceInDays(license.expirationDate, new Date());
    
    if (daysUntilExpiry < 0) {
      return { status: 'Expired', color: 'text-red-500', icon: <XCircle className="h-4 w-4 text-red-500" /> };
    }
    if (daysUntilExpiry <= 30) {
      return { status: 'Expiring Soon', color: 'text-yellow-500', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> };
    }
    return { status: 'Active', color: 'text-green-500', icon: <CheckCircle className="h-4 w-4 text-green-500" /> };
  };

  const getUtilization = (license: License): number => {
    return Math.round((license.usedSeats / license.totalSeats) * 100);
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.softwareName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    if (l.licenseType === 'subscription') {
      return acc + (l.cost * l.totalSeats);
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

  const totalSeats = licenses.reduce((acc, l) => acc + l.totalSeats, 0);
  const usedSeats = licenses.reduce((acc, l) => acc + l.usedSeats, 0);

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
                <p className="text-2xl font-bold">{Math.round((usedSeats / totalSeats) * 100)}%</p>
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
                        <p className="font-medium">{license.softwareName}</p>
                        <p className="text-xs text-muted-foreground">{license.vendor}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {license.licenseType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{license.usedSeats}</span>
                      <span className="text-muted-foreground">/{license.totalSeats}</span>
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
                      {license.expirationDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(license.expirationDate, 'MMM d, yyyy')}
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
                          ${license.licenseType === 'subscription' 
                            ? (license.cost * license.totalSeats).toFixed(2)
                            : license.cost.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {license.licenseType === 'subscription' ? '/mo' : 'one-time'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
                        <p className="font-medium">{license.softwareName}</p>
                        <p className="text-xs text-muted-foreground">
                          {license.expirationDate && differenceInDays(license.expirationDate, new Date())} days remaining
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {license.autoRenew ? (
                        <Badge variant="secondary">Auto-Renew</Badge>
                      ) : (
                        <Button size="sm" variant="outline">
                          Renew Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add License Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New License</DialogTitle>
            <DialogDescription>
              Track a new software license in your inventory
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Software Name</Label>
              <Input placeholder="e.g., Microsoft 365" />
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input placeholder="e.g., Microsoft" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
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
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
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
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Cost per Seat</Label>
                <Input type="number" placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expiration Date (optional)</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowAddDialog(false);
              toast({
                title: 'License Added',
                description: 'New license has been added to your inventory',
              });
            }}>
              Add License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
