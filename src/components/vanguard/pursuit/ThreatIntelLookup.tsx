import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, Shield, Globe, Hash, AlertTriangle, CheckCircle, 
  Loader2, ExternalLink, Server, Flag, Clock
} from "lucide-react";

interface LookupResult {
  indicator: string;
  indicator_type: string;
  is_malicious: boolean;
  reputation_score: number;
  categories: string[];
  sources: Array<{
    source: string;
    abuse_confidence_score?: number;
    total_reports?: number;
    country_code?: string;
    isp?: string;
    is_tor?: boolean;
    malicious_count?: number;
    suspicious_count?: number;
    harmless_count?: number;
    total_engines?: number;
    reputation?: number;
    [key: string]: any;
  }>;
  from_cache?: boolean;
}

export function ThreatIntelLookup() {
  const [indicator, setIndicator] = useState("");
  const [indicatorType, setIndicatorType] = useState<string>("ip");
  const [results, setResults] = useState<LookupResult | null>(null);

  const lookupMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/threat-intel-lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            indicator: indicator.trim(),
            indicator_type: indicatorType,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Lookup failed");
      }

      return response.json() as Promise<LookupResult>;
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.is_malicious) {
        toast.warning(`⚠️ Malicious indicator detected: ${data.reputation_score}% confidence`);
      } else {
        toast.success("Lookup complete - no threats detected");
      }
    },
    onError: (error: Error) => {
      toast.error(`Lookup failed: ${error.message}`);
    },
  });

  const handleLookup = () => {
    if (!indicator.trim()) {
      toast.error("Please enter an indicator");
      return;
    }
    lookupMutation.mutate();
  };

  const getReputationColor = (score: number) => {
    if (score >= 75) return "text-red-500";
    if (score >= 50) return "text-orange-500";
    if (score >= 25) return "text-yellow-500";
    return "text-green-500";
  };

  const getReputationBg = (score: number) => {
    if (score >= 75) return "bg-red-500/20 border-red-500/30";
    if (score >= 50) return "bg-orange-500/20 border-orange-500/30";
    if (score >= 25) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-green-500/20 border-green-500/30";
  };

  return (
    <Card className="bg-card/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Live Threat Intelligence Lookup
        </CardTitle>
        <CardDescription>
          Query VirusTotal & AbuseIPDB for real-time IOC analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Form */}
        <div className="flex gap-2">
          <Select value={indicatorType} onValueChange={setIndicatorType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ip">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  IP Address
                </div>
              </SelectItem>
              <SelectItem value="domain">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Domain
                </div>
              </SelectItem>
              <SelectItem value="hash">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  File Hash
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={
              indicatorType === "ip"
                ? "e.g., 8.8.8.8"
                : indicatorType === "domain"
                ? "e.g., example.com"
                : "e.g., SHA256 hash"
            }
            value={indicator}
            onChange={(e) => setIndicator(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            className="flex-1"
          />
          <Button onClick={handleLookup} disabled={lookupMutation.isPending}>
            {lookupMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Lookup</span>
          </Button>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <Separator />
            
            {/* Summary */}
            <div className={`p-4 rounded-lg border ${getReputationBg(results.reputation_score)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {results.is_malicious ? (
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {results.is_malicious ? "Malicious Indicator" : "Clean"}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      {results.indicator}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getReputationColor(results.reputation_score)}`}>
                    {Math.round(results.reputation_score)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                </div>
              </div>

              {results.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {results.categories.slice(0, 5).map((cat, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {String(cat)}
                    </Badge>
                  ))}
                </div>
              )}

              {results.from_cache && (
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Cached result
                </div>
              )}
            </div>

            {/* Source Details */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {results.sources.map((source, i) => (
                  <Card key={i} className="bg-white/5 border-white/10">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {source.source === "virustotal" && "🦠"}
                        {source.source === "abuseipdb" && "🛡️"}
                        {source.source === "ai_analysis" && "🤖"}
                        {source.source.toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {source.source === "abuseipdb" && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Abuse Score:</span>{" "}
                            <span className={getReputationColor(source.abuse_confidence_score || 0)}>
                              {source.abuse_confidence_score}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Reports:</span>{" "}
                            {source.total_reports}
                          </div>
                          {source.country_code && (
                            <div>
                              <span className="text-muted-foreground">Country:</span>{" "}
                              <Flag className="h-3 w-3 inline mr-1" />
                              {source.country_code}
                            </div>
                          )}
                          {source.isp && (
                            <div>
                              <span className="text-muted-foreground">ISP:</span>{" "}
                              {source.isp}
                            </div>
                          )}
                          {source.is_tor && (
                            <Badge variant="destructive" className="w-fit">TOR Exit Node</Badge>
                          )}
                        </div>
                      )}

                      {source.source === "virustotal" && (
                        <div className="space-y-2">
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-red-400">{source.malicious_count}</span> malicious
                            </div>
                            <div>
                              <span className="text-yellow-400">{source.suspicious_count}</span> suspicious
                            </div>
                            <div>
                              <span className="text-green-400">{source.harmless_count}</span> clean
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {source.total_engines} security vendors analyzed
                          </div>
                        </div>
                      )}

                      {source.source === "ai_analysis" && (
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Risk:</span>{" "}
                            <Badge variant="outline">{source.risk_assessment}</Badge>
                          </div>
                          {source.notes && (
                            <p className="text-muted-foreground">{source.notes}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
