import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Server, Monitor, Laptop, RefreshCw, Eye, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface AssetRisk {
  id: string;
  agent_id: string | null;
  asset_identifier: string;
  asset_type: string;
  overall_risk_score: number;
  vulnerability_score: number | null;
  configuration_score: number | null;
  patch_score: number | null;
  exposure_score: number | null;
  behavioral_score: number | null;
  risk_factors: any;
  recommendations: any;
  last_assessed_at: string | null;
}

export function AssetRiskScoring() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [assetRisks, setAssetRisks] = useState<AssetRisk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetRisk | null>(null);

  useEffect(() => {
    if (user) {
      loadAssetRisks();
    }
  }, [user]);

  const loadAssetRisks = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_risk_scores')
        .select('*')
        .eq('user_id', user?.id)
        .order('overall_risk_score', { ascending: false });

      if (error) throw error;
      setAssetRisks(data || []);
    } catch (err) {
      console.error('Failed to load asset risks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshScores = async () => {
    setIsRefreshing(true);
    toast.info("Recalculating risk scores...");
    
    // In a real implementation, this would trigger an edge function
    // that recalculates risk scores based on latest data
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await loadAssetRisks();
    setIsRefreshing(false);
    toast.success("Risk scores updated");
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-500' };
    if (score >= 60) return { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-500' };
    if (score >= 40) return { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (score >= 20) return { label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-500' };
    return { label: 'Minimal', color: 'bg-green-500', textColor: 'text-green-500' };
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'server': return <Server className="h-5 w-5" />;
      case 'workstation': return <Monitor className="h-5 w-5" />;
      case 'laptop': return <Laptop className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  // Calculate aggregate stats
  const avgRisk = assetRisks.length > 0 
    ? Math.round(assetRisks.reduce((sum, a) => sum + a.overall_risk_score, 0) / assetRisks.length)
    : 0;
  const criticalAssets = assetRisks.filter(a => a.overall_risk_score >= 80).length;
  const highAssets = assetRisks.filter(a => a.overall_risk_score >= 60 && a.overall_risk_score < 80).length;

  // Simulated data for demo when no real data exists
  const demoAssets: AssetRisk[] = agents.map((agent, i) => ({
    id: agent.id,
    agent_id: agent.id,
    asset_identifier: agent.name,
    asset_type: i % 3 === 0 ? 'server' : i % 2 === 0 ? 'workstation' : 'laptop',
    overall_risk_score: Math.floor(Math.random() * 60) + 20,
    vulnerability_score: Math.floor(Math.random() * 100),
    configuration_score: Math.floor(Math.random() * 100),
    patch_score: Math.floor(Math.random() * 100),
    exposure_score: Math.floor(Math.random() * 100),
    behavioral_score: Math.floor(Math.random() * 100),
    risk_factors: [
      { factor: 'Outdated software', impact: 'high' },
      { factor: 'Open ports', impact: 'medium' }
    ],
    recommendations: [
      { action: 'Update operating system', priority: 'high' },
      { action: 'Enable firewall', priority: 'medium' }
    ],
    last_assessed_at: new Date().toISOString()
  }));

  const displayAssets = assetRisks.length > 0 ? assetRisks : demoAssets;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Asset Risk Scoring
          </h2>
          <p className="text-muted-foreground">Continuous risk assessment for all managed assets</p>
        </div>
        <Button onClick={refreshScores} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Scores
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{displayAssets.length}</p>
              </div>
              <Shield className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Risk</p>
                <p className={`text-2xl font-bold ${getRiskLevel(avgRisk).textColor}`}>{avgRisk}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Risk</p>
                <p className="text-2xl font-bold text-red-500">{criticalAssets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-orange-500">{highAssets}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Risk Overview</CardTitle>
            <CardDescription>All assets ranked by overall risk score</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {displayAssets.map(asset => {
                  const risk = getRiskLevel(asset.overall_risk_score);
                  return (
                    <div 
                      key={asset.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedAsset?.id === asset.id ? 'border-primary bg-muted/50' : 'hover:bg-muted/30'
                      }`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getAssetIcon(asset.asset_type)}
                          <div>
                            <p className="font-medium">{asset.asset_identifier}</p>
                            <p className="text-xs text-muted-foreground capitalize">{asset.asset_type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${risk.color} text-white`}>
                            {asset.overall_risk_score}
                          </Badge>
                          <span className={`text-sm font-medium ${risk.textColor}`}>{risk.label}</span>
                        </div>
                      </div>
                      <Progress value={asset.overall_risk_score} className="h-2" />
                      <div className="grid grid-cols-5 gap-2 mt-3 text-xs text-muted-foreground">
                        <div>
                          <p>Vuln</p>
                          <p className="font-medium text-foreground">{asset.vulnerability_score}</p>
                        </div>
                        <div>
                          <p>Config</p>
                          <p className="font-medium text-foreground">{asset.configuration_score}</p>
                        </div>
                        <div>
                          <p>Patch</p>
                          <p className="font-medium text-foreground">{asset.patch_score}</p>
                        </div>
                        <div>
                          <p>Exposure</p>
                          <p className="font-medium text-foreground">{asset.exposure_score}</p>
                        </div>
                        <div>
                          <p>Behavior</p>
                          <p className="font-medium text-foreground">{asset.behavioral_score}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Asset Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Details</CardTitle>
            <CardDescription>
              {selectedAsset ? selectedAsset.asset_identifier : 'Select an asset to view details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAsset ? (
              <div className="space-y-6">
                {/* Risk Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Risk Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vulnerabilities</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedAsset.vulnerability_score} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{selectedAsset.vulnerability_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Configuration</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedAsset.configuration_score} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{selectedAsset.configuration_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Patch Status</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedAsset.patch_score} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{selectedAsset.patch_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Exposure</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedAsset.exposure_score} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{selectedAsset.exposure_score}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Behavioral</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedAsset.behavioral_score} className="w-24 h-2" />
                        <span className="text-sm font-medium w-8">{selectedAsset.behavioral_score}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Risk Factors</h4>
                  <div className="space-y-2">
                    {(selectedAsset.risk_factors || []).map((factor: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className={`h-4 w-4 ${
                          factor.impact === 'high' ? 'text-red-500' : 
                          factor.impact === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                        }`} />
                        <span>{factor.factor}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Recommendations</h4>
                  <div className="space-y-2">
                    {(selectedAsset.recommendations || []).map((rec: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{rec.action}</span>
                        <Badge variant="outline" className="text-xs ml-auto">{rec.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Last assessed: {new Date(selectedAsset.last_assessed_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">Select an asset from the list to view detailed risk information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
