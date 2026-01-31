/**
 * Tabbed View for separating Recon Units from Windows Devices
 */

import { Badge } from "@/components/ui/badge";
import { Monitor, Cpu } from "lucide-react";
import { WindowsDevicesList } from "./WindowsDevicesList";
import { PiAppliancesList } from "./PiAppliancesList";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";
import { VanguardTabs, VanguardTabContent, VanguardTab } from "@/components/vanguard/shared";
import { useState } from "react";

const deviceTabs: VanguardTab[] = [
  { id: 'windows', label: 'Windows Devices', icon: Monitor },
  { id: 'pi', label: 'Recon Units', icon: Cpu },
];

export function DevicesTabbedView() {
  const { agents, isLoading } = useVanguardAgents();
  const [activeTab, setActiveTab] = useState('windows');

  const windowsAgents = agents.filter(a => a.agent_type !== 'pi_appliance');
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
        <VanguardTabContent value="windows" className="mt-4">
          <WindowsDevicesList agents={windowsAgents} isLoading={isLoading} />
        </VanguardTabContent>

        <VanguardTabContent value="pi" className="mt-4">
          <PiAppliancesList agents={piAppliances} isLoading={isLoading} />
        </VanguardTabContent>
      </VanguardTabs>
    </div>
  );
}
