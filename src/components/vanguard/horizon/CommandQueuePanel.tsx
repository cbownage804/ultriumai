import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Terminal,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Trash2,
  Server,
  Timer,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentCommand {
  id: string;
  agent_id: string;
  command_type: string;
  command: string;
  status: "pending" | "running" | "completed" | "failed" | "timeout";
  result?: string;
  error?: string;
  created_at: string;
  executed_at?: string;
  completed_at?: string;
  device_name?: string;
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string; animate?: boolean }> = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Pending" },
  running: { icon: Loader2, color: "text-blue-500", bg: "bg-blue-500/10", label: "Running", animate: true },
  completed: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Failed" },
  timeout: { icon: Timer, color: "text-orange-500", bg: "bg-orange-500/10", label: "Timeout" },
};

const COMMAND_TYPE_LABELS: Record<string, string> = {
  run_script: "Run Script",
  install_package: "Install Package",
  restart: "Restart Device",
  shutdown: "Shutdown",
  get_processes: "Get Processes",
  get_services: "Get Services",
  kill_process: "Kill Process",
  start_service: "Start Service",
  stop_service: "Stop Service",
  get_system_info: "System Info",
  clear_temp: "Clear Temp Files",
  windows_update: "Windows Update",
  av_scan: "Antivirus Scan",
  apply_policy: "Apply Policy",
};

export function CommandQueuePanel() {
  const { user } = useAuth();
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommand, setSelectedCommand] = useState<AgentCommand | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "running" | "completed" | "failed">("all");

  useEffect(() => {
    if (user) {
      fetchCommands();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('command_queue')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'vanguard_agent_commands',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchCommands();
        })
        .subscribe();

      // Poll every 5 seconds for running commands
      const interval = setInterval(fetchCommands, 5000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchCommands = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vanguard_agent_commands')
        .select(`
          id,
          agent_id,
          command_type,
          command,
          status,
          result,
          error,
          created_at,
          executed_at,
          completed_at,
          vanguard_agents(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setCommands((data || []).map((c: any) => ({
        ...c,
        device_name: c.vanguard_agents?.name || 'Unknown Device',
      })));
    } catch (err) {
      console.error('Error fetching commands:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelCommand = async (commandId: string) => {
    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .update({ status: 'failed', error: 'Cancelled by user' })
        .eq('id', commandId)
        .eq('status', 'pending');

      if (error) throw error;
      toast.success("Command cancelled");
      fetchCommands();
    } catch (err) {
      toast.error("Failed to cancel command");
    }
  };

  const retryCommand = async (command: AgentCommand) => {
    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: command.agent_id,
          user_id: user?.id,
          command_type: command.command_type,
          command: command.command,
          status: 'pending',
        });

      if (error) throw error;
      toast.success("Command queued for retry");
      fetchCommands();
    } catch (err) {
      toast.error("Failed to retry command");
    }
  };

  const clearCompleted = async () => {
    try {
      const { error } = await supabase
        .from('vanguard_agent_commands')
        .delete()
        .eq('user_id', user?.id)
        .in('status', ['completed', 'failed', 'timeout']);

      if (error) throw error;
      toast.success("Cleared completed commands");
      fetchCommands();
    } catch (err) {
      toast.error("Failed to clear commands");
    }
  };

  const filteredCommands = commands.filter(c => 
    filter === "all" ? true : c.status === filter
  );

  const stats = {
    pending: commands.filter(c => c.status === 'pending').length,
    running: commands.filter(c => c.status === 'running').length,
    completed: commands.filter(c => c.status === 'completed').length,
    failed: commands.filter(c => c.status === 'failed' || c.status === 'timeout').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-cyan-500" />
              Command Queue
            </CardTitle>
            <CardDescription>
              Track and manage remote command execution
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCommands}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={clearCompleted}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div 
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              filter === "pending" ? "border-yellow-500 bg-yellow-500/10" : "hover:border-muted-foreground/30"
            )}
            onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Pending</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </div>
          <div 
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              filter === "running" ? "border-blue-500 bg-blue-500/10" : "hover:border-muted-foreground/30"
            )}
            onClick={() => setFilter(filter === "running" ? "all" : "running")}
          >
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              <span className="text-sm text-muted-foreground">Running</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.running}</p>
          </div>
          <div 
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              filter === "completed" ? "border-green-500 bg-green-500/10" : "hover:border-muted-foreground/30"
            )}
            onClick={() => setFilter(filter === "completed" ? "all" : "completed")}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </div>
          <div 
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              filter === "failed" ? "border-red-500 bg-red-500/10" : "hover:border-muted-foreground/30"
            )}
            onClick={() => setFilter(filter === "failed" ? "all" : "failed")}
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Failed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.failed}</p>
          </div>
        </div>

        {/* Commands List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {filteredCommands.map(command => {
              const config = STATUS_CONFIG[command.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              
              return (
                <div
                  key={command.id}
                  className={cn(
                    "p-4 rounded-lg border transition-colors hover:border-muted-foreground/30",
                    config.bg
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg bg-background/50", config.color)}>
                        <StatusIcon className={cn("h-4 w-4", config.animate && "animate-spin")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {COMMAND_TYPE_LABELS[command.command_type] || command.command_type}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Server className="h-3 w-3" />
                          <span>{command.device_name}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(command.created_at), { addSuffix: true })}</span>
                        </div>
                        {command.error && (
                          <p className="text-sm text-red-500 mt-2">{command.error}</p>
                        )}
                        {command.completed_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Completed {formatDistanceToNow(new Date(command.completed_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCommand(command);
                          setViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {command.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => cancelCommand(command.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(command.status === "failed" || command.status === "timeout") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => retryCommand(command)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredCommands.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No commands in queue</p>
                <p className="text-sm">Commands will appear here when you execute actions on devices</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* View Command Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Command Details</DialogTitle>
            </DialogHeader>
            {selectedCommand && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Command Type</p>
                    <p className="font-medium">
                      {COMMAND_TYPE_LABELS[selectedCommand.command_type] || selectedCommand.command_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{selectedCommand.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Device</p>
                    <p className="font-medium">{selectedCommand.device_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(selectedCommand.created_at), "PPpp")}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Command Payload</p>
                  <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto max-h-40">
                    {selectedCommand.command}
                  </pre>
                </div>

                {selectedCommand.result && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Result</p>
                    <pre className="p-3 rounded-lg bg-muted text-xs overflow-auto max-h-60">
                      {selectedCommand.result}
                    </pre>
                  </div>
                )}

                {selectedCommand.error && (
                  <div>
                    <p className="text-sm text-red-500 mb-2">Error</p>
                    <pre className="p-3 rounded-lg bg-red-500/10 text-xs text-red-500 overflow-auto max-h-40">
                      {selectedCommand.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
