import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crosshair, 
  Shield, 
  AlertTriangle, 
  Activity,
  Play,
  Square,
  Plus,
  Trash2,
  Eye,
  Clock,
  MapPin,
  RefreshCw,
  Globe,
  Server,
  FileText,
  Database
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { formatDistanceToNow } from "date-fns";

interface Honeypot {
  id: string;
  type: string;
  port: number;
  status: 'active' | 'stopped' | 'deploying';
  interactions: number;
  lastInteraction?: string;
  deployedAt: string;
  agentId: string;
}

interface HoneypotEvent {
  id: string;
  honeypot_type: string;
  honeypot_port: number | null;
  attacker_ip: string;
  interaction_type?: string | null;
  created_at: string | null;
  geo_location?: any;
  interaction_data?: any;
}

const HONEYPOT_TYPES = [
  { value: 'ssh', label: 'SSH (Port 22)', icon: Server, description: 'Fake SSH server to capture credentials' },
  { value: 'http', label: 'HTTP (Port 80)', icon: Globe, description: 'Web server honeypot for web attacks' },
  { value: 'ftp', label: 'FTP (Port 21)', icon: FileText, description: 'FTP honeypot for file-based attacks' },
  { value: 'smb', label: 'SMB (Port 445)', icon: Database, description: 'Windows share honeypot' },
  { value: 'telnet', label: 'Telnet (Port 23)', icon: Server, description: 'Legacy Telnet honeypot' },
  { value: 'mysql', label: 'MySQL (Port 3306)', icon: Database, description: 'Database honeypot' },
];

export function HoneypotManager() {
  const { toast } = useToast();
  const { agents, isLoading: loadingAgents } = useVanguardAgents();
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [honeypots, setHoneypots] = useState<Honeypot[]>([]);
  const [events, setEvents] = useState<HoneypotEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [newHoneypotType, setNewHoneypotType] = useState('ssh');
  const [customPort, setCustomPort] = useState('');
  const [autoAlert, setAutoAlert] = useState(true);

  // Load honeypot events
  useEffect(() => {
    loadEvents();
  }, []);

  // Set default agent
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      const onlineAgent = agents.find(a => a.status === 'online');
      if (onlineAgent) {
        setSelectedAgent(onlineAgent.id);
      }
    }
  }, [agents, selectedAgent]);

  const loadEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vanguard_honeypot_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents((data || []).map(e => ({ ...e, attack_type: e.interaction_type })) as any);
    } catch (error) {
      console.error('Error loading honeypot events:', error);
    }
  };

  const deployHoneypot = async () => {
    if (!selectedAgent) {
      toast({ title: "Select an agent", description: "Choose a Vanguard agent to deploy the honeypot", variant: "destructive" });
      return;
    }

    setIsDeploying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const selectedType = HONEYPOT_TYPES.find(t => t.value === newHoneypotType);
      const port = customPort ? parseInt(customPort) : getDefaultPort(newHoneypotType);

      // Send command to agent
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: selectedAgent,
          user_id: user.id,
          command_type: 'honeypot_deploy',
          payload: {
            type: newHoneypotType,
            port: port,
            auto_alert: autoAlert,
            capture_credentials: true
          },
          status: 'pending'
        } as any);

      if (error) throw error;

      toast({ 
        title: "Honeypot Deploying", 
        description: `${selectedType?.label} honeypot is being deployed on port ${port}` 
      });

      // Add to local state
      setHoneypots(prev => [...prev, {
        id: Date.now().toString(),
        type: newHoneypotType,
        port: port,
        status: 'deploying',
        interactions: 0,
        deployedAt: new Date().toISOString(),
        agentId: selectedAgent
      }]);

    } catch (error: any) {
      toast({ title: "Deployment Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsDeploying(false);
    }
  };

  const stopHoneypot = async (honeypot: Honeypot) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: honeypot.agentId,
          user_id: user?.id,
          command_type: 'honeypot_stop',
          payload: { type: honeypot.type, port: honeypot.port },
          status: 'pending'
        } as any);

      if (error) throw error;
      
      setHoneypots(prev => prev.map(h => 
        h.id === honeypot.id ? { ...h, status: 'stopped' } : h
      ));
      
      toast({ title: "Honeypot Stopped", description: `${honeypot.type.toUpperCase()} honeypot stopped` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getDefaultPort = (type: string): number => {
    const ports: Record<string, number> = {
      ssh: 2222, http: 8080, ftp: 2121, smb: 4445, telnet: 2323, mysql: 3307
    };
    return ports[type] || 9999;
  };

  const getSeverityBadge = (attackType: string) => {
    if (attackType.includes('brute') || attackType.includes('exploit')) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (attackType.includes('scan') || attackType.includes('probe')) {
      return <Badge variant="secondary">Low</Badge>;
    }
    return <Badge className="bg-yellow-500">Medium</Badge>;
  };

  const onlineAgents = agents.filter(a => a.status === 'online');
  const totalInteractions = events.length;
  const uniqueAttackers = new Set(events.map(e => e.attacker_ip)).size;
  const criticalEvents = events.filter(e => e.attack_type?.includes('brute') || e.attack_type?.includes('exploit')).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Honeypots</CardTitle>
            <Crosshair className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{honeypots.filter(h => h.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">Decoys deployed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInteractions}</div>
            <p className="text-xs text-muted-foreground">Attacker connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Attackers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAttackers}</div>
            <p className="text-xs text-muted-foreground">Distinct IPs detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalEvents}</div>
            <p className="text-xs text-muted-foreground">High-severity attacks</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy">Deploy Honeypots</TabsTrigger>
          <TabsTrigger value="active">Active Decoys</TabsTrigger>
          <TabsTrigger value="events">Attack Events</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Deploy New Honeypot
              </CardTitle>
              <CardDescription>
                Deploy deception services to detect and analyze attacker behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {onlineAgents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} ({agent.ip_address})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Honeypot Type</Label>
                  <Select value={newHoneypotType} onValueChange={setNewHoneypotType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HONEYPOT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Custom Port (optional)</Label>
                  <Input 
                    type="number" 
                    placeholder={`Default: ${getDefaultPort(newHoneypotType)}`}
                    value={customPort}
                    onChange={e => setCustomPort(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch id="auto-alert" checked={autoAlert} onCheckedChange={setAutoAlert} />
                  <Label htmlFor="auto-alert">Auto-alert on interaction</Label>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {HONEYPOT_TYPES.find(t => t.value === newHoneypotType)?.description}
                </p>
              </div>

              <Button onClick={deployHoneypot} disabled={isDeploying || !selectedAgent}>
                {isDeploying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Deploy Honeypot
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Deploy Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {HONEYPOT_TYPES.slice(0, 3).map(type => (
              <Card key={type.value} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setNewHoneypotType(type.value)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <type.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-sm">{type.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Honeypots</CardTitle>
              <CardDescription>Currently deployed deception services</CardDescription>
            </CardHeader>
            <CardContent>
              {honeypots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Crosshair className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No honeypots deployed yet</p>
                  <p className="text-sm">Deploy your first honeypot to start detecting attackers</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {honeypots.map(honeypot => {
                    const agent = agents.find(a => a.id === honeypot.agentId);
                    return (
                      <div key={honeypot.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Crosshair className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{honeypot.type.toUpperCase()} Honeypot</p>
                            <p className="text-sm text-muted-foreground">
                              Port {honeypot.port} on {agent?.name || 'Unknown Agent'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{honeypot.interactions} interactions</p>
                            <p className="text-xs text-muted-foreground">
                              Deployed {formatDistanceToNow(new Date(honeypot.deployedAt))} ago
                            </p>
                          </div>
                          <Badge variant={honeypot.status === 'active' ? 'default' : honeypot.status === 'deploying' ? 'secondary' : 'outline'}>
                            {honeypot.status}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => stopHoneypot(honeypot)}>
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Attack Events</CardTitle>
                <CardDescription>Interactions captured by honeypots</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadEvents}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attack events captured yet</p>
                  <p className="text-sm">Events will appear here when attackers interact with honeypots</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {events.map(event => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{event.attack_type || 'Connection Attempt'}</p>
                              {getSeverityBadge(event.attack_type || '')}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.honeypot_type?.toUpperCase()}:{event.honeypot_port} from {event.attacker_ip}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {event.geo_location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {typeof event.geo_location === 'object' ? (event.geo_location as any).country || 'Unknown' : 'Unknown'}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(event.created_at))} ago
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
