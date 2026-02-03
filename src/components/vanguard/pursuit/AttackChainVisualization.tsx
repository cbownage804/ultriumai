import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GitBranch, 
  AlertTriangle, 
  Clock, 
  ChevronRight,
  Shield,
  Target,
  Zap,
  Terminal,
  FileWarning,
  Network,
  Lock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";

interface AttackChain {
  id: string;
  chain_id: string;
  chain_name: string;
  chain_status: string;
  severity: string;
  mitre_tactics: string[];
  events: any;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  event_source: string;
  severity: string;
  event_time: string;
  event_data: any;
  mitre_mapping: any;
}

const killChainPhases = [
  { id: "reconnaissance", label: "Reconnaissance", icon: Target },
  { id: "weaponization", label: "Weaponization", icon: FileWarning },
  { id: "delivery", label: "Delivery", icon: Network },
  { id: "exploitation", label: "Exploitation", icon: Zap },
  { id: "installation", label: "Installation", icon: Terminal },
  { id: "command_control", label: "C2", icon: Network },
  { id: "actions", label: "Actions", icon: Lock },
];

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-blue-500 text-white",
};

export function AttackChainVisualization() {
  const { user } = useAuth();
  const [selectedChain, setSelectedChain] = useState<AttackChain | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch attack chains
  const { data: chains, isLoading } = useQuery({
    queryKey: ["xdr-attack-chains", user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("xdr_attack_chains")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("chain_status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AttackChain[];
    },
    enabled: !!user,
  });

  // Fetch timeline events for selected chain
  const { data: timeline } = useQuery({
    queryKey: ["xdr-chain-timeline", selectedChain?.id],
    queryFn: async () => {
      if (!selectedChain) return [];

      const { data, error } = await supabase
        .from("xdr_timeline_events")
        .select("*")
        .eq("incident_id", selectedChain.id)
        .order("event_time", { ascending: true });

      if (error) throw error;
      return data as TimelineEvent[];
    },
    enabled: !!selectedChain,
  });

  const activeChains = chains?.filter(c => c.chain_status === "active") || [];
  const stats = {
    total: chains?.length || 0,
    active: activeChains.length,
    critical: chains?.filter(c => c.severity === "critical").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Attack Chains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Active Chains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* Kill Chain Phases Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kill Chain Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {killChainPhases.map((phase, idx) => {
              const Icon = phase.icon;
              // Match tactics from mitre_tactics array
              const count = chains?.filter(c => c.mitre_tactics?.includes(phase.id)).length || 0;
              const hasActive = chains?.some(c => c.mitre_tactics?.includes(phase.id) && c.chain_status === "active");
              
              return (
                <div key={phase.id} className="flex items-center">
                  <div 
                    className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                      hasActive ? "bg-destructive/20 border border-destructive" : "bg-muted"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${hasActive ? "text-destructive" : "text-muted-foreground"}`} />
                    <span className="text-xs mt-1 font-medium">{phase.label}</span>
                    <Badge variant={hasActive ? "destructive" : "secondary"} className="mt-1 text-xs">
                      {count}
                    </Badge>
                  </div>
                  {idx < killChainPhases.length - 1 && (
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Chains List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Detected Chains
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="contained">Contained</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Loading chains...
                </div>
              ) : !chains?.length ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <GitBranch className="h-8 w-8 mb-2" />
                  <p>No attack chains detected</p>
                  <p className="text-xs">Correlated attacks will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chains.map((chain) => (
                    <div
                      key={chain.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedChain?.id === chain.id 
                          ? "border-primary bg-primary/10" 
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => setSelectedChain(chain)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{chain.chain_name}</span>
                            <Badge className={severityColors[chain.severity]}>
                              {chain.severity}
                            </Badge>
                            {chain.chain_status === "active" && (
                              <Badge variant="outline" className="text-destructive border-destructive animate-pulse">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{chain.chain_status}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chain.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      {chain.mitre_tactics && chain.mitre_tactics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {chain.mitre_tactics.slice(0, 3).map((tactic) => (
                            <Badge key={tactic} variant="secondary" className="text-xs font-mono">
                              {tactic}
                            </Badge>
                          ))}
                          {chain.mitre_tactics.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{chain.mitre_tactics.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Timeline View */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attack Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {!selectedChain ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p>Select a chain to view timeline</p>
                </div>
              ) : !timeline?.length ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p>No timeline events</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-4">
                    {timeline.map((event, idx) => (
                      <div key={event.id} className="relative pl-10">
                        {/* Timeline dot */}
                        <div 
                          className={`absolute left-2 w-4 h-4 rounded-full border-2 ${
                            event.severity === "critical" ? "bg-destructive border-destructive" :
                            event.severity === "high" ? "bg-orange-500 border-orange-500" :
                            event.severity === "medium" ? "bg-yellow-500 border-yellow-500" :
                            "bg-blue-500 border-blue-500"
                          }`}
                        />
                        
                        <div className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{event.event_type}</Badge>
                              <Badge variant="secondary" className="text-xs">
                                {event.event_source}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(event.event_time), "HH:mm:ss")}
                            </span>
                          </div>
                          {event.mitre_mapping && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {Object.entries(event.mitre_mapping).map(([key, value]) => (
                                <Badge 
                                  key={key} 
                                  variant="secondary" 
                                  className="text-xs font-mono"
                                >
                                  {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {event.event_data && (
                            <pre className="mt-2 text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.event_data, null, 2).slice(0, 200)}
                              {JSON.stringify(event.event_data).length > 200 && "..."}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
