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
  agent_id: string;
  file_path: string;
  file_hash: string;
  file_size: number;
  permissions: string;
  last_checked: string;
  status: 'normal' | 'modified' | 'deleted' | 'new';
}

interface FIMEvent {
  id: string;
  agent_id: string;
  file_path: string;
  event_type: 'created' | 'modified' | 'deleted' | 'permission_change';
  old_hash?: string;
  new_hash?: string;
  detected_at: string;
  severity: string;
}

export function FileIntegrityMonitor() {
  const { user } = useAuth();
  const { agents } = useVanguardAgents();
  const [baselines, setBaselines] = useState<FIMBaseline[]>([]);
  const [events, setEvents] = useState<FIMEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [showAddPath, setShowAddPath] = useState(false);
  const [newPath, setNewPath] = useState("");

  useEffect(() => {
    if (user) {
      loadBaselines();
      loadEvents();
    }
  }, [user, selectedAgentId]);

  const loadBaselines = async () => {
    try {
      let query = supabase
        .from('fim_baselines')
        .select('*')
        .eq('user_id', user?.id)
        .order('file_path', { ascending: true });

      if (selectedAgentId) {
        query = query.eq('agent_id', selectedAgentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBaselines(data || []);
    } catch (err) {
      console.error('Failed to load FIM baselines:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      let query = supabase
        .from('fim_events')
        .select('*')
        .eq('user_id', user?.id)
        .order('detected_at', { ascending: false })
        .limit(100);

      if (selectedAgentId) {
        query = query.eq('agent_id', selectedAgentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load FIM events:', err);
    }
  };

  const addMonitoredPath = async () => {
    if (!newPath || !selectedAgentId) {
      toast.error("Select an agent and enter a path");
      return;
    }

    try {
      const { error } = await supabase
        .from('fim_baselines')
        .insert({
          user_id: user?.id,
          agent_id: selectedAgentId,
          file_path: newPath,
          file_hash: 'pending',
          file_size: 0,
          permissions: 'pending',
          status: 'normal'
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
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

  const modifiedCount = events.filter(e => e.event_type === 'modified').length;
  const deletedCount = events.filter(e => e.event_type === 'deleted').length;
  const createdCount = events.filter(e => e.event_type === 'created').length;

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
                      <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {getEventIcon(event.event_type)}
                          <div>
                            <p className="font-medium font-mono text-sm">{event.file_path}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {event.event_type.replace('_', ' ')}
                              {event.old_hash && event.new_hash && (
                                <span> • Hash changed</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.detected_at).toLocaleString()}
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
                          <FileCheck className={`h-4 w-4 ${baseline.status === 'normal' ? 'text-green-500' : 'text-orange-500'}`} />
                          <div>
                            <p className="font-medium font-mono text-sm">{baseline.file_path}</p>
                            <p className="text-xs text-muted-foreground">
                              Hash: {baseline.file_hash.substring(0, 16)}... • Size: {baseline.file_size} bytes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={baseline.status === 'normal' ? 'outline' : 'destructive'}>
                            {baseline.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
