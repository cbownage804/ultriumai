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
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProcessInfo; direction: 'asc' | 'desc' }>({ 
    key: 'cpu', 
    direction: 'desc' 
  });
  const [killingPids, setKillingPids] = useState<Set<number>>(new Set());

  // No auto-load on mount - user must click Refresh to avoid flooding the command queue

  const loadProcesses = async () => {
    try {
      const result = await sendCommand('get_processes');
      if (result?.processes) {
        setProcesses(result.processes);
      } else {
        // No data from agent - show empty state
        setProcesses([]);
      }
    } catch (err) {
      console.error('Failed to load processes');
      setProcesses([]);
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
      const result = await sendCommand('kill_process', { pid });
      if (result?.pending) {
        toast.info(`Kill command queued for ${name} - waiting for agent`);
      } else {
        toast.success(`Terminated ${name}`);
      }
      setTimeout(loadProcesses, 2000);
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
      const result = await sendCommand('kill_process_tree', { pid });
      if (result?.pending) {
        toast.info(`Kill tree command queued for ${name} - waiting for agent`);
      } else {
        toast.success(`Terminated ${name} and children`);
      }
      setTimeout(loadProcesses, 2000);
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
