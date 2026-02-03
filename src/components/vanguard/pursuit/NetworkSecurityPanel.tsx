import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Network, 
  Search, 
  Globe, 
  AlertTriangle, 
  Shield,
  Ban,
  Activity
} from "lucide-react";
import { useXDRNetworkEvents } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";

const eventTypeColors: Record<string, string> = {
  connection: "bg-blue-500",
  dns_query: "bg-purple-500",
  c2_beacon: "bg-destructive",
  data_exfil: "bg-orange-500",
  port_scan: "bg-yellow-500",
};

export function NetworkSecurityPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);

  const { data: events, isLoading } = useXDRNetworkEvents();

  const filteredEvents = events?.filter(event => {
    if (typeFilter !== "all" && event.event_type !== typeFilter) return false;
    if (suspiciousOnly && !event.is_suspicious) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      event.destination_ip?.toLowerCase().includes(query) ||
      event.destination_domain?.toLowerCase().includes(query) ||
      event.process_name?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: events?.length || 0,
    suspicious: events?.filter(e => e.is_suspicious).length || 0,
    blocked: events?.filter(e => e.is_blocked).length || 0,
    threatIntel: events?.filter(e => e.threat_intel_match).length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Suspicious
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.suspicious}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.blocked}</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              Threat Intel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.threatIntel}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IPs, domains, processes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="connection">Connections</SelectItem>
                <SelectItem value="dns_query">DNS Queries</SelectItem>
                <SelectItem value="c2_beacon">C2 Beacons</SelectItem>
                <SelectItem value="data_exfil">Data Exfil</SelectItem>
                <SelectItem value="port_scan">Port Scans</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant={suspiciousOnly ? "default" : "outline"}
              onClick={() => setSuspiciousOnly(!suspiciousOnly)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Suspicious Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Events
            {filteredEvents && (
              <Badge variant="secondary">{filteredEvents.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading events...
              </div>
            ) : !filteredEvents?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Network className="h-8 w-8 mb-2" />
                <p>No network events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border bg-card ${
                      event.is_suspicious ? "border-orange-500/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={eventTypeColors[event.event_type]}>
                            {event.event_type.replace("_", " ")}
                          </Badge>
                          {event.is_suspicious && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              Suspicious
                            </Badge>
                          )}
                          {event.is_blocked && (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                          {event.threat_intel_match && (
                            <Badge className="bg-purple-500">Threat Intel Match</Badge>
                          )}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Destination: </span>
                            <code className="font-mono">
                              {event.destination_domain || event.destination_ip}
                              {event.destination_port && `:${event.destination_port}`}
                            </code>
                          </div>
                          {event.process_name && (
                            <div>
                              <span className="text-muted-foreground">Process: </span>
                              <code className="font-mono">{event.process_name}</code>
                            </div>
                          )}
                          {event.geo_country && (
                            <div>
                              <span className="text-muted-foreground">Location: </span>
                              <span>{event.geo_country}{event.geo_city && `, ${event.geo_city}`}</span>
                            </div>
                          )}
                          {event.dns_query && (
                            <div>
                              <span className="text-muted-foreground">DNS: </span>
                              <code className="font-mono">{event.dns_query}</code>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>
                        {!event.is_blocked && event.is_suspicious && (
                          <Button variant="destructive" size="sm" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Block
                          </Button>
                        )}
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
