import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Globe, Shield, AlertTriangle, CheckCircle, 
  XCircle, Loader2, ExternalLink, Database, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThreatIntelResult {
  indicator: string;
  indicator_type: string;
  is_malicious: boolean;
  reputation_score: number;
  categories: string[];
  sources: {
    source: string;
    [key: string]: any;
  }[];
  from_cache?: boolean;
}

export function ThreatIntelLookup() {
  const [indicator, setIndicator] = useState("");
  const [indicatorType, setIndicatorType] = useState("ip");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ThreatIntelResult | null>(null);
  const [history, setHistory] = useState<ThreatIntelResult[]>([]);

  const lookupIndicator = async () => {
    if (!indicator.trim()) {
      toast.error("Enter an indicator to lookup");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke('threat-intel-lookup', {
        body: { indicator: indicator.trim(), indicator_type: indicatorType },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);

      setResult(response.data);
      setHistory(prev => [response.data, ...prev.slice(0, 9)]);

      if (response.data.is_malicious) {
        toast.warning("Malicious indicator detected!", { 
          description: `${indicator} has been flagged as potentially malicious` 
        });
      } else {
        toast.success("Lookup complete", { 
          description: response.data.from_cache ? 'Result from cache' : 'Fresh lookup' 
        });
      }
    } catch (err) {
      console.error('Threat intel lookup failed:', err);
      toast.error("Lookup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-orange-500';
    if (score >= 20) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getReputationLabel = (score: number) => {
    if (score >= 70) return 'Malicious';
    if (score >= 40) return 'Suspicious';
    if (score >= 20) return 'Low Risk';
    return 'Clean';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Lookup Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Threat Intelligence Lookup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Select value={indicatorType} onValueChange={setIndicatorType}>
              <SelectTrigger className="w-32">
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
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder={
                indicatorType === 'ip' ? '8.8.8.8' :
                indicatorType === 'domain' ? 'example.com' :
                indicatorType === 'hash' ? 'SHA256 hash...' :
                'https://example.com/path'
              }
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && lookupIndicator()}
            />
            <Button onClick={lookupIndicator} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-4 border-t">
              {/* Summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  {result.is_malicious ? (
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-red-500" />
                    </div>
                  ) : result.reputation_score > 20 ? (
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-yellow-500" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-mono font-medium">{result.indicator}</p>
                    <p className="text-sm text-muted-foreground capitalize">{result.indicator_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getReputationColor(result.reputation_score)}`}>
                    {result.reputation_score}%
                  </p>
                  <p className="text-sm text-muted-foreground">{getReputationLabel(result.reputation_score)}</p>
                </div>
              </div>

              {/* Categories */}
              {result.categories.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.categories.map((cat, i) => (
                      <Badge key={i} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Details */}
              <div>
                <Label className="text-muted-foreground">Intelligence Sources</Label>
                <div className="space-y-3 mt-2">
                  {result.sources.map((source, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4" />
                        <span className="font-medium capitalize">{source.source}</span>
                        {source.source === 'virustotal' && (
                          <a 
                            href={`https://www.virustotal.com/gui/search/${result.indicator}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-xs text-primary flex items-center gap-1"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {source.source === 'abuseipdb' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Abuse Score:</span>{' '}
                              <span className={source.abuse_confidence_score > 50 ? 'text-red-500 font-medium' : ''}>
                                {source.abuse_confidence_score}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Reports:</span> {source.total_reports}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Country:</span> {source.country_code}
                            </div>
                            <div>
                              <span className="text-muted-foreground">ISP:</span> {source.isp}
                            </div>
                          </>
                        )}
                        {source.source === 'virustotal' && (
                          <>
                            <div>
                              <span className="text-muted-foreground">Malicious:</span>{' '}
                              <span className={source.malicious_count > 0 ? 'text-red-500 font-medium' : ''}>
                                {source.malicious_count}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Suspicious:</span> {source.suspicious_count}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Harmless:</span> {source.harmless_count}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Engines:</span> {source.total_engines}
                            </div>
                          </>
                        )}
                        {source.source === 'ai_analysis' && (
                          <>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Risk:</span>{' '}
                              <span className="capitalize">{source.risk_assessment}</span>
                            </div>
                            {source.notes && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Notes:</span> {source.notes}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.from_cache && (
                <p className="text-xs text-muted-foreground text-center">
                  Result from cache (24h expiry)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Lookups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent lookups</p>
            ) : (
              <div className="space-y-2">
                {history.map((item, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setIndicator(item.indicator);
                      setIndicatorType(item.indicator_type);
                      setResult(item);
                    }}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.is_malicious ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : item.reputation_score > 20 ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-mono text-sm truncate max-w-[150px]">
                          {item.indicator}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">{item.indicator_type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
