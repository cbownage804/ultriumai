import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Copy,
  RefreshCw,
} from "lucide-react";
import { VanguardCommand } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface DeviceCommandsTabProps {
  commands: VanguardCommand[];
  sendCommand: (commandType: string, payload?: Record<string, any>) => Promise<any>;
  isOnline: boolean;
  onRefresh: () => void;
}

const QUICK_COMMANDS = [
  { label: "System Info", type: "get_system_info", description: "Get full system information" },
  { label: "Restart", type: "restart", description: "Restart the device" },
  { label: "Sync RustDesk", type: "sync_rustdesk", description: "Install/sync RustDesk ID" },
  { label: "Diagnose RustDesk", type: "diagnose_rustdesk", description: "Run RustDesk diagnostics" },
  { label: "Get Processes", type: "get_processes", description: "List running processes" },
  { label: "Get Services", type: "get_services", description: "List Windows services" },
  { label: "Get Event Logs", type: "get_event_logs", description: "Retrieve recent event logs" },
  { label: "Collect Telemetry", type: "collect_telemetry", description: "Force telemetry collection" },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock className="h-3.5 w-3.5" />, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", label: "Pending" },
  sent: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", label: "Sent" },
  completed: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-green-400 border-green-500/30 bg-green-500/10", label: "Completed" },
  failed: { icon: <XCircle className="h-3.5 w-3.5" />, color: "text-red-400 border-red-500/30 bg-red-500/10", label: "Failed" },
};

function CommandRow({ command }: { command: VanguardCommand }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[command.status] || statusConfig.pending;

  const copyResponse = () => {
    const text = command.response
      ? JSON.stringify(command.response, null, 2)
      : command.error_message || "";
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="border border-cyan-500/20 rounded-lg bg-black/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-500/5 transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-white/40 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
        )}
        <code className="text-cyan-400 text-sm font-mono flex-1 truncate">
          {command.command_type}
        </code>
        <Badge variant="outline" className={cn("text-xs gap-1", status.color)}>
          {status.icon}
          {status.label}
        </Badge>
        <span className="text-white/40 text-xs whitespace-nowrap">
          {formatDistanceToNow(new Date(command.created_at), { addSuffix: true })}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-cyan-500/10 px-4 py-3 space-y-3">
          {/* Payload */}
          {command.payload && Object.keys(command.payload).length > 0 && (
            <div>
              <span className="text-white/40 text-xs uppercase tracking-wider">Payload</span>
              <pre className="mt-1 text-xs text-white/70 bg-black/60 rounded p-2 overflow-x-auto font-mono">
                {JSON.stringify(command.payload, null, 2)}
              </pre>
            </div>
          )}

          {/* Response */}
          {command.status === "completed" && command.response && (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-white/40 text-xs uppercase tracking-wider">Response</span>
                <Button variant="ghost" size="sm" onClick={copyResponse} className="h-6 text-white/40 hover:text-white">
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <pre className="mt-1 text-xs text-green-400/80 bg-black/60 rounded p-2 overflow-x-auto font-mono max-h-64 overflow-y-auto">
                {typeof command.response === "string"
                  ? command.response
                  : JSON.stringify(command.response, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {command.status === "failed" && command.error_message && (
            <div>
              <span className="text-white/40 text-xs uppercase tracking-wider">Error</span>
              <pre className="mt-1 text-xs text-red-400/80 bg-black/60 rounded p-2 overflow-x-auto font-mono">
                {command.error_message}
              </pre>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-white/30">
            <span>Created: {new Date(command.created_at).toLocaleString()}</span>
            {command.completed_at && (
              <span>Completed: {new Date(command.completed_at).toLocaleString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DeviceCommandsTab({ commands, sendCommand, isOnline, onRefresh }: DeviceCommandsTabProps) {
  const [commandType, setCommandType] = useState("powershell");
  const [customCommand, setCustomCommand] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendCommand = async () => {
    if (!customCommand.trim()) return;
    setIsSending(true);
    try {
      await sendCommand(commandType, {
        script: customCommand,
        shell: commandType,
      });
      setCustomCommand("");
    } catch (err) {
      toast.error("Failed to send command");
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickCommand = async (type: string) => {
    setIsSending(true);
    try {
      await sendCommand(type);
    } catch (err) {
      toast.error("Failed to send command");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Command Input */}
      <div className="bg-black/80 rounded-lg border border-cyan-500/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            <h3 className="font-medium text-white">Execute Command</h3>
          </div>
          {!isOnline && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 bg-yellow-500/10 text-xs">
              Device offline — commands will queue
            </Badge>
          )}
        </div>

        <div className="flex gap-2 mb-3">
          <Select value={commandType} onValueChange={setCommandType}>
            <SelectTrigger className="w-40 bg-black/60 border-cyan-500/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-cyan-500/30">
              <SelectItem value="powershell">PowerShell</SelectItem>
              <SelectItem value="cmd">CMD</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            placeholder={`Enter ${commandType} command...`}
            className="bg-black/60 border-cyan-500/20 text-white font-mono text-sm min-h-[80px] resize-y"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSendCommand();
              }
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/30 text-xs">Ctrl+Enter to send</span>
          <Button
            onClick={handleSendCommand}
            disabled={!customCommand.trim() || isSending}
            className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 hover:opacity-90 text-white gap-2"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Execute
          </Button>
        </div>
      </div>

      {/* Quick Commands */}
      <div className="bg-black/80 rounded-lg border border-cyan-500/30 p-4">
        <h3 className="font-medium text-white mb-3">Quick Commands</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUICK_COMMANDS.map((cmd) => (
            <Button
              key={cmd.type}
              variant="outline"
              size="sm"
              disabled={isSending}
              onClick={() => handleQuickCommand(cmd.type)}
              className="border-cyan-500/20 text-white/80 hover:bg-cyan-500/10 hover:text-white text-xs justify-start"
              title={cmd.description}
            >
              {cmd.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Command History */}
      <div className="bg-black/80 rounded-lg border border-cyan-500/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-white">Command History ({commands.length})</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-white/40 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>

        {commands.length === 0 ? (
          <div className="text-center py-8">
            <Terminal className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">No commands sent yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {commands.map((cmd) => (
              <CommandRow key={cmd.id} command={cmd} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
