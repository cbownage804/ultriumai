import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSafeWebData, SafeWebAsset } from "@/hooks/useSafeWebData";
import { useWraythUsage } from "@/hooks/useSafeSuite";
import { 
  Plus, 
  Search, 
  Globe, 
  User, 
  Building, 
  Network, 
  Mail,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  clientId?: string;
  showAddForm?: boolean;
}

export const SafeWebAssetManager = ({ clientId, showAddForm = true }: Props) => {
  const { assets, loading, addAsset, updateAsset, deleteAsset, triggerScan, fetchAssets } = useSafeWebData();
  const { toast } = useToast();
  const { refreshUsage } = useWraythUsage();
  
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({
    asset_type: 'email',
    asset_value: '',
    scan_frequency: 'daily'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_value.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientId ? asset.msp_client_id === clientId : true;
    return matchesSearch && matchesClient;
  });

  const handleAddAsset = async () => {
    if (!newAsset.asset_value.trim()) {
      toast({
        title: "Error",
        description: "Asset value is required",
        variant: "destructive"
      });
      return;
    }

    setIsAddingAsset(true);
    const result = await addAsset({
      ...newAsset,
      msp_client_id: clientId
    });

    if (result.success) {
      // Refresh usage count for tier limit display
      refreshUsage();
      
      toast({
        title: "Success",
        description: "Asset added and scan initiated"
      });
      setNewAsset({
        asset_type: 'email',
        asset_value: '',
        scan_frequency: 'daily'
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add asset",
        variant: "destructive"
      });
    }
    setIsAddingAsset(false);
  };

  const handleStatusToggle = async (asset: SafeWebAsset) => {
    const newStatus = asset.status === 'active' ? 'paused' : 'active';
    const result = await updateAsset(asset.id, { status: newStatus });
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Asset ${newStatus === 'active' ? 'activated' : 'paused'}`
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update asset status",
        variant: "destructive"
      });
    }
  };

  const handleScanAsset = async (assetId: string) => {
    const result = await triggerScan(assetId);
    
    if (result.success) {
      toast({
        title: "Scan Started",
        description: "Dark web scan initiated for this asset"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to start scan",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAsset = async (assetId: string, assetValue: string) => {
    if (!confirm(`Are you sure you want to delete asset "${assetValue}"?`)) {
      return;
    }

    const result = await deleteAsset(assetId);
    
    if (result.success) {
      // Refresh usage count for tier limit display
      refreshUsage();
      
      toast({
        title: "Success",
        description: "Asset deleted successfully"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive"
      });
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'domain': return Globe;
      case 'brand': return Building;
      case 'executive': return User;
      case 'ip_range': return Network;
      default: return Globe;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 5) return 'text-yellow-600';
    if (count <= 15) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading assets...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Asset */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Asset
            </CardTitle>
            <CardDescription>
              Add emails, domains, brands, or executives to monitor on the dark web
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select 
                value={newAsset.asset_type} 
                onValueChange={(value) => setNewAsset({...newAsset, asset_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email Address</SelectItem>
                  <SelectItem value="domain">🌐 Domain</SelectItem>
                  <SelectItem value="brand">🏢 Brand Name</SelectItem>
                  <SelectItem value="executive">👤 Executive Name</SelectItem>
                  <SelectItem value="ip_range">🌐 IP Range</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Enter asset value..."
                value={newAsset.asset_value}
                onChange={(e) => setNewAsset({...newAsset, asset_value: e.target.value})}
              />

              <Select 
                value={newAsset.scan_frequency} 
                onValueChange={(value) => setNewAsset({...newAsset, scan_frequency: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAddAsset} 
                disabled={isAddingAsset}
                className="w-full"
              >
                {isAddingAsset ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => fetchAssets()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Assets List */}
      {filteredAssets.length === 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {searchTerm ? 'No assets match your search criteria.' : 'No assets found. Add your first asset to start monitoring.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAssets.map((asset) => {
            const IconComponent = getAssetIcon(asset.asset_type);
            const nextScan = new Date(asset.next_scan_at);
            const isOverdue = nextScan < new Date() && asset.status === 'active';

            return (
              <Card key={asset.id} className={`border-l-4 ${
                asset.threats_found > 0 ? 'border-l-red-500' : 'border-l-green-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{asset.asset_value}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {asset.asset_type.replace('_', ' ')} • {asset.scan_frequency} scans
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                      {isOverdue && (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${getSeverityColor(asset.threats_found)}`}>
                        {asset.threats_found}
                      </p>
                      <p className="text-sm text-muted-foreground">Threats Found</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Last Scan</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.last_scan_at 
                          ? new Date(asset.last_scan_at).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Next Scan</p>
                      <p className="text-sm text-muted-foreground">
                        {nextScan.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Added</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {asset.threats_found > 0 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {asset.threats_found} Threat{asset.threats_found !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {asset.threats_found === 0 && asset.last_scan_at && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Clean
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScanAsset(asset.id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Scan Now
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusToggle(asset)}
                      >
                        {asset.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAsset(asset.id, asset.asset_value)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};