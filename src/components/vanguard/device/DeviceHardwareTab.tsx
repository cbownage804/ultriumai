import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Battery, Cpu, CircuitBoard, Wifi } from "lucide-react";
import { useState } from "react";
import { VanguardAgent } from "@/hooks/useVanguardAgents";

interface DeviceHardwareTabProps {
  agent: VanguardAgent;
}

export function DeviceHardwareTab({ agent }: DeviceHardwareTabProps) {
  const [showMore, setShowMore] = useState(false);
  
  // Extract hardware info from agent config
  const hardware = agent.config?.hardware || {};
  const isLaptop = hardware.is_laptop || false;

  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-900">Hardware Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Vendor" value={hardware.vendor || "—"} />
          <InfoRow label="Model" value={hardware.model || "—"} />
          <InfoRow label="Serial number" value={hardware.serial_number || "—"} />
          <InfoRow label="Motherboard" value={hardware.motherboard || "—"} />
          
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
              <CircuitBoard className="h-3 w-3" />
              BIOS Information
            </h4>
            <InfoRow label="BIOS manufacturer" value={hardware.bios_manufacturer || "—"} />
            <InfoRow label="BIOS version" value={hardware.bios_version || "—"} />
            <InfoRow label="BIOS version date" value={hardware.bios_date || "—"} />
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Cpu className="h-3 w-3" />
              Processor & Memory
            </h4>
            <InfoRow label="Processor" value={hardware.processor || "—"} />
            <InfoRow label="Memory" value={hardware.memory || "—"} />
            <InfoRow label="Video card" value={hardware.video_card || "—"} />
            <InfoRow label="Sound" value={hardware.sound_card || "—"} />
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
              <Wifi className="h-3 w-3" />
              Network
            </h4>
            <div className="space-y-1">
              {hardware.mac_addresses?.length > 0 ? (
                hardware.mac_addresses.map((mac: { address: string; primary?: boolean }, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-500">
                      MAC address {mac.primary && <Badge variant="outline" className="ml-1 text-xs">Primary</Badge>}
                    </span>
                    <span className="text-sm text-gray-900 font-mono">{mac.address}</span>
                  </div>
                ))
              ) : (
                <InfoRow label="MAC addresses" value="—" />
              )}
            </div>
          </div>
          
          {isLaptop && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Battery className="h-3 w-3" />
                Battery Information
              </h4>
              <InfoRow label="Battery ID" value={hardware.battery_id || "—"} />
              <InfoRow label="Battery health" value={hardware.battery_health || "—"} />
              <InfoRow label="Design capacity" value={hardware.battery_design_capacity || "—"} />
              <InfoRow label="Full charge capacity" value={hardware.battery_full_charge_capacity || "—"} />
              <InfoRow label="Cycle count" value={hardware.battery_cycle_count?.toString() || "—"} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
