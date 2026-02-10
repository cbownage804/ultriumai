import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  Loader2,
  Activity,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  memoryMB: number;
  status: string;
  user?: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
}

interface TaskManagerProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
  currentMetrics?: SystemMetrics;
}

export function TaskManager({ agentId, sendCommand, currentMetrics }: TaskManagerProps) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'name'>('cpu');
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadProcesses();
    }
  }, [agentId]);

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

  const handleKillProcess = async (pid: number, name: string) => {
    if (!confirm(`Kill process ${name} (PID: ${pid})?`)) return;
    
    setKillingPid(pid);
    try {
      await sendCommand('kill_process', { pid });
      toast.success(`Process ${name} terminated`);
      setTimeout(() => loadProcesses(), 1000);
    } catch (err) {
      toast.error(`Failed to kill process ${name}`);
    } finally {
      setKillingPid(null);
    }
  };

  const sortedProcesses = [...processes]
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'cpu') return b.cpu - a.cpu;
      if (sortBy === 'memory') return b.memory - a.memory;
      return a.name.localeCompare(b.name);
    });

  const metrics = currentMetrics || { cpu: 0, memory: 0, disk: 0, networkIn: 0, networkOut: 0 };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Task Manager
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadProcesses} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="processes">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="processes">Processes</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="processes" className="mt-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search processes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant={sortBy === 'cpu' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('cpu')}
              >
                CPU
              </Button>
              <Button
                variant={sortBy === 'memory' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('memory')}
              >
                Memory
              </Button>
            </div>
            
            <ScrollArea className="h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Process</TableHead>
                    <TableHead className="text-right">CPU</TableHead>
                    <TableHead className="text-right">Memory</TableHead>
                    <TableHead className="text-right">PID</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProcesses.map((process) => (
                    <TableRow key={process.pid}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{process.name}</div>
                          <div className="text-xs text-muted-foreground">{process.user}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={process.cpu > 10 ? 'text-red-500 font-medium' : ''}>
                          {process.cpu.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={process.memory > 5 ? 'text-orange-500' : ''}>
                          {process.memoryMB} MB
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{process.pid}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleKillProcess(process.pid, process.name)}
                          disabled={killingPid === process.pid}
                        >
                          {killingPid === process.pid ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">CPU</span>
                    <span className="ml-auto text-xl font-bold">{metrics.cpu.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.cpu} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MemoryStick className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Memory</span>
                    <span className="ml-auto text-xl font-bold">{metrics.memory.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.memory} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <HardDrive className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Disk</span>
                    <span className="ml-auto text-xl font-bold">{metrics.disk.toFixed(0)}%</span>
                  </div>
                  <Progress value={metrics.disk} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wifi className="h-4 w-4 text-teal-500" />
                    <span className="font-medium">Network</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>↓ {(metrics.networkIn / 1024 / 1024).toFixed(2)} MB/s</div>
                    <div>↑ {(metrics.networkOut / 1024 / 1024).toFixed(2)} MB/s</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
