/**
 * SafeSuite Web - Dark Web Monitoring within SafeSuite
 */

import { useState, useEffect } from 'react';
import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Globe,
  Shield,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  CreditCard,
  Hash,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MonitoredAsset {
  id: string;
  asset_type: string;
  asset_value: string;
  status: string;
  last_scan_at: string | null;
  threats_found: number;
  created_at: string;
}

export default function SafeSuiteWeb() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [assets, setAssets] = useState<MonitoredAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [newAsset, setNewAsset] = useState('');
  const [assetType, setAssetType] = useState<'email' | 'domain' | 'credit_card'>('email');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: assetsData, error: assetsError } = await supabase
        .from('safeweb_assets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (assetsError) throw assetsError;
      setAssets(assetsData || []);
    } catch (error) {
      console.error('Error loading SafeWeb data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async () => {
    if (!newAsset.trim()) return;

    try {
      const { data, error } = await supabase
        .from('safeweb_assets')
        .insert({
          user_id: user?.id,
          asset_type: assetType,
          asset_value: newAsset.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setAssets([data, ...assets]);
      setNewAsset('');
      
      toast({
        title: "Asset added",
        description: "Monitoring has been initiated for this asset"
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: "Error",
        description: "Failed to add asset for monitoring",
        variant: "destructive"
      });
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('safeweb_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      setAssets(assets.filter(a => a.id !== assetId));
      toast({ title: "Asset removed from monitoring" });
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'credit_card': return <CreditCard className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <FeatureGate feature="safeweb">
      <div className="space-y-6 bg-[#0a0a0a] min-h-full p-6 -m-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-violet-500">
              <Eye className="h-6 w-6 text-violet-500" />
              SafeWeb
            </h1>
            <p className="text-gray-400">
              Monitor the dark web for your exposed credentials and data
            </p>
          </div>
          <Button variant="outline" onClick={() => loadData()} disabled={scanning} className="border-violet-500/30 text-violet-500 hover:bg-violet-500/10">
            <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <UsageLimitBanner feature="safeweb" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#141414] border-violet-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Eye className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{assets.length}</p>
                  <p className="text-sm text-gray-400">Monitored Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-violet-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">
                    {assets.reduce((acc, a) => acc + (a.threats_found || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-400">Threats Found</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-violet-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    {assets.filter(a => a.status === 'clean').length}
                  </p>
                  <p className="text-sm text-gray-400">Clean Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add new asset */}
        <Card className="bg-[#141414] border-violet-500/10">
          <CardHeader>
            <CardTitle className="text-lg text-white">Add Asset to Monitor</CardTitle>
            <CardDescription className="text-gray-400">
              Add emails, domains, or other identifiers to monitor on the dark web
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as any)}
                className="px-3 py-2 border border-violet-500/20 rounded-md bg-[#1a1a1a] text-white"
              >
                <option value="email">Email</option>
                <option value="domain">Domain</option>
                <option value="credit_card">Credit Card (last 4)</option>
              </select>
              <Input
                placeholder={
                  assetType === 'email' ? 'Enter email address...' :
                  assetType === 'domain' ? 'Enter domain...' :
                  'Enter last 4 digits...'
                }
                value={newAsset}
                onChange={(e) => setNewAsset(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border-violet-500/20 text-white"
              />
              <Button onClick={addAsset} disabled={!newAsset.trim()} className="bg-violet-500 hover:bg-violet-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assets list */}
        <div className="space-y-2">
          {assets.length === 0 ? (
            <Card className="bg-[#141414] border-violet-500/10">
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                <p className="text-lg font-medium text-white">No assets monitored yet</p>
                <p className="text-gray-400">
                  Add an email or domain above to start monitoring
                </p>
              </CardContent>
            </Card>
          ) : (
            assets.map((asset) => (
              <Card key={asset.id} className="bg-[#141414] border-violet-500/10 hover:border-violet-500/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-500/20 rounded-lg">
                        {getAssetIcon(asset.asset_type)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{asset.asset_value}</p>
                        <p className="text-sm text-gray-400">
                          {asset.asset_type} • Last scanned: {
                            asset.last_scan_at 
                              ? new Date(asset.last_scan_at).toLocaleDateString()
                              : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={asset.status === 'clean' ? 'outline' : 'destructive'} className={asset.status === 'clean' ? 'border-green-500/30 text-green-500' : ''}>
                        {asset.status === 'clean' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Clean</>
                        ) : asset.status === 'exposed' ? (
                          <><XCircle className="h-3 w-3 mr-1" /> Exposed</>
                        ) : (
                          'Pending'
                        )}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAsset(asset.id)}
                        className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </FeatureGate>
  );
}
