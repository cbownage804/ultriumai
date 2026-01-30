/**
 * SafeTrack Asset Management - Enterprise-grade Inventory System
 * Full hardware tracking with warranty integration and AI-powered serial lookup
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Plus,
  Search,
  BarChart3,
  Download,
  RefreshCw,
  Laptop,
  Monitor,
  Server,
  Wifi,
  Mouse,
  Printer,
  HardDrive,
  Smartphone,
  MoreVertical,
  Trash2,
  Edit,
  Shield,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  ExternalLink,
  Sparkles,
  Wand2
} from "lucide-react";
import { useSafeTrackAssets, type Asset, type AssetFormData, type OfficeLocationFormData } from "@/hooks/useSafeTrackAssets";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { devLog } from "@/lib/logger";

// Category icon mapping
const getCategoryIcon = (iconName: string | null | undefined) => {
  switch (iconName) {
    case 'laptop': return Laptop;
    case 'monitor': return Monitor;
    case 'server': return Server;
    case 'network': return Wifi;
    case 'mouse': return Mouse;
    case 'printer': return Printer;
    case 'hard-drive': return HardDrive;
    case 'smartphone': return Smartphone;
    default: return Package;
  }
};

// Status badge styling
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'maintenance': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'retired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'disposed': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Condition badge styling
const getConditionStyle = (condition: string) => {
  switch (condition) {
    case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'excellent': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'good': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'fair': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'poor': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'damaged': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

// Warranty status indicator
const getWarrantyIndicator = (asset: Asset) => {
  if (!asset.warranty_expiry) return null;
  
  const expiry = new Date(asset.warranty_expiry);
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

export const AssetManagement = () => {
  const {
    assets,
    categories,
    officeLocations,
    stats,
    isLoading,
    createAsset,
    updateAsset,
    deleteAsset,
    createLocation,
    refreshWarranty,
    isCreating,
    isUpdating
  } = useSafeTrackAssets();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [refreshingAssetId, setRefreshingAssetId] = useState<string | null>(null);
  const [isAiLookupLoading, setIsAiLookupLoading] = useState(false);
  const [aiLookupResult, setAiLookupResult] = useState<{
    manufacturer: string;
    model: string;
    category: string;
    notes?: string;
  } | null>(null);

  // Form state
  const [assetForm, setAssetForm] = useState<AssetFormData>({
    name: '',
    serial_number: '',
    manufacturer: '',
    model: '',
    category_id: '',
    office_location_id: '',
    status: 'active',
    condition: 'good',
    assigned_to: '',
    purchase_price: undefined,
    purchase_date: '',
    warranty_expiry: '',
    notes: ''
  });

  const [locationForm, setLocationForm] = useState<OfficeLocationFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    postal_code: '',
    is_primary: false
  });

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || asset.category_id === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || asset.office_location_id === selectedLocation;
      const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
    });
  }, [assets, searchTerm, selectedCategory, selectedLocation, selectedStatus]);

  // Handle add/edit asset
  const handleSaveAsset = () => {
    if (!assetForm.name.trim()) return;

    if (editingAsset) {
      updateAsset({ id: editingAsset.id, ...assetForm });
    } else {
      createAsset(assetForm);
    }

    setShowAddAsset(false);
    setEditingAsset(null);
    setAiLookupResult(null);
    resetAssetForm();
  };

  // AI Serial Number Lookup
  const handleAiLookup = async () => {
    devLog.log("AI Lookup triggered with serial:", assetForm.serial_number);
    
    const serialNumber = assetForm.serial_number?.trim();
    if (!serialNumber || serialNumber.length < 3) {
      toast.error("Enter a serial number (min 3 characters) to use AI lookup");
      return;
    }

    setIsAiLookupLoading(true);
    setAiLookupResult(null);
    toast.info("Looking up device info...");

    try {
      devLog.log("Calling safetrack-ai-lookup with:", serialNumber);
      const { data, error } = await supabase.functions.invoke('safetrack-ai-lookup', {
        body: { serialNumber }
      });

      devLog.log("AI Lookup response:", data, error);

      if (error) {
        devLog.error("Supabase function error:", error);
        throw error;
      }

      if (data?.success && data?.data) {
        const result = data.data;
        setAiLookupResult({
          manufacturer: result.manufacturer,
          model: result.model,
          category: result.category,
          notes: result.notes
        });
        
        // Pre-fill editable fields (user can modify before saving)
        setAssetForm(prev => ({
          ...prev,
          manufacturer: result.manufacturer || prev.manufacturer,
          model: result.model || prev.model,
          notes: result.notes ? `${prev.notes ? prev.notes + '\n' : ''}AI detected: ${result.notes}` : prev.notes
        }));
        
        // Find matching category
        const matchedCategory = categories.find(
          c => c.name.toLowerCase().includes(result.category?.toLowerCase() || '')
        );
        if (matchedCategory) {
          setAssetForm(prev => ({ ...prev, category_id: matchedCategory.id }));
        }

        toast.success("AI identified device info - review and edit before saving");
      } else {
        toast.error(data?.error || "Could not identify device from serial number");
      }
    } catch (err: any) {
      devLog.error("AI lookup error:", err);
      toast.error(err?.message || "AI lookup failed. Try again later.");
    } finally {
      setIsAiLookupLoading(false);
    }
  };

  const resetAssetForm = () => {
    setAssetForm({
      name: '',
      serial_number: '',
      manufacturer: '',
      model: '',
      category_id: '',
      office_location_id: '',
      status: 'active',
      condition: 'good',
      assigned_to: '',
      purchase_price: undefined,
      purchase_date: '',
      warranty_expiry: '',
      notes: ''
    });
  };

  const openEditAsset = (asset: Asset) => {
    setAssetForm({
      name: asset.name,
      serial_number: asset.serial_number || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      category_id: asset.category_id || '',
      office_location_id: asset.office_location_id || '',
      status: asset.status,
      condition: asset.condition,
      assigned_to: asset.assigned_to || '',
      purchase_price: asset.purchase_price || undefined,
      purchase_date: asset.purchase_date || '',
      warranty_expiry: asset.warranty_expiry || '',
      notes: asset.notes || ''
    });
    setEditingAsset(asset);
    setShowAddAsset(true);
  };

  const handleAddLocation = () => {
    if (!locationForm.name.trim()) return;
    createLocation(locationForm);
    setShowAddLocation(false);
    setLocationForm({ name: '', address: '', city: '', state: '', country: 'USA', postal_code: '', is_primary: false });
  };

  const handleRefreshWarranty = async (asset: Asset) => {
    setRefreshingAssetId(asset.id);
    await refreshWarranty(asset);
    setRefreshingAssetId(null);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Name', 'Serial Number', 'Manufacturer', 'Model', 'Category', 'Status', 'Condition', 'Location', 'Assigned To', 'Purchase Price', 'Warranty Expiry'];
    const rows = filteredAssets.map(a => [
      a.name,
      a.serial_number || '',
      a.manufacturer || '',
      a.model || '',
      a.category?.name || '',
      a.status,
      a.condition,
      a.office_location?.name || a.location || '',
      a.assigned_to || '',
      a.purchase_price?.toString() || '',
      a.warranty_expiry || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safetrack-assets-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Asset Inventory</h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Track hardware, warranties, and locations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleExport} variant="outline" size="sm" className="border-white/10 hover:bg-white/5 touch-target flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button onClick={() => setShowAddLocation(true)} variant="outline" size="sm" className="border-white/10 hover:bg-white/5 touch-target flex-1 sm:flex-none">
            <Building2 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Location</span>
          </Button>
          <Button onClick={() => { resetAssetForm(); setEditingAsset(null); setShowAddAsset(true); }} size="sm" className="bg-emerald-500 hover:bg-emerald-600 touch-target flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-[#141414] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Assets</CardTitle>
            <Package className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-[10px] sm:text-xs text-gray-500">{stats.active} active</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Value</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-white">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500">Portfolio</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Maintenance</CardTitle>
            <RefreshCw className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.maintenance}</div>
            <p className="text-[10px] sm:text-xs text-gray-500">Attention</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">Expiring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.expiringSoon}</div>
            <p className="text-[10px] sm:text-xs text-gray-500">Warranties</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#141414] border-white/10 touch-target text-base"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1 min-w-[120px] sm:w-[150px] sm:flex-none bg-[#141414] border-white/10 touch-target">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="flex-1 min-w-[120px] sm:w-[150px] sm:flex-none bg-[#141414] border-white/10 touch-target">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {officeLocations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="flex-1 min-w-[100px] sm:w-[130px] sm:flex-none bg-[#141414] border-white/10 touch-target">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className={selectedCategory === 'all' ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-white/10 hover:bg-white/5'}
        >
          All ({stats.total})
        </Button>
        {stats.byCategory.filter(c => c.count > 0).map(cat => {
          const Icon = getCategoryIcon(cat.icon);
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-white/10 hover:bg-white/5'}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {cat.name} ({cat.count})
            </Button>
          );
        })}
      </div>

      {/* Assets Table */}
      <Card className="bg-[#141414] border-white/5">
        <ScrollArea className="h-[500px]">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#141414] z-10">
              <tr className="border-b border-white/5">
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Condition</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">Assigned To</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Location</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden xl:table-cell">Warranty</th>
                <th className="h-12 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
                <th className="h-12 px-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No assets found</p>
                      <p className="text-gray-500 text-sm">Add your first asset to get started</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset, index) => {
                    const Icon = getCategoryIcon(asset.category?.icon);
                    const warrantyStatus = getWarrantyIndicator(asset);

                    return (
                      <motion.tr
                        key={asset.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10">
                              <Icon className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-white">{asset.name}</p>
                              <p className="text-xs text-gray-500">
                                {asset.serial_number ? `S/N: ${asset.serial_number}` : asset.manufacturer}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-sm text-gray-300">{asset.category?.name || '-'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={getStatusStyle(asset.status)}>
                            {asset.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <Badge variant="outline" className={getConditionStyle(asset.condition)}>
                            {asset.condition}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className="text-sm text-gray-300">{asset.assigned_to || '-'}</span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="text-sm text-gray-300">
                              {asset.office_location?.name || asset.location || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          {warrantyStatus ? (
                            <div className="flex items-center gap-1.5">
                              <warrantyStatus.icon className={`h-3.5 w-3.5 ${warrantyStatus.color}`} />
                              <span className={`text-xs ${warrantyStatus.color}`}>
                                {asset.warranty_expiry ? format(new Date(asset.warranty_expiry), 'MMM yyyy') : warrantyStatus.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-white">
                            ${(asset.current_value || asset.purchase_price || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                              <DropdownMenuItem onClick={() => openEditAsset(asset)} className="text-gray-300 focus:text-white focus:bg-white/10">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {asset.serial_number && (
                                <DropdownMenuItem 
                                  onClick={() => handleRefreshWarranty(asset)}
                                  disabled={refreshingAssetId === asset.id}
                                  className="text-gray-300 focus:text-white focus:bg-white/10"
                                >
                                  {refreshingAssetId === asset.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Shield className="h-4 w-4 mr-2" />
                                  )}
                                  Check Warranty
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem 
                                onClick={() => deleteAsset(asset.id)}
                                className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </ScrollArea>
      </Card>

      {/* Add/Edit Asset Dialog */}
      <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
        <DialogContent className="max-w-2xl bg-[#0a0a0a] border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the details for this hardware asset
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* AI Lookup Section */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Wand2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white mb-1">AI-Powered Serial Lookup</h4>
                  <p className="text-xs text-gray-400 mb-3">
                    Enter a serial number below and click "Identify" to auto-fill manufacturer and model info. You can edit all fields before saving.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter serial number..."
                      value={assetForm.serial_number}
                      onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                      className="bg-[#0a0a0a] border-white/10 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleAiLookup}
                      disabled={isAiLookupLoading || !assetForm.serial_number?.trim()}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isAiLookupLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Identify
                        </>
                      )}
                    </Button>
                  </div>
                  {aiLookupResult && (
                    <div className="mt-3 p-2 rounded bg-[#0a0a0a] border border-white/10">
                      <p className="text-xs text-emerald-400 mb-1">
                        <CheckCircle2 className="h-3 w-3 inline mr-1" />
                        AI identified: <span className="font-medium">{aiLookupResult.manufacturer} {aiLookupResult.model}</span>
                      </p>
                      {aiLookupResult.notes && (
                        <p className="text-xs text-gray-500">{aiLookupResult.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Dell OptiPlex 7090"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial">Serial Number</Label>
                <Input
                  id="serial"
                  placeholder="e.g., DL789456123"
                  value={assetForm.serial_number}
                  onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">
                  Manufacturer
                  {aiLookupResult && <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">AI Filled</Badge>}
                </Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g., Dell, HP, Lenovo"
                  value={assetForm.manufacturer}
                  onChange={(e) => setAssetForm({ ...assetForm, manufacturer: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">
                  Model
                  {aiLookupResult && <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">AI Filled</Badge>}
                </Label>
                <Input
                  id="model"
                  placeholder="e.g., Latitude 5520"
                  value={assetForm.model}
                  onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Category
                  {aiLookupResult && <Badge variant="outline" className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">AI Suggested</Badge>}
                </Label>
                <Select
                  value={assetForm.category_id || ''}
                  onValueChange={(value) => setAssetForm({ ...assetForm, category_id: value })}
                >
                  <SelectTrigger className="bg-[#141414] border-white/10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Office Location</Label>
                <Select
                  value={assetForm.office_location_id || ''}
                  onValueChange={(value) => setAssetForm({ ...assetForm, office_location_id: value })}
                >
                  <SelectTrigger className="bg-[#141414] border-white/10">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {officeLocations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={assetForm.status || 'active'}
                  onValueChange={(value) => setAssetForm({ ...assetForm, status: value })}
                >
                  <SelectTrigger className="bg-[#141414] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={assetForm.condition || 'good'}
                  onValueChange={(value) => setAssetForm({ ...assetForm, condition: value })}
                >
                  <SelectTrigger className="bg-[#141414] border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assigned">Assigned To</Label>
                <Input
                  id="assigned"
                  placeholder="e.g., John Smith"
                  value={assetForm.assigned_to}
                  onChange={(e) => setAssetForm({ ...assetForm, assigned_to: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Purchase Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={assetForm.purchase_price || ''}
                  onChange={(e) => setAssetForm({ ...assetForm, purchase_price: parseFloat(e.target.value) || undefined })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={assetForm.purchase_date}
                  onChange={(e) => setAssetForm({ ...assetForm, purchase_date: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                <Input
                  id="warranty_expiry"
                  type="date"
                  value={assetForm.warranty_expiry}
                  onChange={(e) => setAssetForm({ ...assetForm, warranty_expiry: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this asset..."
                value={assetForm.notes}
                onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })}
                className="bg-[#141414] border-white/10"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAsset(false)} className="border-white/10">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveAsset} 
              disabled={!assetForm.name.trim() || isCreating || isUpdating}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {(isCreating || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAsset ? 'Update Asset' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
        <DialogContent className="bg-[#0a0a0a] border-emerald-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Add Office Location</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new office or site for multi-location tracking
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="loc_name">Location Name *</Label>
              <Input
                id="loc_name"
                placeholder="e.g., Main Office, Branch Office"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                className="bg-[#141414] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Street address"
                value={locationForm.address}
                onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                className="bg-[#141414] border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={locationForm.city}
                  onChange={(e) => setLocationForm({ ...locationForm, city: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={locationForm.state}
                  onChange={(e) => setLocationForm({ ...locationForm, state: e.target.value })}
                  className="bg-[#141414] border-white/10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddLocation(false)} className="border-white/10">
              Cancel
            </Button>
            <Button 
              onClick={handleAddLocation} 
              disabled={!locationForm.name.trim()}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Add Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};