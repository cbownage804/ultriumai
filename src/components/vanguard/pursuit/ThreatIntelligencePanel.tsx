import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Brain, 
  Plus, 
  RefreshCw, 
  Globe,
  Database,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { useXDRThreatFeeds } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";

const providerLogos: Record<string, string> = {
  virustotal: "🦠",
  alienvault: "👽",
  abuse_ch: "🚫",
  misp: "🔗",
  custom: "📋",
};

const builtInFeeds = [
  { name: "VirusTotal", provider: "virustotal", type: "ioc", description: "Hash, IP, and domain reputation" },
  { name: "AlienVault OTX", provider: "alienvault", type: "ioc", description: "Open Threat Exchange pulses" },
  { name: "Abuse.ch URLhaus", provider: "abuse_ch", type: "ioc", description: "Malware URLs and payloads" },
  { name: "Abuse.ch MalwareBazaar", provider: "abuse_ch", type: "ioc", description: "Malware samples and hashes" },
  { name: "Abuse.ch ThreatFox", provider: "abuse_ch", type: "ioc", description: "IOCs shared by the community" },
];

export function ThreatIntelligencePanel() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { data: feeds, isLoading } = useXDRThreatFeeds();

  const stats = {
    totalFeeds: feeds?.length || 0,
    activeFeeds: feeds?.filter(f => f.is_active).length || 0,
    totalIOCs: feeds?.reduce((sum, f) => sum + f.ioc_count, 0) || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
      </div>

      {/* Built-in Feeds */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Available Threat Intelligence Feeds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {builtInFeeds.map((feed) => (
              <div
                key={feed.name}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{providerLogos[feed.provider]}</span>
                    <div>
                      <div className="font-medium">{feed.name}</div>
                      <div className="text-xs text-muted-foreground">{feed.description}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Feeds */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Connected Feeds
            {feeds && <Badge variant="secondary">{feeds.length}</Badge>}
          </CardTitle>
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
                  <Input placeholder="e.g., Internal IOC Feed" />
                </div>
                <div className="space-y-2">
                  <Label>Feed URL</Label>
                  <Input placeholder="https://example.com/feed.json" />
                </div>
                <div className="space-y-2">
                  <Label>Feed Type</Label>
                  <Select defaultValue="ioc">
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
                  <Label>API Key (optional)</Label>
                  <Input type="password" placeholder="Enter API key" />
                </div>
                <div className="space-y-2">
                  <Label>Sync Interval</Label>
                  <Select defaultValue="24">
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
                <Button className="w-full">Add Feed</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading feeds...
              </div>
            ) : !feeds?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Brain className="h-8 w-8 mb-2" />
                <p>No threat feeds connected</p>
                <p className="text-xs">Connect feeds to enrich threat detection</p>
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
                        <Button variant="ghost" size="icon">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Switch checked={feed.is_active} />
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
