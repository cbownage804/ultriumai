/**
 * Tabbed View for separating Recon Units from Managed Devices
 */

import { Badge } from "@/components/ui/badge";
import { Monitor, Cpu } from "lucide-react";
import { ManagedDevicesList } from "./ManagedDevicesList";
import { PiAppliancesList } from "./PiAppliancesList";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { VanguardTabs, VanguardTabContent, VanguardTab } from "@/components/vanguard/shared";
import { useState } from "react";

const deviceTabs: VanguardTab[] = [
  { id: 'managed', label: 'Managed Devices', icon: Monitor },
  { id: 'pi', label: 'Recon Units', icon: Cpu },
];

export function DevicesTabbedView() {
  const { agents, isLoading } = useVanguardAgents();
  const [activeTab, setActiveTab] = useState('managed');

  const managedAgents = agents.filter(a => a.agent_type !== 'pi_appliance');
  const piAppliances = agents.filter(a => a.agent_type === 'pi_appliance');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Vanguard Fleet</h2>
        <Badge variant="outline" className="border-cyan-500/30 text-white/60">
          {agents.length} total device{agents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <VanguardTabs
        tabs={deviceTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="cyan"
      >
        <VanguardTabContent value="managed" className="mt-4">
          <ManagedDevicesList agents={managedAgents} isLoading={isLoading} />
        </VanguardTabContent>

        <VanguardTabContent value="pi" className="mt-4">
          <PiAppliancesList agents={piAppliances} isLoading={isLoading} />
        </VanguardTabContent>
      </VanguardTabs>
    </div>
  );
}
