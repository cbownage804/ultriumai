import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Terminal, Send, Trash2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TerminalLine {
  type: 'command' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

interface TerminalConsoleProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
  deviceName?: string;
}

export function TerminalConsole({ agentId, sendCommand, deviceName }: TerminalConsoleProps) {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<TerminalLine[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [shell, setShell] = useState<'cmd' | 'powershell' | 'bash'>('powershell');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial system message
    setHistory([
      {
        type: 'system',
        content: `Connected to ${deviceName || 'device'}. Type commands to execute remotely.`,
        timestamp: new Date(),
      },
    ]);
  }, [deviceName]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = async () => {
    if (!command.trim()) return;
    
    const cmd = command.trim();
    setCommand('');
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    
    // Add command to history
    setHistory(prev => [...prev, {
      type: 'command',
      content: `${shell === 'powershell' ? 'PS>' : shell === 'cmd' ? 'C:\\>' : '$'} ${cmd}`,
      timestamp: new Date(),
    }]);
    
    setIsExecuting(true);
    try {
      const result = await sendCommand('run_script', { 
        script: cmd, 
        shell: shell === 'bash' ? 'bash' : shell === 'powershell' ? 'powershell' : 'cmd'
      });
      
      // Simulated response for demo
      const output = result?.output || `Command "${cmd}" queued for execution. Check command history for results.`;
      
      setHistory(prev => [...prev, {
        type: 'output',
        content: output,
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      setHistory(prev => [...prev, {
        type: 'error',
        content: `Error: ${err.message || 'Failed to execute command'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsExecuting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const clearTerminal = () => {
    setHistory([{
      type: 'system',
      content: 'Terminal cleared.',
      timestamp: new Date(),
    }]);
  };

  const exportLogs = () => {
    const logs = history.map(h => 
      `[${h.timestamp.toISOString()}] ${h.type.toUpperCase()}: ${h.content}`
    ).join('\n');
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terminal-${agentId}-${new Date().toISOString()}.log`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Terminal logs exported');
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-cyan-400';
      case 'output': return 'text-gray-300';
      case 'error': return 'text-red-400';
      case 'system': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <Card className="bg-gray-900 text-gray-100">
      <CardHeader className="pb-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Terminal className="h-5 w-5" />
            Remote Terminal
            <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">
              {deviceName}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={shell} onValueChange={(v: any) => setShell(v)}>
              <SelectTrigger className="w-[130px] h-8 bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="powershell" className="text-gray-100">PowerShell</SelectItem>
                <SelectItem value="cmd" className="text-gray-100">CMD</SelectItem>
                <SelectItem value="bash" className="text-gray-100">Bash</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-100" onClick={exportLogs}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-100" onClick={clearTerminal}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
          <div className="font-mono text-sm space-y-1">
            {history.map((line, i) => (
              <div key={i} className={getLineColor(line.type)}>
                <pre className="whitespace-pre-wrap break-all">{line.content}</pre>
              </div>
            ))}
            {isExecuting && (
              <div className="text-yellow-400 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Executing...
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t border-gray-800 p-3 flex gap-2">
          <div className="text-gray-500 font-mono text-sm py-2">
            {shell === 'powershell' ? 'PS>' : shell === 'cmd' ? 'C:\\>' : '$'}
          </div>
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            disabled={isExecuting}
            className="flex-1 bg-transparent border-0 text-gray-100 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
          <Button 
            size="icon" 
            onClick={executeCommand} 
            disabled={isExecuting || !command.trim()}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isExecuting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
