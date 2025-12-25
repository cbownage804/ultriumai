import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Terminal, Play, Square, AlertTriangle, Clock, 
  Send, Loader2, Monitor, History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

interface CommandHistoryItem {
  id: string;
  command: string;
  output?: string;
  executed_at: string;
  is_dangerous: boolean;
}

interface Session {
  id: string;
  agent_id: string;
  session_type: string;
  status: string;
  started_at: string;
  commands_executed: number;
}

export function LiveResponseTerminal() {
  const { agents } = useVanguardAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'warning');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Subscribe to command results
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`live-response-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_response_commands',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setCommandHistory(prev => 
            prev.map(c => c.id === updated.id ? { ...c, output: updated.output } : c)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  const startSession = async () => {
    if (!selectedAgentId) {
      toast.error("Select an agent first");
      return;
    }

    setIsStarting(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke('live-response', {
        body: { 
          agent_id: selectedAgentId, 
          session_type: 'shell' 
        },
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);

      setSession(response.data.session);
      setCommandHistory([]);
      toast.success("Live response session started");
    } catch (err) {
      console.error('Failed to start session:', err);
      toast.error("Failed to start session");
    } finally {
      setIsStarting(false);
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      await supabase.functions.invoke('live-response', {
        body: { session_id: session.id },
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });

      setSession(null);
      setCommandHistory([]);
      toast.success("Session ended");
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const executeCommand = async () => {
    if (!session || !command.trim()) return;

    setIsExecuting(true);
    const cmdText = command.trim();
    setCommand("");

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const response = await supabase.functions.invoke('live-response', {
        body: { 
          session_id: session.id,
          command: cmdText,
        },
        headers: { Authorization: `Bearer ${authSession.access_token}` },
      });

      if (response.error) throw new Error(response.error.message);

      // Add to history (output will come via subscription)
      setCommandHistory(prev => [...prev, {
        id: response.data.command_log_id,
        command: cmdText,
        executed_at: new Date().toISOString(),
        is_dangerous: response.data.is_dangerous,
      }]);

      if (response.data.is_dangerous) {
        toast.warning("Potentially dangerous command", { description: "Command flagged for audit" });
      }
    } catch (err) {
      console.error('Failed to execute command:', err);
      toast.error("Failed to execute command");
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Live Response Terminal
          </CardTitle>
          {session && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Active Session
              </Badge>
              <Button variant="destructive" size="sm" onClick={endSession}>
                <Square className="h-4 w-4 mr-1" />
                End
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!session ? (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an agent..." />
                </SelectTrigger>
                <SelectContent>
                  {onlineAgents.length === 0 ? (
                    <SelectItem value="_none" disabled>No online agents</SelectItem>
                  ) : (
                    onlineAgents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          {agent.name} ({agent.ip_address})
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button onClick={startSession} disabled={!selectedAgentId || isStarting}>
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Start Session
              </Button>
            </div>

            <div className="p-6 border-2 border-dashed rounded-lg text-center">
              <Terminal className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                Select an online agent and start a live response session to execute commands remotely.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                All commands are logged for audit purposes.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Agent Info */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <Monitor className="h-5 w-5" />
              <div>
                <p className="font-medium">{selectedAgent?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAgent?.ip_address} • {selectedAgent?.agent_version || 'Unknown'}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Commands: {session.commands_executed}</p>
              </div>
            </div>

            {/* Terminal Output */}
            <div 
              ref={scrollRef}
              className="bg-black rounded-lg p-4 font-mono text-sm h-[400px] overflow-auto"
            >
              <div className="text-green-400 mb-2">
                Ultrium Vanguard Live Response v1.0
              </div>
              <div className="text-gray-400 mb-4">
                Connected to {selectedAgent?.name} at {new Date(session.started_at).toLocaleTimeString()}
              </div>
              
              {commandHistory.map((cmd, i) => (
                <div key={i} className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">$</span>
                    <span className="text-white">{cmd.command}</span>
                    {cmd.is_dangerous && (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                  </div>
                  {cmd.output ? (
                    <pre className="text-gray-300 mt-1 whitespace-pre-wrap">{cmd.output}</pre>
                  ) : (
                    <div className="text-gray-500 flex items-center gap-2 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Waiting for response...
                    </div>
                  )}
                </div>
              ))}

              {/* Input indicator */}
              <div className="flex items-center gap-2 text-blue-400">
                <span>$</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>

            {/* Command Input */}
            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter command..."
                className="font-mono"
                onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
                disabled={isExecuting}
              />
              <Button onClick={executeCommand} disabled={isExecuting || !command.trim()}>
                {isExecuting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <History className="h-3 w-3" />
                Use ↑/↓ for history
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Dangerous commands are flagged
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
