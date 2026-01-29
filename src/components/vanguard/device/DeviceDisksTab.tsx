import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, HardDrive, Lock, Key, Copy, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Disk {
  drive: string;
  media_type: string;
  model: string;
  serial_number?: string;
  total_size: string;
  used_size: string;
  free_size: string;
  usage_percent: number;
  bitlocker_status?: 'protected' | 'unprotected' | 'unknown';
  bitlocker_recovery_key?: string;
  partitions?: number;
  interface_type?: string;
  bus_type?: string;
  status?: string;
  health_status?: string;
  firmware_version?: string;
}

interface DeviceDisksTabProps {
  agent: VanguardAgent;
}

export function DeviceDisksTab({ agent }: DeviceDisksTabProps) {
  const [expandedDisks, setExpandedDisks] = useState<Set<string>>(new Set());
  
  // Extract disk info from agent config
  const disks: Disk[] = agent.config?.disks || [];

  const toggleDisk = (drive: string) => {
    const newExpanded = new Set(expandedDisks);
    if (newExpanded.has(drive)) {
      newExpanded.delete(drive);
    } else {
      newExpanded.add(drive);
    }
    setExpandedDisks(newExpanded);
  };

  const copyRecoveryKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Recovery key copied to clipboard");
  };

  const getHealthIcon = (health?: string) => {
    if (!health) return null;
    const normalized = health.toLowerCase();
    if (normalized === 'healthy' || normalized === 'good') {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
    if (normalized === 'warning' || normalized === 'degraded') {
      return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  if (disks.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Disk Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <HardDrive className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No disk information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {disks.map((disk) => (
        <Card key={disk.drive} className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  disk.usage_percent > 90 ? "bg-red-500/20" : 
                  disk.usage_percent > 70 ? "bg-yellow-500/20" : 
                  "bg-cyan-500/20"
                )}>
                  <HardDrive className={cn(
                    "h-5 w-5",
                    disk.usage_percent > 90 ? "text-red-400" : 
                    disk.usage_percent > 70 ? "text-yellow-400" : 
                    "text-cyan-400"
                  )} />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    {disk.drive} Drive
                    {getHealthIcon(disk.health_status)}
                  </CardTitle>
                  <p className="text-xs text-slate-400">{disk.media_type} • {disk.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {disk.bitlocker_status === 'protected' && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 gap-1">
                    <Lock className="h-3 w-3" />
                    BitLocker On
                  </Badge>
                )}
                {disk.bitlocker_status === 'unprotected' && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1">
                    <Lock className="h-3 w-3" />
                    BitLocker Off
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDisk(disk.drive)}
                  className="gap-1 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                >
                  {expandedDisks.has(disk.drive) ? (
                    <>Hide details <ChevronUp className="h-4 w-4" /></>
                  ) : (
                    <>Show more <ChevronDown className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Storage</span>
                <span className="text-slate-200">
                  {disk.used_size} used of {disk.total_size} 
                  <span className="text-slate-400 ml-1">({disk.free_size} free)</span>
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={disk.usage_percent} 
                  className={cn(
                    "h-3 bg-slate-700/50",
                    disk.usage_percent > 90 ? "[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-red-400" : 
                    disk.usage_percent > 70 ? "[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-yellow-400" : 
                    "[&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-teal-400"
                  )}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                  {disk.usage_percent}%
                </span>
              </div>
            </div>

            {/* Serial Number */}
            {disk.serial_number && (
              <div className="flex items-center justify-between py-2 border-t border-cyan-500/10">
                <span className="text-sm text-slate-400">Serial number</span>
                <span className="text-sm text-slate-200 font-mono">{disk.serial_number}</span>
              </div>
            )}

            {/* BitLocker Recovery Key */}
            {disk.bitlocker_status === 'protected' && disk.bitlocker_recovery_key && (
              <div className="flex items-center justify-between py-2 border-t border-cyan-500/10">
                <span className="text-sm text-slate-400 flex items-center gap-2">
                  <Key className="h-4 w-4 text-cyan-400" />
                  Recovery key
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-200 font-mono">
                    {disk.bitlocker_recovery_key.slice(0, 8)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-cyan-500/20 hover:text-cyan-400"
                    onClick={() => copyRecoveryKey(disk.bitlocker_recovery_key!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expandedDisks.has(disk.drive) && (
              <div className="pt-3 border-t border-cyan-500/10 grid grid-cols-2 md:grid-cols-3 gap-4">
                <DetailCard label="Partitions" value={disk.partitions?.toString() || "—"} />
                <DetailCard label="Interface" value={disk.interface_type || "—"} />
                <DetailCard label="Bus Type" value={disk.bus_type || "—"} />
                <DetailCard label="Status" value={disk.status || "—"} />
                <DetailCard label="Health" value={disk.health_status || "—"} />
                <DetailCard label="Firmware" value={disk.firmware_version || "—"} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-900/50 rounded-lg border border-cyan-500/10">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-200 mt-1">{value}</p>
    </div>
  );
}
