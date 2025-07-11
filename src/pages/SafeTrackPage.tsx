import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Monitor,
  Laptop,
  Server,
  Network,
  Smartphone,
  Printer,
  HardDrive,
  Mouse,
  Code,
  Package,
  Calendar as CalendarIcon,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  History,
  Download,
  Upload,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  MapPin,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Asset {
  id: string;
  name: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost' | 'disposed';
  category_id?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  current_value?: number;
  location?: string;
  assigned_to?: string;
  asset_tag?: string;
  specifications?: any;
  notes?: string;
  category?: {
    name: string;
    icon: string;
  };
}

interface SoftwareAsset {
  id: string;
  name: string;
  version?: string;
  vendor?: string;
  license_type: 'perpetual' | 'subscription' | 'volume' | 'oem' | 'trial';
  seats_total: number;
  seats_used: number;
  purchase_date?: string;
  expiry_date?: string;
  cost_per_license?: number;
  compliance_status: 'compliant' | 'over_licensed' | 'under_licensed' | 'expired';
}

interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
}

const SafeTrackPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [softwareAssets, setSoftwareAssets] = useState<SoftwareAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddSoftware, setShowAddSoftware] = useState(false);
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  
  const [assetForm, setAssetForm] = useState({
    name: '',
    serial_number: '',
    model: '',
    manufacturer: '',
    category_id: '',
    purchase_date: undefined as Date | undefined,
    purchase_price: '',
    warranty_expiry: undefined as Date | undefined,
    location: '',
    assigned_to: '',
    asset_tag: '',
    specifications: '{}',
    notes: '',
    status: 'active' as const
  });

  const [softwareForm, setSoftwareForm] = useState({
    name: '',
    version: '',
    vendor: '',
    license_type: 'perpetual' as const,
    seats_total: 1,
    purchase_date: undefined as Date | undefined,
    expiry_date: undefined as Date | undefined,
    cost_per_license: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');
      
      if (categoriesData) setCategories(categoriesData);

      // Load assets
      const { data: assetsData } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(name, icon)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (assetsData) setAssets(assetsData as Asset[]);

      // Load software assets
      const { data: softwareData } = await supabase
        .from('software_assets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (softwareData) setSoftwareAssets(softwareData as SoftwareAsset[]);

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load asset data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async () => {
    if (!user || !assetForm.name) return;

    try {
      const assetData = {
        user_id: user.id,
        name: assetForm.name,
        serial_number: assetForm.serial_number || null,
        model: assetForm.model || null,
        manufacturer: assetForm.manufacturer || null,
        category_id: assetForm.category_id || null,
        purchase_date: assetForm.purchase_date ? format(assetForm.purchase_date, 'yyyy-MM-dd') : null,
        purchase_price: assetForm.purchase_price ? parseFloat(assetForm.purchase_price) : null,
        warranty_expiry: assetForm.warranty_expiry ? format(assetForm.warranty_expiry, 'yyyy-MM-dd') : null,
        location: assetForm.location || null,
        assigned_to: assetForm.assigned_to || null,
        asset_tag: assetForm.asset_tag || null,
        specifications: assetForm.specifications ? JSON.parse(assetForm.specifications) : {},
        notes: assetForm.notes || null,
        status: assetForm.status
      };

      const { error } = await supabase
        .from('assets')
        .insert([assetData]);

      if (error) throw error;

      toast({
        title: "Asset Added",
        description: "Asset has been successfully added to SafeTrack",
      });

      setShowAddAsset(false);
      setAssetForm({
        name: '', serial_number: '', model: '', manufacturer: '', category_id: '',
        purchase_date: undefined, purchase_price: '', warranty_expiry: undefined,
        location: '', assigned_to: '', asset_tag: '', specifications: '{}',
        notes: '', status: 'active'
      });
      loadData();

    } catch (error) {
      console.error('Error creating asset:', error);
      toast({
        title: "Error",
        description: "Failed to add asset",
        variant: "destructive",
      });
    }
  };

  const handleCreateSoftware = async () => {
    if (!user || !softwareForm.name) return;

    try {
      const softwareData = {
        user_id: user.id,
        name: softwareForm.name,
        version: softwareForm.version || null,
        vendor: softwareForm.vendor || null,
        license_type: softwareForm.license_type,
        seats_total: softwareForm.seats_total,
        purchase_date: softwareForm.purchase_date ? format(softwareForm.purchase_date, 'yyyy-MM-dd') : null,
        expiry_date: softwareForm.expiry_date ? format(softwareForm.expiry_date, 'yyyy-MM-dd') : null,
        cost_per_license: softwareForm.cost_per_license ? parseFloat(softwareForm.cost_per_license) : null
      };

      const { error } = await supabase
        .from('software_assets')
        .insert([softwareData]);

      if (error) throw error;

      toast({
        title: "Software Added",
        description: "Software license has been successfully added to SafeTrack",
      });

      setShowAddSoftware(false);
      setSoftwareForm({
        name: '', version: '', vendor: '', license_type: 'perpetual',
        seats_total: 1, purchase_date: undefined, expiry_date: undefined,
        cost_per_license: ''
      });
      loadData();

    } catch (error) {
      console.error('Error creating software:', error);
      toast({
        title: "Error",
        description: "Failed to add software",
        variant: "destructive",
      });
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      monitor: Monitor, laptop: Laptop, server: Server, network: Network,
      smartphone: Smartphone, printer: Printer, 'hard-drive': HardDrive,
      mouse: Mouse, code: Code
    };
    return icons[iconName] || Package;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/30';
      case 'maintenance': return 'bg-warning/10 text-warning border-warning/30';
      case 'retired': return 'bg-muted/10 text-muted-foreground border-muted/30';
      case 'lost': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'disposed': return 'bg-secondary/10 text-secondary-foreground border-secondary/30';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-success/10 text-success border-success/30';
      case 'over_licensed': return 'bg-primary/10 text-primary border-primary/30';
      case 'under_licensed': return 'bg-warning/10 text-warning border-warning/30';
      case 'expired': return 'bg-destructive/10 text-destructive border-destructive/30';
      default: return 'bg-muted/10 text-muted-foreground border-muted/30';
    }
  };

  const handleAiSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setAiSearchLoading(true);
    try {
      // Use AI to search through assets with natural language
      const { data, error } = await supabase.functions.invoke('ai-asset-search', {
        body: { 
          query,
          assets: assets.map(asset => ({
            id: asset.id,
            name: asset.name,
            model: asset.model,
            manufacturer: asset.manufacturer,
            category: asset.category?.name,
            location: asset.location,
            assigned_to: asset.assigned_to,
            status: asset.status,
            specifications: asset.specifications,
            notes: asset.notes
          }))
        }
      });

      if (error) throw error;

      if (data?.matches && data.matches.length > 0) {
        const matchedIds = data.matches.map((match: any) => match.id);
        setAssets(prev => prev.map(asset => ({
          ...asset,
          isAiMatch: matchedIds.includes(asset.id)
        })));
        
        toast({
          title: "AI Search Complete",
          description: `Found ${data.matches.length} matching assets`,
        });
      } else {
        toast({
          title: "No matches found",
          description: "Try a different search query",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast({
        title: "Search Error",
        description: "AI search is temporarily unavailable",
        variant: "destructive",
      });
    } finally {
      setAiSearchLoading(false);
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (aiSearchMode && (asset as any).isAiMatch === false) return false;
    
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const calculateMetrics = () => {
    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => a.status === 'active').length;
    const maintenanceAssets = assets.filter(a => a.status === 'maintenance').length;
    const totalValue = assets.reduce((sum, asset) => sum + (asset.current_value || asset.purchase_price || 0), 0);
    
    const totalLicenses = softwareAssets.reduce((sum, software) => sum + software.seats_total, 0);
    const usedLicenses = softwareAssets.reduce((sum, software) => sum + software.seats_used, 0);
    const expiringSoon = softwareAssets.filter(s => {
      if (!s.expiry_date) return false;
      const expiryDate = new Date(s.expiry_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    }).length;

    return {
      totalAssets,
      activeAssets,
      maintenanceAssets,
      totalValue,
      totalLicenses,
      usedLicenses,
      expiringSoon
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/msp-control-center')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center gap-3">
                <Package className="h-10 w-10 text-primary" />
                SafeTrack
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              IT Asset Management • {metrics.totalAssets} assets • ${metrics.totalValue.toFixed(0)} total value
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Dialog open={showAddAsset} onOpenChange={setShowAddAsset}>
              <DialogTrigger asChild>
                <Button className="bg-primary/90 hover:bg-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="asset_name">Asset Name *</Label>
                      <Input
                        id="asset_name"
                        value={assetForm.name}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Dell OptiPlex 7090"
                      />
                    </div>
                    <div>
                      <Label htmlFor="asset_category">Category</Label>
                      <Select value={assetForm.category_id} onValueChange={(value) => setAssetForm(prev => ({ ...prev, category_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={assetForm.manufacturer}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                        placeholder="Dell"
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={assetForm.model}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="OptiPlex 7090"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serial_number">Serial Number</Label>
                      <Input
                        id="serial_number"
                        value={assetForm.serial_number}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, serial_number: e.target.value }))}
                        placeholder="ABC123456789"
                      />
                    </div>
                    <div>
                      <Label htmlFor="asset_tag">Asset Tag</Label>
                      <Input
                        id="asset_tag"
                        value={assetForm.asset_tag}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, asset_tag: e.target.value }))}
                        placeholder="IT-001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Purchase Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !assetForm.purchase_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {assetForm.purchase_date ? format(assetForm.purchase_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={assetForm.purchase_date}
                            onSelect={(date) => setAssetForm(prev => ({ ...prev, purchase_date: date }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="purchase_price">Purchase Price</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        value={assetForm.purchase_price}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, purchase_price: e.target.value }))}
                        placeholder="999.99"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Warranty Expiry</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !assetForm.warranty_expiry && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {assetForm.warranty_expiry ? format(assetForm.warranty_expiry, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={assetForm.warranty_expiry}
                            onSelect={(date) => setAssetForm(prev => ({ ...prev, warranty_expiry: date }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={assetForm.status} onValueChange={(value: any) => setAssetForm(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={assetForm.location}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Office Floor 2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="assigned_to">Assigned To</Label>
                      <Input
                        id="assigned_to"
                        value={assetForm.assigned_to}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={assetForm.notes}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes about this asset..."
                    />
                  </div>

                  <Button onClick={handleCreateAsset} className="w-full" disabled={!assetForm.name}>
                    Add Asset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddSoftware} onOpenChange={setShowAddSoftware}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Code className="h-4 w-4 mr-2" />
                  Add Software
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Software License</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="software_name">Software Name *</Label>
                      <Input
                        id="software_name"
                        value={softwareForm.name}
                        onChange={(e) => setSoftwareForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Microsoft Office 365"
                      />
                    </div>
                    <div>
                      <Label htmlFor="version">Version</Label>
                      <Input
                        id="version"
                        value={softwareForm.version}
                        onChange={(e) => setSoftwareForm(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="2023"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vendor">Vendor</Label>
                      <Input
                        id="vendor"
                        value={softwareForm.vendor}
                        onChange={(e) => setSoftwareForm(prev => ({ ...prev, vendor: e.target.value }))}
                        placeholder="Microsoft"
                      />
                    </div>
                    <div>
                      <Label htmlFor="license_type">License Type</Label>
                      <Select value={softwareForm.license_type} onValueChange={(value: any) => setSoftwareForm(prev => ({ ...prev, license_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="perpetual">Perpetual</SelectItem>
                          <SelectItem value="subscription">Subscription</SelectItem>
                          <SelectItem value="volume">Volume</SelectItem>
                          <SelectItem value="oem">OEM</SelectItem>
                          <SelectItem value="trial">Trial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="seats_total">Total Seats</Label>
                      <Input
                        id="seats_total"
                        type="number"
                        value={softwareForm.seats_total}
                        onChange={(e) => setSoftwareForm(prev => ({ ...prev, seats_total: parseInt(e.target.value) || 1 }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost_per_license">Cost per License</Label>
                      <Input
                        id="cost_per_license"
                        type="number"
                        value={softwareForm.cost_per_license}
                        onChange={(e) => setSoftwareForm(prev => ({ ...prev, cost_per_license: e.target.value }))}
                        placeholder="99.99"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Purchase Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !softwareForm.purchase_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {softwareForm.purchase_date ? format(softwareForm.purchase_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={softwareForm.purchase_date}
                            onSelect={(date) => setSoftwareForm(prev => ({ ...prev, purchase_date: date }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !softwareForm.expiry_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {softwareForm.expiry_date ? format(softwareForm.expiry_date, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={softwareForm.expiry_date}
                            onSelect={(date) => setSoftwareForm(prev => ({ ...prev, expiry_date: date }))}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <Button onClick={handleCreateSoftware} className="w-full" disabled={!softwareForm.name}>
                    Add Software License
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{metrics.totalAssets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.activeAssets} active • {metrics.maintenanceAssets} in maintenance
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">${metrics.totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Current asset portfolio value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Code className="h-4 w-4" />
                Software Licenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{metrics.usedLicenses}/{metrics.totalLicenses}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Licenses used
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{metrics.expiringSoon}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Licenses expiring in 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Asset Inventory
                </CardTitle>
                <CardDescription>Comprehensive IT asset and software license management</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hardware" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hardware">Hardware Assets</TabsTrigger>
                <TabsTrigger value="software">Software Licenses</TabsTrigger>
              </TabsList>

              <TabsContent value="hardware" className="space-y-4">
                {filteredAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No assets found</h3>
                    <p className="text-muted-foreground mb-4">
                      {assets.length === 0 ? "Get started by adding your first asset" : "Try adjusting your search filters"}
                    </p>
                    <Button onClick={() => setShowAddAsset(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Asset
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAssets.map((asset) => {
                      const IconComponent = getIconComponent(asset.category?.icon || 'package');
                      return (
                        <Card key={asset.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10">
                                  <IconComponent className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-sm">{asset.name}</h3>
                                  <p className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={cn("text-xs", getStatusColor(asset.status))}>
                                {asset.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {asset.serial_number && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground">S/N:</span>
                                <span className="font-mono">{asset.serial_number}</span>
                              </div>
                            )}
                            {asset.location && (
                              <div className="flex items-center gap-2 text-xs">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span>{asset.location}</span>
                              </div>
                            )}
                            {asset.assigned_to && (
                              <div className="flex items-center gap-2 text-xs">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>{asset.assigned_to}</span>
                              </div>
                            )}
                            {asset.purchase_price && (
                              <div className="flex items-center gap-2 text-xs">
                                <DollarSign className="h-3 w-3 text-muted-foreground" />
                                <span>${asset.purchase_price.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex gap-1 pt-2">
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2">
                                <Wrench className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="software" className="space-y-4">
                {softwareAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No software licenses found</h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking your software licenses and ensure compliance
                    </p>
                    <Button onClick={() => setShowAddSoftware(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First License
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {softwareAssets.map((software) => (
                      <Card key={software.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-secondary/10">
                                <Code className="h-5 w-5 text-secondary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-sm">{software.name}</h3>
                                <p className="text-xs text-muted-foreground">{software.vendor} {software.version}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn("text-xs", getComplianceColor(software.compliance_status))}>
                              {software.compliance_status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">License Usage:</span>
                            <span className="font-medium">{software.seats_used}/{software.seats_total}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${(software.seats_used / software.seats_total) * 100}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="secondary" className="text-xs">
                              {software.license_type}
                            </Badge>
                          </div>
                          {software.expiry_date && (
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>Expires: {format(new Date(software.expiry_date), 'MMM d, yyyy')}</span>
                            </div>
                          )}
                          {software.cost_per_license && (
                            <div className="flex items-center gap-2 text-xs">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span>${software.cost_per_license}/license</span>
                            </div>
                          )}
                          <div className="flex gap-1 pt-2">
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2">
                              <History className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SafeTrackPage;