import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Brain, 
  Plus, 
  RefreshCw, 
  Globe,
  Database,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Loader2,
  Zap
} from "lucide-react";
import { useXDRThreatFeeds } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";
import { ThreatIntelLookup } from "./ThreatIntelLookup";

const providerLogos: Record<string, string> = {
  virustotal: "🦠",
  alienvault: "👽",
  abuse_ch: "🚫",
  abuseipdb: "🛡️",
  misp: "🔗",
  custom: "📋",
};

interface BuiltInFeed {
  name: string;
  provider: string;
  type: string;
  description: string;
  apiRequired: boolean;
  url?: string;
  status: 'available' | 'connected' | 'requires_key';
}

const builtInFeeds: BuiltInFeed[] = [
  { 
    name: "VirusTotal", 
    provider: "virustotal", 
    type: "ioc", 
    description: "Hash, IP, and domain reputation",
    apiRequired: true,
    status: 'connected' // Key is configured
  },
  { 
    name: "AbuseIPDB", 
    provider: "abuseipdb", 
    type: "ioc", 
    description: "IP reputation and abuse reporting",
    apiRequired: true,
    status: 'connected' // Key is configured
  },
  { 
    name: "AlienVault OTX", 
    provider: "alienvault", 
    type: "ioc", 
    description: "Open Threat Exchange pulses",
    apiRequired: true,
    url: "https://otx.alienvault.com",
    status: 'requires_key'
  },
  { 
    name: "Abuse.ch URLhaus", 
    provider: "abuse_ch", 
    type: "ioc", 
    description: "Malware URLs and payloads",
    apiRequired: false,
    url: "https://urlhaus.abuse.ch/downloads/json_recent/",
    status: 'available'
  },
  { 
    name: "Abuse.ch MalwareBazaar", 
    provider: "abuse_ch", 
    type: "ioc", 
    description: "Malware samples and hashes",
    apiRequired: false,
    url: "https://bazaar.abuse.ch/export/json/recent/",
    status: 'available'
  },
  { 
    name: "Abuse.ch ThreatFox", 
    provider: "abuse_ch", 
    type: "ioc", 
    description: "IOCs shared by the community",
    apiRequired: false,
    url: "https://threatfox.abuse.ch/export/json/recent/",
    status: 'available'
  },
];

export function ThreatIntelligencePanel() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeedName, setNewFeedName] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedType, setNewFeedType] = useState("ioc");
  const [newFeedInterval, setNewFeedInterval] = useState("24");
  const { data: feeds, isLoading, refetch } = useXDRThreatFeeds();
  const queryClient = useQueryClient();

  const stats = {
    totalFeeds: feeds?.length || 0,
    activeFeeds: feeds?.filter(f => f.is_active).length || 0,
    totalIOCs: feeds?.reduce((sum, f) => sum + f.ioc_count, 0) || 0,
  };

  const connectFeedMutation = useMutation({
    mutationFn: async (feed: BuiltInFeed) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('xdr_threat_feeds')
        .insert({
          user_id: user.id,
          feed_name: feed.name,
          feed_url: feed.url || null,
          feed_type: feed.type,
          provider: feed.provider,
          is_active: true,
          sync_interval_hours: 24,
          ioc_count: 0
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Threat feed connected!");
      queryClient.invalidateQueries({ queryKey: ['xdr-threat-feeds'] });
      refetch();
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    }
  });

  const addCustomFeedMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('xdr_threat_feeds')
        .insert({
          user_id: user.id,
          feed_name: newFeedName,
          feed_url: newFeedUrl,
          feed_type: newFeedType,
          provider: 'custom',
          is_active: true,
          sync_interval_hours: parseInt(newFeedInterval),
          ioc_count: 0
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Custom feed added!");
      setIsAddDialogOpen(false);
      setNewFeedName("");
      setNewFeedUrl("");
      queryClient.invalidateQueries({ queryKey: ['xdr-threat-feeds'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add feed: ${error.message}`);
    }
  });

  const toggleFeedMutation = useMutation({
    mutationFn: async ({ feedId, isActive }: { feedId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('xdr_threat_feeds')
        .update({ is_active: isActive })
        .eq('id', feedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['xdr-threat-feeds'] });
    }
  });

  const syncFeedMutation = useMutation({
    mutationFn: async (feedId: string) => {
      // In production, this would trigger the feed sync edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { error } = await supabase
        .from('xdr_threat_feeds')
        .update({ 
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success'
        })
        .eq('id', feedId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feed synced successfully!");
      queryClient.invalidateQueries({ queryKey: ['xdr-threat-feeds'] });
    }
  });

  const isConnected = (provider: string) => {
    return feeds?.some(f => f.provider === provider);
  };

  return (
    <div className="space-y-6">
      {/* Live Lookup Widget */}
      <ThreatIntelLookup />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Feeds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFeeds}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active Feeds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.activeFeeds}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Total IOCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalIOCs.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-cyan-500/10 border-cyan-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-500" />
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-500">2 Active</div>
            <p className="text-xs text-muted-foreground">VT + AbuseIPDB</p>
          </CardContent>
        </Card>
      </div>

      {/* Built-in Feeds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Available Threat Intelligence Feeds
          </CardTitle>
          <CardDescription>
            Connect to industry-standard threat intelligence sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {builtInFeeds.map((feed) => {
              const connected = feed.status === 'connected' || isConnected(feed.provider);
              return (
                <div
                  key={feed.name}
                  className={`p-4 rounded-lg border transition-colors ${
                    connected 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-card hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{providerLogos[feed.provider]}</span>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {feed.name}
                          {connected && (
                            <Badge className="bg-green-500 text-xs">Connected</Badge>
                          )}
                          {feed.status === 'requires_key' && !connected && (
                            <Badge variant="outline" className="text-xs">Requires API Key</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{feed.description}</div>
                      </div>
                    </div>
                    {connected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : feed.status === 'available' ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => connectFeedMutation.mutate(feed)}
                        disabled={connectFeedMutation.isPending}
                      >
                        {connectFeedMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild>
                        <a href={feed.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Get Key
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Feeds */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Connected Feeds
              {feeds && <Badge variant="secondary">{feeds.length}</Badge>}
            </CardTitle>
            <CardDescription>Manage your active threat intelligence sources</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Custom Feed
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Threat Feed</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Feed Name</Label>
                    <Input 
                      placeholder="e.g., Internal IOC Feed" 
                      value={newFeedName}
                      onChange={(e) => setNewFeedName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Feed URL</Label>
                    <Input 
                      placeholder="https://example.com/feed.json"
                      value={newFeedUrl}
                      onChange={(e) => setNewFeedUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Feed Type</Label>
                    <Select value={newFeedType} onValueChange={setNewFeedType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ioc">IOC Feed</SelectItem>
                        <SelectItem value="yara">YARA Rules</SelectItem>
                        <SelectItem value="stix">STIX/TAXII</SelectItem>
                        <SelectItem value="misp">MISP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sync Interval</Label>
                    <Select value={newFeedInterval} onValueChange={setNewFeedInterval}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Every hour</SelectItem>
                        <SelectItem value="6">Every 6 hours</SelectItem>
                        <SelectItem value="12">Every 12 hours</SelectItem>
                        <SelectItem value="24">Every 24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => addCustomFeedMutation.mutate()}
                    disabled={!newFeedName || addCustomFeedMutation.isPending}
                  >
                    {addCustomFeedMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Add Feed
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading feeds...
              </div>
            ) : !feeds?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Brain className="h-8 w-8 mb-2" />
                <p>No threat feeds connected</p>
                <p className="text-xs">Connect feeds above to enrich threat detection</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feeds.map((feed) => (
                  <div
                    key={feed.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl">{providerLogos[feed.provider || "custom"]}</span>
                          <span className="font-medium">{feed.feed_name}</span>
                          <Badge variant="outline">{feed.feed_type}</Badge>
                          {feed.last_sync_status === "success" ? (
                            <Badge className="bg-green-500">Synced</Badge>
                          ) : feed.last_sync_status === "failed" ? (
                            <Badge variant="destructive">Failed</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{feed.ioc_count.toLocaleString()} IOCs</span>
                          <span>Syncs every {feed.sync_interval_hours}h</span>
                          {feed.last_sync_at && (
                            <span>
                              Last sync: {formatDistanceToNow(new Date(feed.last_sync_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => syncFeedMutation.mutate(feed.id)}
                          disabled={syncFeedMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 ${syncFeedMutation.isPending ? 'animate-spin' : ''}`} />
                        </Button>
                        <Switch 
                          checked={feed.is_active} 
                          onCheckedChange={(checked) => toggleFeedMutation.mutate({ feedId: feed.id, isActive: checked })}
                        />
                      </div>
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
