import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Battery, Cpu, CircuitBoard, Wifi, Server, Zap } from "lucide-react";
import { useState } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";
import { cn } from "@/lib/utils";

interface DeviceHardwareTabProps {
  agent: VanguardAgent;
}

export function DeviceHardwareTab({ agent }: DeviceHardwareTabProps) {
  const [showMore, setShowMore] = useState(false);
  
  // Extract hardware info from agent config - handle both legacy and new format
  const hardware = agent.config?.hardware || {};
  const isLaptop = hardware.is_laptop || hardware.form_factor === 'Laptop' || false;

  // Map new agent fields to display names
  const vendor = hardware.vendor || hardware.manufacturer || "—";
  const model = hardware.model || "—";
  const serialNumber = hardware.serial_number || "—";
  const processor = hardware.processor || hardware.cpu_info || "—";
  const memory = hardware.memory || (hardware.total_memory_gb ? `${hardware.total_memory_gb} GB` : "—");
  const macAddress = hardware.mac_address || "—";
  const osName = hardware.os_name || agent.firmware_version || "—";
  const osVersion = hardware.os_version || "—";
  const deviceType = hardware.device_type || "—";
  const formFactor = hardware.form_factor || "—";
  const isVirtualMachine = hardware.is_virtual_machine ?? false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* System Hardware */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Server className="h-4 w-4" />
            System Hardware
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Vendor" value={vendor} />
          <InfoRow label="Model" value={model} />
          <InfoRow label="Serial number" value={serialNumber} />
          <InfoRow label="Device Type" value={deviceType} />
          <InfoRow label="Form Factor" value={formFactor} />
          {isVirtualMachine && (
            <InfoRow label="Virtual Machine" value="Yes" />
          )}
        </CardContent>
      </Card>

      {/* Operating System */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <CircuitBoard className="h-4 w-4" />
            Operating System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="OS Name" value={osName} />
          <InfoRow label="OS Version" value={osVersion} />
          <InfoRow label="BIOS manufacturer" value={hardware.bios_manufacturer || "—"} />
          <InfoRow label="BIOS version" value={hardware.bios_version || "—"} />
        </CardContent>
      </Card>

      {/* Processor & Memory */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Processor & Memory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Processor" value={processor} />
          <InfoRow label="Cores / Threads" value={hardware.cores ? `${hardware.cores} / ${hardware.threads || hardware.cores * 2}` : "—"} />
          <InfoRow label="Memory" value={memory} />
          <InfoRow label="Video card" value={hardware.video_card || "—"} />
          <InfoRow label="Sound" value={hardware.sound_card || "—"} />
        </CardContent>
      </Card>

      {/* Network */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Network Adapters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {/* First try network_adapters from telemetry, then mac_addresses, then single mac */}
            {agent.config?.network_adapters?.length > 0 ? (
              agent.config.network_adapters
                .filter((adapter: any) => adapter.status === 'Up' || adapter.mac_address)
                .slice(0, 5) // Limit to 5 adapters
                .map((adapter: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-cyan-500/10 last:border-0">
                    <span className="text-sm text-slate-400 flex items-center gap-2">
                      {adapter.name || `Adapter ${idx + 1}`}
                      {adapter.status === 'Up' && !(adapter.ip_address || '').startsWith('169.254.') && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                          Active
                        </Badge>
                      )}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-slate-200 font-mono block">{adapter.mac_address || "—"}</span>
                      {adapter.ip_address && !adapter.ip_address.startsWith('169.254.') && (
                        <span className="text-xs text-cyan-400">{adapter.ip_address}</span>
                      )}
                    </div>
                  </div>
                ))
            ) : hardware.mac_addresses?.length > 0 ? (
              hardware.mac_addresses.map((mac: { address: string; name?: string; primary?: boolean }, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-cyan-500/10 last:border-0">
                  <span className="text-sm text-slate-400 flex items-center gap-2">
                    {mac.name || `Adapter ${idx + 1}`}
                    {mac.primary && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                        Primary
                      </Badge>
                    )}
                  </span>
                  <span className="text-sm text-slate-200 font-mono">{mac.address}</span>
                </div>
              ))
            ) : macAddress !== "—" ? (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-400">Primary MAC</span>
                <span className="text-sm text-slate-200 font-mono">{macAddress}</span>
              </div>
            ) : (
              <InfoRow label="MAC addresses" value="Not available" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Battery Information (Laptops) */}
      {isLaptop && (
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-cyan-500/20 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Battery Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <BatteryInfoCard label="Battery ID" value={hardware.battery_id || "—"} />
              <BatteryInfoCard 
                label="Health" 
                value={hardware.battery_health || "—"} 
                highlight={hardware.battery_health === "Good"}
              />
              <BatteryInfoCard label="Design Capacity" value={hardware.battery_design_capacity || "—"} />
              <BatteryInfoCard label="Full Charge" value={hardware.battery_full_charge_capacity || "—"} />
              <BatteryInfoCard label="Cycle Count" value={hardware.battery_cycle_count?.toString() || "—"} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hailo Board (if present) */}
      {agent.hailo_board_name && (
        <Card className="bg-gradient-to-br from-cyan-900/30 to-teal-900/20 border-cyan-400/30 backdrop-blur-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-300 flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              Hailo AI Accelerator
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/30 ml-2">
                Connected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-slate-400">Board Name</p>
                <p className="text-sm font-semibold text-cyan-300 mt-1">{agent.hailo_board_name}</p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-slate-400">Status</p>
                <p className="text-sm font-semibold text-green-400 mt-1">Active</p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-slate-400">TOPS</p>
                <p className="text-sm font-semibold text-cyan-300 mt-1">26 TOPS</p>
              </div>
              <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
                <p className="text-xs text-slate-400">Firmware</p>
                <p className="text-sm font-semibold text-slate-200 mt-1">{agent.firmware_version || "v4.17.0"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-cyan-500/10 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-200">{value}</span>
    </div>
  );
}

function BatteryInfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center p-3 bg-slate-900/50 rounded-lg border border-cyan-500/20">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn(
        "text-sm font-semibold mt-1",
        highlight ? "text-green-400" : "text-slate-200"
      )}>
        {value}
      </p>
    </div>
  );
}
