import { useState, useEffect } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Zap,
  Search,
  RefreshCw,
  MoreVertical,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  memoryMB: number;
  threads: number;
  handles: number;
  status: 'running' | 'suspended' | 'waiting';
  path?: string;
  user?: string;
  startTime?: Date;
}

interface ProcessManagerProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function ProcessManager({ agentId, sendCommand }: ProcessManagerProps) {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProcessInfo; direction: 'asc' | 'desc' }>({ 
    key: 'cpu', 
    direction: 'desc' 
  });
  const [killingPids, setKillingPids] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadProcesses();
    const interval = setInterval(loadProcesses, 10000);
    return () => clearInterval(interval);
  }, [agentId]);

  const loadProcesses = async () => {
    try {
      const result = await sendCommand('get_processes');
      if (result?.processes) {
        setProcesses(result.processes);
      } else {
        // Demo data
        setProcesses([
          { pid: 4, name: 'System', cpu: 0.5, memory: 0.3, memoryMB: 24, threads: 180, handles: 3500, status: 'running', user: 'SYSTEM' },
          { pid: 1234, name: 'explorer.exe', cpu: 2.1, memory: 1.5, memoryMB: 120, threads: 45, handles: 1200, status: 'running', user: 'User', path: 'C:\\Windows\\explorer.exe' },
          { pid: 2345, name: 'chrome.exe', cpu: 18.5, memory: 12.3, memoryMB: 984, threads: 120, handles: 2800, status: 'running', user: 'User', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
          { pid: 2346, name: 'chrome.exe', cpu: 5.2, memory: 4.1, memoryMB: 328, threads: 25, handles: 450, status: 'running', user: 'User' },
          { pid: 2347, name: 'chrome.exe', cpu: 3.8, memory: 3.5, memoryMB: 280, threads: 18, handles: 320, status: 'running', user: 'User' },
          { pid: 3456, name: 'MsMpEng.exe', cpu: 8.2, memory: 3.8, memoryMB: 304, threads: 35, handles: 890, status: 'running', user: 'SYSTEM', path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform' },
          { pid: 4567, name: 'svchost.exe', cpu: 1.5, memory: 1.2, memoryMB: 96, threads: 28, handles: 650, status: 'running', user: 'SYSTEM' },
          { pid: 4568, name: 'svchost.exe', cpu: 0.8, memory: 0.9, memoryMB: 72, threads: 15, handles: 420, status: 'running', user: 'LOCAL SERVICE' },
          { pid: 5678, name: 'Code.exe', cpu: 12.4, memory: 8.5, memoryMB: 680, threads: 85, handles: 1500, status: 'running', user: 'User', path: 'C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe' },
          { pid: 6789, name: 'Teams.exe', cpu: 4.5, memory: 6.2, memoryMB: 496, threads: 55, handles: 980, status: 'running', user: 'User' },
          { pid: 7890, name: 'Slack.exe', cpu: 2.8, memory: 4.5, memoryMB: 360, threads: 42, handles: 720, status: 'running', user: 'User' },
          { pid: 8901, name: 'OneDrive.exe', cpu: 1.2, memory: 2.1, memoryMB: 168, threads: 22, handles: 380, status: 'running', user: 'User' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load processes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (key: keyof ProcessInfo) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleKill = async (pid: number, name: string) => {
    if (!confirm(`Terminate ${name} (PID: ${pid})?`)) return;
    
    setKillingPids(prev => new Set(prev).add(pid));
    try {
      await sendCommand('kill_process', { pid });
      toast.success(`Terminated ${name}`);
      setTimeout(loadProcesses, 1000);
    } catch (err) {
      toast.error(`Failed to terminate ${name}`);
    } finally {
      setKillingPids(prev => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
    }
  };

  const handleKillTree = async (pid: number, name: string) => {
    if (!confirm(`Terminate ${name} and all child processes?`)) return;
    
    setKillingPids(prev => new Set(prev).add(pid));
    try {
      await sendCommand('kill_process_tree', { pid });
      toast.success(`Terminated ${name} and children`);
      setTimeout(loadProcesses, 1000);
    } catch (err) {
      toast.error(`Failed to terminate process tree`);
    } finally {
      setKillingPids(prev => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
    }
  };

  const filteredAndSorted = [...processes]
    .filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pid.toString().includes(searchQuery) ||
      (p.user?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
      }
      return sortConfig.direction === 'desc' 
        ? String(bVal).localeCompare(String(aVal))
        : String(aVal).localeCompare(String(bVal));
    });

  const totalCPU = processes.reduce((sum, p) => sum + p.cpu, 0);
  const totalMemory = processes.reduce((sum, p) => sum + p.memoryMB, 0);

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof ProcessInfo }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 font-medium"
      onClick={() => handleSort(sortKey)}
    >
      {label}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Process Manager
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span>CPU: <strong>{totalCPU.toFixed(1)}%</strong></span>
            <span>Memory: <strong>{(totalMemory / 1024).toFixed(1)} GB</strong></span>
            <Button variant="outline" size="sm" onClick={loadProcesses} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, PID, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">
                    <SortableHeader label="PID" sortKey="pid" />
                  </TableHead>
                  <TableHead>
                    <SortableHeader label="Name" sortKey="name" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="CPU" sortKey="cpu" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Memory" sortKey="memoryMB" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortableHeader label="Threads" sortKey="threads" />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((process) => (
                  <TableRow key={process.pid}>
                    <TableCell className="font-mono text-sm">{process.pid}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {process.name}
                          {process.cpu > 15 && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                              High CPU
                            </Badge>
                          )}
                        </div>
                        {process.path && (
                          <div className="text-xs text-muted-foreground truncate max-w-[250px]" title={process.path}>
                            {process.path}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={process.cpu > 10 ? 'text-red-500 font-medium' : ''}>
                        {process.cpu.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {process.memoryMB} MB
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {process.threads}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {process.user || '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            disabled={killingPids.has(process.pid)}
                          >
                            {killingPids.has(process.pid) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleKill(process.pid, process.name)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            End Task
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleKillTree(process.pid, process.name)}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            End Process Tree
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
        <div className="mt-2 text-xs text-muted-foreground text-right">
          {filteredAndSorted.length} processes
        </div>
      </CardContent>
    </Card>
  );
}
