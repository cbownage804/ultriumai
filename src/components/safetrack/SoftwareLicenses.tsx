/**
 * Software License Management Component for SafeTrack Business
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Plus, Search, MoreVertical, Trash2, Edit, Key, Package2, RefreshCw,
  Calendar, DollarSign, Users, AlertTriangle, CheckCircle2, Clock, Loader2
} from 'lucide-react';
import { useSoftwareLicenses, type SoftwareLicense, type SoftwareLicenseFormData } from '@/hooks/useSoftwareLicenses';
import { format } from 'date-fns';

const LICENSE_TYPES = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'perpetual', label: 'Perpetual' },
  { value: 'volume', label: 'Volume License' },
  { value: 'trial', label: 'Trial' },
  { value: 'freeware', label: 'Freeware' },
  { value: 'open_source', label: 'Open Source' }
];

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'other', label: 'Other' }
];

const CATEGORIES = [
  'Productivity', 'Security', 'Development', 'Design', 'Communication',
  'Accounting', 'CRM', 'Storage', 'Analytics', 'Other'
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getExpiryIndicator = (license: SoftwareLicense) => {
  if (!license.expiry_date) return null;
  
  const expiry = new Date(license.expiry_date);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  
  if (expiry < now) {
    return { icon: AlertTriangle, color: 'text-red-400', label: 'Expired' };
  } else if (expiry <= thirtyDays) {
    return { icon: Clock, color: 'text-amber-400', label: 'Expiring Soon' };
  } else {
    return { icon: CheckCircle2, color: 'text-emerald-400', label: 'Active' };
  }
};

export function SoftwareLicenses() {
  const {
    licenses,
    stats,
    isLoading,
    createLicense,
    updateLicense,
    deleteLicense,
    isCreating,
    isUpdating
  } = useSoftwareLicenses();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);

  const [form, setForm] = useState<SoftwareLicenseFormData>({
    name: '',
    vendor: '',
    version: '',
    license_type: 'subscription',
    license_key: '',
    seats_total: 1,
    seats_used: 0,
    cost_per_seat: undefined,
    billing_cycle: 'annual',
    purchase_date: '',
    expiry_date: '',
    renewal_date: '',
    auto_renew: false,
    category: '',
    notes: '',
    status: 'active'
  });

  const resetForm = () => {
    setForm({
      name: '', vendor: '', version: '', license_type: 'subscription',
      license_key: '', seats_total: 1, seats_used: 0, cost_per_seat: undefined,
      billing_cycle: 'annual', purchase_date: '', expiry_date: '', renewal_date: '',
      auto_renew: false, category: '', notes: '', status: 'active'
    });
  };

  const filteredLicenses = useMemo(() => {
    return licenses.filter(license => {
      const matchesSearch = 
        license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || license.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || license.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [licenses, searchTerm, selectedCategory, selectedStatus]);

  const handleSave = () => {
    if (!form.name.trim()) return;

    if (editingLicense) {
      updateLicense({ id: editingLicense.id, ...form });
    } else {
      createLicense(form);
    }

    setShowAddDialog(false);
    setEditingLicense(null);
    resetForm();
  };

  const handleEdit = (license: SoftwareLicense) => {
    setEditingLicense(license);
    setForm({
      name: license.name,
      vendor: license.vendor || '',
      version: license.version || '',
      license_type: license.license_type,
      license_key: license.license_key || '',
      seats_total: license.seats_total,
      seats_used: license.seats_used,
      cost_per_seat: license.cost_per_seat || undefined,
      billing_cycle: license.billing_cycle || 'annual',
      purchase_date: license.purchase_date || '',
      expiry_date: license.expiry_date || '',
      renewal_date: license.renewal_date || '',
      auto_renew: license.auto_renew,
      category: license.category || '',
      notes: license.notes || '',
      status: license.status
    });
    setShowAddDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-[#141414] border-emerald-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/10 shrink-0">
                <Package2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Licenses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border-emerald-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10 shrink-0">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.usedSeats}/{stats.totalSeats}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Seats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border-emerald-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 shrink-0">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stats.expiring}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Expiring</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#141414] border-emerald-500/10">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10 shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">${stats.totalCost.toLocaleString()}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-emerald-500/10 touch-target text-base"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1 sm:w-[140px] bg-[#1a1a1a] border-emerald-500/10 touch-target">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="flex-1 sm:w-[120px] bg-[#1a1a1a] border-emerald-500/10 touch-target">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={() => { resetForm(); setEditingLicense(null); setShowAddDialog(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-black w-full sm:w-auto touch-target"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* License Cards */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filteredLicenses.length === 0 ? (
            <Card className="bg-[#141414] border-emerald-500/10">
              <CardContent className="py-12 text-center">
                <Package2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No software licenses found</p>
                <p className="text-sm text-gray-500 mt-1">Add your first license to start tracking</p>
              </CardContent>
            </Card>
          ) : (
            filteredLicenses.map((license) => {
              const expiryIndicator = getExpiryIndicator(license);
              const seatUsage = license.seats_total > 0 ? (license.seats_used / license.seats_total) * 100 : 0;
              
              return (
                <motion.div
                  key={license.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <Card className="bg-[#141414] border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base text-white">{license.name}</CardTitle>
                            {license.version && (
                              <span className="text-xs text-gray-500">v{license.version}</span>
                            )}
                          </div>
                          <CardDescription>
                            {license.vendor && <span>{license.vendor}</span>}
                            {license.category && <span> • {license.category}</span>}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusStyle(license.status)} capitalize`}>
                            {license.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {license.license_type.replace('_', ' ')}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(license)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteLicense(license.id)}
                                className="text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Seats:</span>
                          <span className="ml-2 text-white">{license.seats_used}/{license.seats_total}</span>
                        </div>
                        {license.cost_per_seat && (
                          <div>
                            <span className="text-gray-500">Cost/Seat:</span>
                            <span className="ml-2 text-white">${license.cost_per_seat}</span>
                          </div>
                        )}
                        {license.billing_cycle && (
                          <div>
                            <span className="text-gray-500">Billing:</span>
                            <span className="ml-2 text-white capitalize">{license.billing_cycle}</span>
                          </div>
                        )}
                        {license.expiry_date && expiryIndicator && (
                          <div className="flex items-center gap-1">
                            <expiryIndicator.icon className={`h-4 w-4 ${expiryIndicator.color}`} />
                            <span className="text-gray-500">Expires:</span>
                            <span className="ml-1 text-white">
                              {format(new Date(license.expiry_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Seat Usage Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Seat Usage</span>
                          <span className="text-gray-400">{Math.round(seatUsage)}%</span>
                        </div>
                        <Progress value={seatUsage} className="h-1.5" />
                      </div>

                      {license.license_key && (
                        <div className="flex items-center gap-2 text-xs">
                          <Key className="h-3 w-3 text-gray-500" />
                          <code className="bg-black/30 px-2 py-0.5 rounded text-gray-400">
                            {license.license_key.slice(0, 8)}••••••••
                          </code>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); setEditingLicense(null); resetForm(); }}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLicense ? 'Edit License' : 'Add Software License'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Software Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Microsoft 365"
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="e.g., Microsoft"
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="e.g., 2024"
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>License Type</Label>
                <Select value={form.license_type} onValueChange={(v) => setForm({ ...form, license_type: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-emerald-500/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map(lt => (
                      <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category || ''} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-emerald-500/10">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>License Key</Label>
              <Input
                value={form.license_key}
                onChange={(e) => setForm({ ...form, license_key: e.target.value })}
                placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                className="bg-[#1a1a1a] border-emerald-500/10 font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total Seats</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.seats_total}
                  onChange={(e) => setForm({ ...form, seats_total: parseInt(e.target.value) || 1 })}
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Seats Used</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.seats_used}
                  onChange={(e) => setForm({ ...form, seats_used: parseInt(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Cost per Seat</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.cost_per_seat ?? ''}
                  onChange={(e) => setForm({ ...form, cost_per_seat: parseFloat(e.target.value) || undefined })}
                  placeholder="$0.00"
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={form.billing_cycle || ''} onValueChange={(v) => setForm({ ...form, billing_cycle: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-emerald-500/10">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map(bc => (
                      <SelectItem key={bc.value} value={bc.value}>{bc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-[#1a1a1a] border-emerald-500/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setForm({ ...form, purchase_date: e.target.value })}
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Renewal Date</Label>
                <Input
                  type="date"
                  value={form.renewal_date}
                  onChange={(e) => setForm({ ...form, renewal_date: e.target.value })}
                  className="bg-[#1a1a1a] border-emerald-500/10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.auto_renew}
                onCheckedChange={(checked) => setForm({ ...form, auto_renew: checked })}
              />
              <Label>Auto-renew enabled</Label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional notes..."
                className="bg-[#1a1a1a] border-emerald-500/10"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingLicense(null); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || isCreating || isUpdating}
              className="bg-emerald-500 hover:bg-emerald-600 text-black"
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLicense ? 'Update' : 'Add'} License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
