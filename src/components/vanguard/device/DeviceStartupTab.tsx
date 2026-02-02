import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Search, AlertTriangle, Folder, Clock, Power } from "lucide-react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";

interface StartupProgram {
  name: string;
  command: string;
  location: string;
  enabled: boolean;
  publisher?: string;
  startup_type?: 'Registry' | 'Folder' | 'Service' | 'Task';
  impact?: 'High' | 'Medium' | 'Low' | 'Not measured';
}

interface DeviceStartupTabProps {
  agent: VanguardAgent;
  onToggleStartup?: (name: string, enabled: boolean) => Promise<void>;
}

export function DeviceStartupTab({ agent, onToggleStartup }: DeviceStartupTabProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Get startup programs from agent config
  const startupPrograms: StartupProgram[] = useMemo(() => {
    return (agent.config as any)?.startup_programs || [];
  }, [agent.config]);

  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return startupPrograms;
    const query = searchQuery.toLowerCase();
    return startupPrograms.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.command?.toLowerCase().includes(query) ||
        p.publisher?.toLowerCase().includes(query)
    );
  }, [startupPrograms, searchQuery]);

  const enabledCount = startupPrograms.filter(p => p.enabled).length;
  const highImpactCount = startupPrograms.filter(p => p.impact === 'High' && p.enabled).length;

  const getImpactBadge = (impact?: string) => {
    switch (impact) {
      case 'High':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case 'Low':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Not measured</Badge>;
    }
  };

  const getLocationIcon = (type?: string) => {
    switch (type) {
      case 'Registry':
        return <Clock className="h-3 w-3 text-blue-400" />;
      case 'Folder':
        return <Folder className="h-3 w-3 text-amber-400" />;
      case 'Service':
        return <Power className="h-3 w-3 text-green-400" />;
      default:
        return <Play className="h-3 w-3 text-slate-400" />;
    }
  };

  const handleToggle = async (program: StartupProgram) => {
    if (!onToggleStartup) {
      toast.info("Toggle functionality will send command to agent");
      return;
    }
    try {
      await onToggleStartup(program.name, !program.enabled);
      toast.success(`${program.name} ${program.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      toast.error("Failed to toggle startup program");
    }
  };

  const lastCheck = (agent.config as any)?.last_startup_check;

  if (startupPrograms.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Startup Programs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Play className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400 mb-2">No startup data available</p>
            <p className="text-xs text-slate-500">
              Startup programs will be collected during next agent telemetry sync
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Play className="h-4 w-4" />
            Startup Programs
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
              {enabledCount} enabled
            </Badge>
            {highImpactCount > 0 && (
              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                {highImpactCount} high impact
              </Badge>
            )}
          </CardTitle>
          {lastCheck && (
            <span className="text-xs text-slate-500">
              Last sync: {new Date(lastCheck).toLocaleString()}
            </span>
          )}
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search by name, command, or publisher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/50 border-cyan-500/20 text-white placeholder:text-slate-500"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-500/20 hover:bg-transparent">
                <TableHead className="text-cyan-400 w-12">Status</TableHead>
                <TableHead className="text-cyan-400">Program</TableHead>
                <TableHead className="text-cyan-400">Publisher</TableHead>
                <TableHead className="text-cyan-400">Type</TableHead>
                <TableHead className="text-cyan-400">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrograms.map((program, i) => (
                <TableRow key={`${program.name}-${i}`} className="border-cyan-500/10 hover:bg-cyan-500/5">
                  <TableCell>
                    <Switch
                      checked={program.enabled}
                      onCheckedChange={() => handleToggle(program)}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-200">{program.name}</div>
                    <div className="text-xs text-slate-500 font-mono truncate max-w-[300px]" title={program.command}>
                      {program.command}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {program.publisher || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {getLocationIcon(program.startup_type)}
                      <span className="text-sm text-slate-400">{program.startup_type || 'Unknown'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getImpactBadge(program.impact)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPrograms.length === 0 && searchQuery && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No programs matching "{searchQuery}"</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
