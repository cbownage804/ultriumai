import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Shield, Globe, AlertTriangle, CheckCircle, Loader2, Database, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface ThreatResult {
  source: string;
  data: Record<string, any>;
  risk_score: string;
}

interface LookupResults {
  indicator: string;
  indicator_type: string;
  overall_risk: string;
  sources: ThreatResult[];
  checked_at: string;
}

export const ThreatIntelligence = () => {
  const { user } = useAuth();
  const [indicator, setIndicator] = useState('');
  const [indicatorType, setIndicatorType] = useState('ip');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<LookupResults | null>(null);
  const [recentLookups, setRecentLookups] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load recent lookups on mount
  useEffect(() => {
    if (user) {
      loadRecentLookups();
    }
  }, [user]);

  const loadRecentLookups = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('threat_intel_indicators')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setRecentLookups(data || []);
    } catch (err) {
      console.error('Failed to load recent lookups:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const performLookup = async () => {
    if (!indicator.trim()) {
      toast.error('Please enter an indicator');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('threat-intel-feeds', {
        body: { action: 'lookup', indicator, indicator_type: indicatorType }
      });

      if (error) throw error;
      setResults(data);
      toast.success('Threat intelligence lookup complete');

      // Refresh recent lookups
      await loadRecentLookups();
    } catch (error: any) {
      console.error('Lookup error:', error);
      toast.error(error.message || 'Lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLookup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('threat_intel_indicators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setRecentLookups(prev => prev.filter(l => l.id !== id));
      toast.success('Lookup deleted');
    } catch (err: any) {
      toast.error('Failed to delete lookup');
    }
  };

  const loadFromHistory = (lookup: any) => {
    setIndicator(lookup.indicator_value);
    setIndicatorType(lookup.indicator_type);
    // Reconstruct results from stored data
    setResults({
      indicator: lookup.indicator_value,
      indicator_type: lookup.indicator_type,
      overall_risk: lookup.confidence_score >= 70 ? 'high' : lookup.confidence_score >= 40 ? 'medium' : 'low',
      sources: lookup.source_data?.sources || [],
      checked_at: lookup.created_at,
    });
    toast.success('Loaded from history');
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return <Badge className={colors[risk] || 'bg-muted'}>{risk?.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Threat Intelligence Lookup
          </CardTitle>
          <CardDescription>
            Query VirusTotal, AbuseIPDB, and other threat feeds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={indicatorType} onValueChange={setIndicatorType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ip">IP Address</SelectItem>
                <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="hash">File Hash</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={`Enter ${indicatorType}...`}
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              className="flex-1"
            />
            <Button onClick={performLookup} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Lookup
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Results for: {results.indicator}
              </CardTitle>
              {getRiskBadge(results.overall_risk)}
            </div>
            <CardDescription>
              Checked at: {new Date(results.checked_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={results.sources[0]?.source || 'overview'}>
              <TabsList className="flex-wrap">
                {results.sources.map((source) => (
                  <TabsTrigger key={source.source} value={source.source}>
                    {source.source}
                  </TabsTrigger>
                ))}
              </TabsList>
              {results.sources.map((source) => (
                <TabsContent key={source.source} value={source.source} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{source.source} Analysis</h4>
                    {getRiskBadge(source.risk_score)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(source.data).map(([key, value]) => (
                      <div key={key} className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className="font-medium truncate">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? 'N/A')}
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Recent Lookups
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadRecentLookups}
              disabled={isLoadingHistory}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentLookups.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {isLoadingHistory ? 'Loading...' : 'No recent lookups'}
              </p>
            ) : (
              recentLookups.map((lookup) => (
                <div 
                  key={lookup.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => loadFromHistory(lookup)}
                >
                  <div className="flex items-center gap-3">
                    {(lookup.confidence_score || 50) >= 70 ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{lookup.indicator_value}</p>
                      <p className="text-xs text-muted-foreground">{lookup.indicator_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={lookup.confidence_score >= 70 ? 'bg-red-500' : lookup.confidence_score >= 40 ? 'bg-yellow-500' : 'bg-green-500'}>
                      {lookup.confidence_score >= 70 ? 'HIGH' : lookup.confidence_score >= 40 ? 'MEDIUM' : 'LOW'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lookup.created_at).toLocaleDateString()}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLookup(lookup.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
