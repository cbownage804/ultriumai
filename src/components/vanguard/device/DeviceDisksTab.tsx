import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, HardDrive, Lock, Key, Copy } from "lucide-react";
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

  if (disks.length === 0) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-900">Disk Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No disk information available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {disks.map((disk) => (
        <Card key={disk.drive} className="bg-white border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-gray-400" />
                <div>
                  <CardTitle className="text-sm font-medium text-gray-900">
                    {disk.drive} Drive
                  </CardTitle>
                  <p className="text-xs text-gray-500">{disk.media_type} • {disk.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {disk.bitlocker_status === 'protected' && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <Lock className="h-3 w-3" />
                    BitLocker On
                  </Badge>
                )}
                {disk.bitlocker_status === 'unprotected' && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 gap-1">
                    <Lock className="h-3 w-3" />
                    BitLocker Off
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDisk(disk.drive)}
                  className="gap-1"
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
                <span className="text-gray-500">Storage</span>
                <span className="text-gray-900">
                  {disk.used_size} used of {disk.total_size} ({disk.free_size} free)
                </span>
              </div>
              <Progress 
                value={disk.usage_percent} 
                className={cn(
                  "h-2",
                  disk.usage_percent > 90 ? "[&>div]:bg-red-500" : 
                  disk.usage_percent > 70 ? "[&>div]:bg-yellow-500" : 
                  "[&>div]:bg-green-500"
                )}
              />
            </div>

            {/* Serial Number */}
            {disk.serial_number && (
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Serial number</span>
                <span className="text-sm text-gray-900 font-mono">{disk.serial_number}</span>
              </div>
            )}

            {/* BitLocker Recovery Key */}
            {disk.bitlocker_status === 'protected' && disk.bitlocker_recovery_key && (
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Recovery key
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900 font-mono">
                    {disk.bitlocker_recovery_key.slice(0, 8)}...
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyRecoveryKey(disk.bitlocker_recovery_key!)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expandedDisks.has(disk.drive) && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <InfoRow label="Partitions" value={disk.partitions?.toString() || "—"} />
                <InfoRow label="Interface type" value={disk.interface_type || "—"} />
                <InfoRow label="Bus type" value={disk.bus_type || "—"} />
                <InfoRow label="Status" value={disk.status || "—"} />
                <InfoRow label="Health status" value={disk.health_status || "—"} />
                <InfoRow label="Firmware version" value={disk.firmware_version || "—"} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
