import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, Search, AlertTriangle, CheckCircle, XCircle, 
  ChevronRight, ChevronDown, Network, Cpu, HardDrive, Terminal
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface ProcessEvent {
  id: string;
  agent_id: string;
  process_name: string;
  process_id: number;
  parent_process_id: number;
  parent_process_name: string;
  command_line: string;
  user_name: string;
  event_type: 'start' | 'stop' | 'network' | 'file_access' | 'registry';
  timestamp: string;
  risk_score: number;
  details: Record<string, any>;
}

interface ProcessNode {
  process: ProcessEvent;
  children: ProcessNode[];
  expanded: boolean;
}

export function ProcessTimeline() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRange, setTimeRange] = useState("1h");
  const [expandedProcesses, setExpandedProcesses] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, selectedAgentId, timeRange]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const hours = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : timeRange === '24h' ? 24 : 168;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('process_events')
        .select('*')
        .eq('user_id', user?.id)
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (selectedAgentId) {
        query = query.eq('agent_id', selectedAgentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load process events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProcess = (pid: number) => {
    setExpandedProcesses(prev => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'start': return <Activity className="h-4 w-4 text-green-500" />;
      case 'stop': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'network': return <Network className="h-4 w-4 text-blue-500" />;
      case 'file_access': return <HardDrive className="h-4 w-4 text-purple-500" />;
      case 'registry': return <Cpu className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-500/10 text-red-500';
    if (score >= 60) return 'bg-orange-500/10 text-orange-500';
    if (score >= 40) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-green-500/10 text-green-500';
  };

  // Build process tree
  const buildProcessTree = (events: ProcessEvent[]): ProcessNode[] => {
    const processMap = new Map<number, ProcessNode>();
    const rootNodes: ProcessNode[] = [];

    // First pass: create all nodes
    events.forEach(event => {
      if (!processMap.has(event.process_id)) {
        processMap.set(event.process_id, {
          process: event,
          children: [],
          expanded: expandedProcesses.has(event.process_id)
        });
      }
    });

    // Second pass: build tree
    events.forEach(event => {
      const node = processMap.get(event.process_id);
      if (!node) return;

      const parentNode = processMap.get(event.parent_process_id);
      if (parentNode) {
        if (!parentNode.children.find(c => c.process.process_id === event.process_id)) {
          parentNode.children.push(node);
        }
      } else {
        if (!rootNodes.find(r => r.process.process_id === event.process_id)) {
          rootNodes.push(node);
        }
      }
    });

    return rootNodes;
  };

  const filteredEvents = events.filter(event =>
    event.process_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.command_line?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const highRiskEvents = events.filter(e => e.risk_score >= 70).length;
  const processTree = buildProcessTree(filteredEvents.slice(0, 100));

  const renderProcessNode = (node: ProcessNode, depth: number = 0) => {
    const event = node.process;
    const hasChildren = node.children.length > 0;

    return (
      <div key={`${event.process_id}-${event.timestamp}`}>
        <div 
          className={`flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => hasChildren && toggleProcess(event.process_id)}
        >
          {hasChildren ? (
            node.expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <div className="w-4" />
          )}
          {getEventIcon(event.event_type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{event.process_name}</span>
              <Badge variant="outline" className="text-xs">PID: {event.process_id}</Badge>
              <Badge className={`text-xs ${getRiskColor(event.risk_score)}`}>
                Risk: {event.risk_score}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{event.command_line}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{event.user_name}</p>
            <p>{new Date(event.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
        {node.expanded && node.children.map(child => renderProcessNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Process Timeline
          </h2>
          <p className="text-muted-foreground">EDR-style process tree and activity tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Risk</p>
                <p className="text-2xl font-bold text-red-500">{highRiskEvents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Process Starts</p>
                <p className="text-2xl font-bold">{events.filter(e => e.event_type === 'start').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Network Events</p>
                <p className="text-2xl font-bold">{events.filter(e => e.event_type === 'network').length}</p>
              </div>
              <Network className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by process name, command line, or user..."
          className="pl-10"
        />
      </div>

      {/* Process Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Process Tree
          </CardTitle>
          <CardDescription>Hierarchical view of process executions and their relationships</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading process events...</p>
            </div>
          ) : processTree.length === 0 ? (
            <div className="p-8 text-center">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No process events in the selected time range.</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-1">
                {processTree.map(node => renderProcessNode(node))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Timeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>Chronological view of all process events</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredEvents.slice(0, 50).map(event => (
                <div key={event.id} className="flex items-center gap-3 p-2 rounded bg-muted/30">
                  {getEventIcon(event.event_type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.process_name}</span>
                      <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                      <Badge className={`text-xs ${getRiskColor(event.risk_score)}`}>
                        {event.risk_score}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[600px]">
                      {event.command_line}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
