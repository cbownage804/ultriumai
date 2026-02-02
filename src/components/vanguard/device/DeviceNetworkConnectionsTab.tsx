import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Network, Search, AlertTriangle, RefreshCw, Globe, Lock, Wifi } from "lucide-react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";

interface NetworkConnection {
  local_address: string;
  local_port: number;
  remote_address: string;
  remote_port: number;
  state: 'ESTABLISHED' | 'LISTENING' | 'TIME_WAIT' | 'CLOSE_WAIT' | 'SYN_SENT' | 'SYN_RECEIVED' | 'FIN_WAIT_1' | 'FIN_WAIT_2' | 'LAST_ACK' | 'CLOSING' | 'CLOSED' | string;
  protocol: 'TCP' | 'UDP';
  process_name?: string;
  process_id?: number;
}

interface DeviceNetworkConnectionsTabProps {
  agent: VanguardAgent;
  onRefresh?: () => Promise<void>;
}

export function DeviceNetworkConnectionsTab({ agent, onRefresh }: DeviceNetworkConnectionsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get network connections from agent config
  const connections: NetworkConnection[] = useMemo(() => {
    return (agent.config as any)?.network_connections || [];
  }, [agent.config]);

  const filteredConnections = useMemo(() => {
    let filtered = connections;
    
    if (filterState !== "all") {
      filtered = filtered.filter(c => c.state === filterState);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.local_address?.toLowerCase().includes(query) ||
          c.remote_address?.toLowerCase().includes(query) ||
          c.process_name?.toLowerCase().includes(query) ||
          c.local_port.toString().includes(query) ||
          c.remote_port.toString().includes(query)
      );
    }
    
    return filtered;
  }, [connections, searchQuery, filterState]);

  const stateCounts = useMemo(() => {
    return connections.reduce((acc, c) => {
      acc[c.state] = (acc[c.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [connections]);

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'ESTABLISHED':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Established</Badge>;
      case 'LISTENING':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Listening</Badge>;
      case 'TIME_WAIT':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Time Wait</Badge>;
      case 'CLOSE_WAIT':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Close Wait</Badge>;
      case 'SYN_SENT':
      case 'SYN_RECEIVED':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{state}</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{state}</Badge>;
    }
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const lastCheck = (agent.config as any)?.last_connections_check;
  const listeningCount = stateCounts['LISTENING'] || 0;
  const establishedCount = stateCounts['ESTABLISHED'] || 0;

  if (connections.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Network className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No connection data available</p>
            <p className="text-xs text-slate-500">
              Network connections will be collected during next agent telemetry sync
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Network className="h-4 w-4" />
            Network Connections
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              {establishedCount} active
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              {listeningCount} listening
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastCheck && (
              <span className="text-xs text-slate-500">
                Last sync: {new Date(lastCheck).toLocaleString()}
              </span>
            )}
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <Button
            variant={filterState === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterState("all")}
            className={filterState === "all" ? "bg-cyan-500/20 text-cyan-400" : "border-cyan-500/30 text-slate-400"}
          >
            All ({connections.length})
          </Button>
          <Button
            variant={filterState === "ESTABLISHED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterState("ESTABLISHED")}
            className={filterState === "ESTABLISHED" ? "bg-green-500/20 text-green-400" : "border-cyan-500/30 text-slate-400"}
          >
            Established ({establishedCount})
          </Button>
          <Button
            variant={filterState === "LISTENING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterState("LISTENING")}
            className={filterState === "LISTENING" ? "bg-blue-500/20 text-blue-400" : "border-cyan-500/30 text-slate-400"}
          >
            Listening ({listeningCount})
          </Button>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by address, port, or process..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-cyan-500/20 text-white placeholder:text-slate-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="text-cyan-400">Local</TableHead>
                <TableHead className="text-cyan-400">Remote</TableHead>
                <TableHead className="text-cyan-400">State</TableHead>
                <TableHead className="text-cyan-400">Protocol</TableHead>
                <TableHead className="text-cyan-400">Process</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConnections.map((conn, i) => (
                <TableRow key={`${conn.local_address}-${conn.local_port}-${i}`} className="border-cyan-500/10 hover:bg-cyan-500/5">
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Wifi className="h-3 w-3 text-cyan-400" />
                      <span className="font-mono text-sm text-slate-200">
                        {conn.local_address}:{conn.local_port}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {conn.remote_address && conn.remote_address !== '0.0.0.0' && conn.remote_address !== '*' ? (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-blue-400" />
                        <span className="font-mono text-sm text-slate-300">
                          {conn.remote_address}:{conn.remote_port}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStateBadge(conn.state)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-500/30 text-slate-400">
                      {conn.protocol}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {conn.process_name ? (
                      <div>
                        <span className="text-sm text-slate-200">{conn.process_name}</span>
                        {conn.process_id && (
                          <span className="text-xs text-slate-500 ml-1">(PID: {conn.process_id})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredConnections.length === 0 && (searchQuery || filterState !== "all") && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No connections matching your filters</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
