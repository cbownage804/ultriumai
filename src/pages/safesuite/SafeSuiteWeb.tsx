/**
 * Wrayth Web - Dark Web Monitoring within Wrayth
 */

import { useState, useEffect } from 'react';
import { FeatureGate, UsageLimitBanner } from '@/components/safesuite/SafeSuitePaywall';
import { useAuth } from '@/hooks/useAuth';
import { useFeatureAccess, useWraythUsage } from '@/hooks/useSafeSuite';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sparkles } from 'lucide-react';
import { AIRecommendationsDisplay } from '@/components/safeweb/AIRecommendationsDisplay';
import { RayConversationCard } from '@/components/ray/RayConversationCard';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import {
  Globe,
  Shield,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Mail,
  Hash,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Database,
  ShieldAlert,
  Info
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

interface ThreatDetails {
  id: string;
  threat_type: string;
  title: string;
  description: string;
  severity: string;
  confidence_score: number;
  status: string;
  source_name: string;
  source_url: string;
  raw_data: any;
  affected_assets: string[];
  threat_indicators: any;
  first_seen: string;
  last_seen: string;
  tags: string[];
  created_at: string;
}

export default function WraythWeb() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { checkFeatureAccess } = useFeatureAccess();
  const { refreshUsage } = useWraythUsage();
  
  const [assets, setAssets] = useState<MonitoredAsset[]>([]);
  const [threats, setThreats] = useState<Record<string, ThreatDetails[]>>({});
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingThreats, setLoadingThreats] = useState<Set<string>>(new Set());
  const [scanningAssetId, setScanningAssetId] = useState<string | null>(null);
  const [newAsset, setNewAsset] = useState('');
  const [assetType, setAssetType] = useState<'email' | 'domain' | 'brand'>('email');
  const [selectedThreat, setSelectedThreat] = useState<ThreatDetails | null>(null);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

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
      console.error('Error loading Watch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThreatsForAsset = async (assetId: string) => {
    if (threats[assetId]) return; // Already loaded
    
    setLoadingThreats(prev => new Set(prev).add(assetId));
    try {
      const { data, error } = await supabase
        .from('safeweb_threats')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThreats(prev => ({ ...prev, [assetId]: data || [] }));
    } catch (error) {
      console.error('Error loading threats:', error);
    } finally {
      setLoadingThreats(prev => {
        const next = new Set(prev);
        next.delete(assetId);
        return next;
      });
    }
  };

  const generateAiRecommendation = async (threat: ThreatDetails) => {
    setLoadingRecommendation(true);
    setAiRecommendation(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('safeweb-ai-recommendations', {
        body: { threat }
      });

      if (error) throw error;
      
      if (data?.recommendation) {
        setAiRecommendation(data.recommendation);
      }
    } catch (error: any) {
      console.error('Error generating recommendation:', error);
      toast({
        title: "AI Recommendation Failed",
        description: error.message || "Could not generate recommendations",
        variant: "destructive"
      });
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Auto-generate recommendation when threat modal opens
  useEffect(() => {
    if (selectedThreat) {
      generateAiRecommendation(selectedThreat);
    } else {
      setAiRecommendation(null);
    }
  }, [selectedThreat]);

  const toggleAssetExpand = async (assetId: string) => {
    const isExpanded = expandedAssets.has(assetId);
    if (!isExpanded) {
      await loadThreatsForAsset(assetId);
    }
    setExpandedAssets(prev => {
      const next = new Set(prev);
      if (isExpanded) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const triggerScan = async (assetId: string) => {
    try {
      setScanningAssetId(assetId);
      
      const { data, error } = await supabase.functions.invoke('safeweb-scanner', {
        body: { asset_id: assetId, scan_type: 'manual' }
      });

      if (error) throw error;
      
      // Clear cached threats to force reload
      setThreats(prev => {
        const next = { ...prev };
        delete next[assetId];
        return next;
      });
      
      // Refresh data to get updated status
      await loadData();
      
      // Reload threats if expanded
      if (expandedAssets.has(assetId)) {
        await loadThreatsForAsset(assetId);
      }
      
      toast({
        title: "Scan completed",
        description: data?.threats_found > 0 
          ? `Found ${data.threats_found} threat(s)` 
          : "No threats detected - your asset appears clean"
      });
      
      return { success: true, data };
    } catch (error: any) {
      console.error('Error triggering scan:', error);
      toast({
        title: "Scan failed",
        description: error.message || "Failed to complete the scan",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setScanningAssetId(null);
    }
  };

  const addAsset = async () => {
    if (!newAsset.trim()) return;

    // Check limit before attempting to add
    const access = checkFeatureAccess('safeweb', 'use');
    if (!access.allowed) {
      toast({
        title: "Limit Reached",
        description: access.reason || "Please upgrade your plan to add more assets.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('safeweb_assets')
        .insert({
          user_id: user?.id,
          asset_type: assetType,
          asset_value: newAsset.trim(),
          status: 'active',
          scan_frequency: 'daily'
        })
        .select()
        .single();

      if (error) {
        // Handle server-side limit enforcement error
        if (error.message?.includes('Usage limit exceeded')) {
          toast({
            title: "Limit Reached",
            description: "You've reached your Watch asset limit. Please upgrade to add more.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      setAssets([data, ...assets]);
      setNewAsset('');
      
      // Refresh usage count for tier limit display
      refreshUsage();
      
      toast({
        title: "Asset added",
        description: "Starting initial scan..."
      });

      // Trigger initial scan automatically
      await triggerScan(data.id);
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
      
      // Refresh usage count for tier limit display
      refreshUsage();
      
      toast({ title: "Asset removed from monitoring" });
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'brand': return <Hash className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (asset: MonitoredAsset) => {
    if (!asset.last_scan_at) {
      return (
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">
          <Loader2 className="h-3 w-3 mr-1" /> Pending
        </Badge>
      );
    }
    
    if (asset.threats_found > 0) {
      return (
        <Badge variant="destructive" className="cursor-pointer" onClick={() => toggleAssetExpand(asset.id)}>
          <XCircle className="h-3 w-3 mr-1" /> {asset.threats_found} Threat{asset.threats_found > 1 ? 's' : ''}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-green-500/30 text-green-500">
        <CheckCircle className="h-3 w-3 mr-1" /> Clean
      </Badge>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
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
      <div className="space-y-6">
        <RayPageHeader
          title="Exposure"
          description="Monitoring the internet for compromised identities and leaked credentials."
          right={
            <Button variant="outline" onClick={() => loadData()} className="border-primary/30 text-primary hover:bg-primary/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          }
        />

        <RayConversationCard context="exposure" />




        {/* Unified stats — matches Passwords page rhythm */}
        {(() => {
          const totalThreats = assets.reduce((acc, a) => acc + (a.threats_found || 0), 0);
          const cleanCount = assets.filter((a) => a.last_scan_at && a.threats_found === 0).length;
          return (
            <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl sm:text-4xl font-extralight tabular-nums leading-none text-foreground">
                    {assets.length}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Watched
                  </div>
                </div>
                <button
                  type="button"
                  className="text-left"
                  onClick={async () => {
                    const withThreats = assets.filter((a) => a.threats_found > 0);
                    for (const asset of withThreats) {
                      if (!expandedAssets.has(asset.id)) {
                        await loadThreatsForAsset(asset.id);
                        setExpandedAssets((prev) => new Set(prev).add(asset.id));
                      }
                    }
                  }}
                >
                  <div
                    className={`text-3xl sm:text-4xl font-extralight tabular-nums leading-none ${
                      totalThreats > 0 ? 'text-amber-300' : 'text-foreground'
                    }`}
                  >
                    {totalThreats}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Exposures found
                  </div>
                </button>
                <div>
                  <div className="text-3xl sm:text-4xl font-extralight tabular-nums leading-none text-emerald-300">
                    {cleanCount}
                  </div>
                  <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Clean
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Add new asset */}
        <section className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Add an identity to monitor</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ray will scan the dark web and breach feeds for any mention of it.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as any)}
              className="px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm"
            >
              <option value="email">Email</option>
              <option value="domain">Domain</option>
              <option value="brand">Brand</option>
            </select>
            <Input
              placeholder={
                assetType === 'email'
                  ? 'Enter email address...'
                  : assetType === 'domain'
                  ? 'Enter domain...'
                  : 'Enter brand name...'
              }
              value={newAsset}
              onChange={(e) => setNewAsset(e.target.value)}
              className="flex-1 bg-background border-border text-foreground"
            />
            <Button
              onClick={addAsset}
              disabled={!newAsset.trim()}
              className="bg-violet-500 hover:bg-violet-400 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </section>

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
                      {getStatusBadge(asset)}
                      {asset.threats_found > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAssetExpand(asset.id)}
                          className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                        >
                          {expandedAssets.has(asset.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerScan(asset.id)}
                        disabled={scanningAssetId === asset.id}
                        className="border-violet-500/30 text-violet-500 hover:bg-violet-500/10"
                      >
                        {scanningAssetId === asset.id ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Scanning...</>
                        ) : (
                          <><RefreshCw className="h-3 w-3 mr-1" /> Scan</>
                        )}
                      </Button>
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

                  {/* Expandable threat details */}
                  {expandedAssets.has(asset.id) && (
                    <div className="mt-4 pt-4 border-t border-violet-500/10">
                      {loadingThreats.has(asset.id) ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                          <span className="ml-2 text-gray-400">Loading threats...</span>
                        </div>
                      ) : threats[asset.id]?.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-gray-400 mb-3">
                            Found {threats[asset.id].length} threat(s) for this asset:
                          </p>
                          {threats[asset.id].map((threat) => (
                            <div
                              key={threat.id}
                              className="p-4 bg-[#1a1a1a] rounded-lg border border-red-500/20 hover:border-red-500/40 transition-colors cursor-pointer"
                              onClick={() => setSelectedThreat(threat)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <h4 className="font-medium text-white truncate">{threat.title}</h4>
                                    <Badge className={`${getSeverityColor(threat.severity)} text-xs`}>
                                      {threat.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 line-clamp-2">
                                    {stripHtml(threat.description)}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Database className="h-3 w-3" />
                                      {threat.source_name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(threat.first_seen).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-violet-400 hover:text-violet-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedThreat(threat);
                                  }}
                                >
                                  <Info className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-400 py-4">No threat details available</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Threat Detail Modal */}
        <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
          <DialogContent className="max-w-2xl bg-[#141414] border-violet-500/20 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="h-5 w-5" />
                Threat Details
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Complete information about this security threat
              </DialogDescription>
            </DialogHeader>
            
            {selectedThreat && (
              <ScrollArea className="max-h-[70vh]">
                <div className="space-y-6 pr-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getSeverityColor(selectedThreat.severity)}`}>
                        {selectedThreat.severity?.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="border-violet-500/30 text-violet-400">
                        {selectedThreat.threat_type}
                      </Badge>
                      <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                        {selectedThreat.status}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{selectedThreat.title}</h3>
                  </div>

                  <Separator className="bg-violet-500/10" />

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {stripHtml(selectedThreat.description)}
                    </p>
                  </div>

                  {/* Source Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Source</h4>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-violet-400" />
                        <span className="text-white">{selectedThreat.source_name}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Confidence</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-violet-500 h-2 rounded-full" 
                            style={{ width: `${selectedThreat.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-white text-sm">{selectedThreat.confidence_score}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">First Seen</h4>
                      <p className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-violet-400" />
                        {new Date(selectedThreat.first_seen).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Last Seen</h4>
                      <p className="text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-violet-400" />
                        {new Date(selectedThreat.last_seen).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Affected Assets */}
                  {selectedThreat.affected_assets?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Affected Assets</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedThreat.affected_assets.map((asset, i) => (
                          <Badge key={i} variant="outline" className="border-red-500/30 text-red-400">
                            {asset}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Threat Indicators / Data Classes */}
                  {selectedThreat.threat_indicators?.data_classes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Exposed Data Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedThreat.threat_indicators.data_classes.map((dataClass: string, i: number) => (
                          <Badge key={i} variant="outline" className="border-orange-500/30 text-orange-400">
                            {dataClass}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Breach Details */}
                  {selectedThreat.threat_indicators?.breach_date && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Breach Information</h4>
                      <div className="bg-[#1a1a1a] p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Breach Date:</span>
                          <span className="text-white">{selectedThreat.threat_indicators.breach_date}</span>
                        </div>
                        {selectedThreat.threat_indicators.compromised_accounts && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Accounts Compromised:</span>
                            <span className="text-red-400 font-medium">
                              {Number(selectedThreat.threat_indicators.compromised_accounts).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Verified:</span>
                          <span className={selectedThreat.threat_indicators.is_verified ? 'text-green-400' : 'text-yellow-400'}>
                            {selectedThreat.threat_indicators.is_verified ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedThreat.tags?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedThreat.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="bg-violet-500/20 text-violet-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Recommendations */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 border border-violet-500/20 p-5 rounded-xl">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-transparent to-purple-600/5 animate-pulse" />
                    
                    <div className="relative">
                      <AIRecommendationsDisplay
                        recommendation={aiRecommendation}
                        loading={loadingRecommendation}
                        onRegenerate={() => selectedThreat && generateAiRecommendation(selectedThreat)}
                        onGenerate={() => selectedThreat && generateAiRecommendation(selectedThreat)}
                      />
                    </div>
                  </div>

                  {/* Source Link */}
                  {selectedThreat.source_url && (
                    <div>
                      <Button
                        variant="outline"
                        className="w-full border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                        onClick={() => window.open(selectedThreat.source_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Source
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
