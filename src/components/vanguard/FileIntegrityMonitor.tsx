import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileCheck, Plus, RefreshCw, AlertTriangle, CheckCircle, 
  FileX, FilePlus, FileEdit, Trash2, Eye, Shield
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface FIMBaseline {
  id: string;
  agent_id: string | null;
  file_path: string;
  file_hash: string;
  file_size: number | null;
  permissions: string | null;
  is_monitored: boolean | null;
  is_directory: boolean | null;
  owner: string | null;
  last_modified: string | null;
  created_at: string;
  updated_at: string;
}

interface FIMEvent {
  id: string;
  agent_id: string | null;
  baseline_id: string | null;
  file_path: string;
  change_type: string;
  old_hash: string | null;
  new_hash: string | null;
  old_value: any;
  new_value: any;
  severity: string;
  is_acknowledged: boolean | null;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export function FileIntegrityMonitor() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [baselines, setBaselines] = useState<FIMBaseline[]>([]);
  const [events, setEvents] = useState<FIMEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [showAddPath, setShowAddPath] = useState(false);
  const [newPath, setNewPath] = useState("");

  useEffect(() => {
    if (user) {
      loadBaselines();
      loadEvents();
      
      // Set up real-time subscription for FIM events
      const channel = supabase
        .channel('fim-events')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'fim_events',
        }, (payload) => {
          setEvents(prev => [payload.new as FIMEvent, ...prev]);
          toast.warning(`File change detected: ${(payload.new as FIMEvent).file_path}`);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, selectedAgentId]);

  const loadBaselines = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('fim_baselines')
        .select('*')
        .eq('user_id', user?.id)
        .order('file_path', { ascending: true });

      if (error) throw error;
      setBaselines((data || []) as FIMBaseline[]);
    } catch (err) {
      console.error('Failed to load FIM baselines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('fim_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents((data || []) as FIMEvent[]);
    } catch (err) {
      console.error('Failed to load FIM events:', err);
    }
  };

  const triggerScan = async () => {
    if (!selectedAgentId) {
      toast.error("Select an agent to scan");
      return;
    }

    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('fim-operations', {
        body: { action: 'scan', agent_id: selectedAgentId }
      });

      if (error) throw error;
      toast.success(`Scan queued: ${data.paths_count} paths on ${data.agent}`);
    } catch (err: any) {
      toast.error("Failed to trigger scan", { description: err.message });
    } finally {
      setIsScanning(false);
    }
  };

  const addMonitoredPath = async () => {
    if (!newPath || !selectedAgentId) {
      toast.error("Select an agent and enter a path");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('fim-operations', {
        body: { 
          action: 'add_path', 
          agent_id: selectedAgentId,
          path: newPath 
        }
      });

      if (error) throw error;
      
      toast.success("Path added for monitoring");
      setNewPath("");
      setShowAddPath(false);
      loadBaselines();
    } catch (err: any) {
      toast.error("Failed to add path", { description: err.message });
    }
  };

  const removePath = async (baselineId: string) => {
    try {
      const { error } = await supabase.functions.invoke('fim-operations', {
        body: { action: 'remove_path', baseline_id: baselineId }
      });

      if (error) throw error;
      toast.success("Path removed");
      loadBaselines();
    } catch (err: any) {
      toast.error("Failed to remove path", { description: err.message });
    }
  };

  const rebaseline = async (baselineId: string) => {
    try {
      const { error } = await supabase.functions.invoke('fim-operations', {
        body: { action: 'rebaseline', baseline_id: baselineId }
      });

      if (error) throw error;
      toast.success("Rebaseline queued");
    } catch (err: any) {
      toast.error("Failed to rebaseline", { description: err.message });
    }
  };

  const acknowledgeEvent = async (eventId: string) => {
    try {
      const { error } = await supabase.functions.invoke('fim-operations', {
        body: { action: 'acknowledge_event', event_id: eventId }
      });

      if (error) throw error;
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, is_acknowledged: true } : e
      ));
      toast.success("Event acknowledged");
    } catch (err: any) {
      toast.error("Failed to acknowledge", { description: err.message });
    }
  };

  const getEventIcon = (changeType: string) => {
    switch (changeType) {
      case 'created': return <FilePlus className="h-4 w-4 text-green-500" />;
      case 'modified': return <FileEdit className="h-4 w-4 text-orange-500" />;
      case 'deleted': return <FileX className="h-4 w-4 text-red-500" />;
      case 'permission_change': return <Shield className="h-4 w-4 text-yellow-500" />;
      default: return <FileCheck className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500';
      case 'high': return 'bg-orange-500/10 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'low': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const criticalPaths = [
    "/etc/passwd",
    "/etc/shadow",
    "/etc/sudoers",
    "/etc/ssh/sshd_config",
    "/var/log/auth.log",
    "C:\\Windows\\System32\\config\\SAM",
    "C:\\Windows\\System32\\drivers\\etc\\hosts"
  ];

  const modifiedCount = events.filter(e => e.change_type === 'modified').length;
  const deletedCount = events.filter(e => e.change_type === 'deleted').length;
  const createdCount = events.filter(e => e.change_type === 'created').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6" />
            File Integrity Monitoring
          </h2>
          <p className="text-muted-foreground">Track changes to critical system files</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgentId || "__all__"} onValueChange={(v) => setSelectedAgentId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={!selectedAgentId || isScanning} onClick={triggerScan}>
            {isScanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Scan Now
          </Button>
          <Dialog open={showAddPath} onOpenChange={setShowAddPath}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Path
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monitored Path</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Agent</label>
                  <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">File/Directory Path</label>
                  <Input
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder="/etc/passwd or C:\Windows\System32"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Suggested Critical Paths:</p>
                  <div className="flex flex-wrap gap-2">
                    {criticalPaths.slice(0, 4).map(path => (
                      <Badge 
                        key={path} 
                        variant="outline" 
                        className="cursor-pointer"
                        onClick={() => setNewPath(path)}
                      >
                        {path}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddPath(false)}>Cancel</Button>
                  <Button onClick={addMonitoredPath}>Add Path</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monitored Files</p>
                <p className="text-2xl font-bold">{baselines.length}</p>
              </div>
              <FileCheck className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Modified</p>
                <p className="text-2xl font-bold text-orange-500">{modifiedCount}</p>
              </div>
              <FileEdit className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deleted</p>
                <p className="text-2xl font-bold text-red-500">{deletedCount}</p>
              </div>
              <FileX className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Files</p>
                <p className="text-2xl font-bold text-green-500">{createdCount}</p>
              </div>
              <FilePlus className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Change Events</TabsTrigger>
          <TabsTrigger value="baselines">Monitored Files</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>File Change Events</CardTitle>
              <CardDescription>Real-time file system changes detected by agents</CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p className="text-muted-foreground">No file changes detected. Your systems are stable!</p>
                </div>
              ) : (
              <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {events.map(event => (
                      <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg ${event.is_acknowledged ? 'bg-muted/30' : 'bg-muted/50'}`}>
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.change_type)}
                          <div>
                            <p className="font-medium font-mono text-sm">{event.file_path}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {event.change_type.replace('_', ' ')}
                              {event.old_hash && event.new_hash && (
                                <span> • Hash changed</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                          {!event.is_acknowledged && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => acknowledgeEvent(event.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baselines" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitored File Baselines</CardTitle>
              <CardDescription>Files being tracked for integrity changes</CardDescription>
            </CardHeader>
            <CardContent>
              {baselines.length === 0 ? (
                <div className="p-8 text-center">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No files being monitored. Add paths to start tracking.</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {baselines.map(baseline => (
                      <div key={baseline.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileCheck className={`h-4 w-4 ${baseline.is_monitored ? 'text-green-500' : 'text-orange-500'}`} />
                          <div>
                            <p className="font-medium font-mono text-sm">{baseline.file_path}</p>
                            <p className="text-xs text-muted-foreground">
                              Hash: {baseline.file_hash.substring(0, 16)}... • Size: {baseline.file_size || 0} bytes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={baseline.is_monitored ? 'outline' : 'destructive'}>
                            {baseline.is_monitored ? 'monitored' : 'disabled'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => rebaseline(baseline.id)}
                            title="Rebaseline (capture current state)"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removePath(baseline.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
