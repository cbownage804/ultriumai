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
  Play,
  Square,
  RotateCcw,
  Search,
  MoreVertical,
  Settings,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Service {
  name: string;
  displayName: string;
  status: 'running' | 'stopped' | 'paused' | 'starting' | 'stopping';
  startType: 'automatic' | 'manual' | 'disabled';
  pid?: number;
  description?: string;
}

interface ServiceManagerProps {
  agentId: string;
  sendCommand: (cmd: string, payload?: any) => Promise<any>;
}

export function ServiceManager({ agentId, sendCommand }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, [agentId]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const result = await sendCommand('get_services');
      if (result?.services) {
        setServices(result.services);
      } else {
        // Demo data if no real data
        setServices([
          { name: 'wuauserv', displayName: 'Windows Update', status: 'running', startType: 'automatic', pid: 1234, description: 'Enables the detection, download, and installation of updates for Windows' },
          { name: 'Spooler', displayName: 'Print Spooler', status: 'running', startType: 'automatic', pid: 2345, description: 'Loads files to memory for later printing' },
          { name: 'BITS', displayName: 'Background Intelligent Transfer', status: 'stopped', startType: 'manual', description: 'Transfers files in the background using idle network bandwidth' },
          { name: 'WinDefend', displayName: 'Windows Defender', status: 'running', startType: 'automatic', pid: 3456, description: 'Helps protect users from malware' },
          { name: 'EventLog', displayName: 'Windows Event Log', status: 'running', startType: 'automatic', pid: 4567, description: 'Manages events and event logs' },
          { name: 'Dnscache', displayName: 'DNS Client', status: 'running', startType: 'automatic', pid: 5678, description: 'Caches Domain Name System (DNS) names' },
          { name: 'LanmanServer', displayName: 'Server', status: 'running', startType: 'automatic', pid: 6789, description: 'Supports file, print, and named-pipe sharing' },
          { name: 'RemoteRegistry', displayName: 'Remote Registry', status: 'stopped', startType: 'disabled', description: 'Enables remote users to modify registry settings' },
        ]);
      }
    } catch (err) {
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceAction = async (serviceName: string, action: 'start' | 'stop' | 'restart') => {
    setActionInProgress(`${serviceName}-${action}`);
    try {
      await sendCommand('service_action', { service: serviceName, action });
      toast.success(`${action} command sent for ${serviceName}`);
      // Refresh after a delay
      setTimeout(() => loadServices(), 2000);
    } catch (err) {
      toast.error(`Failed to ${action} ${serviceName}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredServices = services.filter(s => 
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500">Running</Badge>;
      case 'stopped':
        return <Badge variant="secondary">Stopped</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Paused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Service Manager
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadServices} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
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
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Startup</TableHead>
                  <TableHead>PID</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.name}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{service.displayName}</div>
                        <div className="text-xs text-muted-foreground">{service.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell className="capitalize text-sm">{service.startType}</TableCell>
                    <TableCell className="font-mono text-sm">{service.pid || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {actionInProgress?.startsWith(service.name) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {service.status !== 'running' && (
                            <DropdownMenuItem onClick={() => handleServiceAction(service.name, 'start')}>
                              <Play className="h-4 w-4 mr-2" />
                              Start
                            </DropdownMenuItem>
                          )}
                          {service.status === 'running' && (
                            <>
                              <DropdownMenuItem onClick={() => handleServiceAction(service.name, 'stop')}>
                                <Square className="h-4 w-4 mr-2" />
                                Stop
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleServiceAction(service.name, 'restart')}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restart
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
