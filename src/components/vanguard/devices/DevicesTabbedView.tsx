/**
 * Managed Devices List - Recon Units have moved to the Recon module
 */

import { Badge } from "@/components/ui/badge";
import { ManagedDevicesList } from "./ManagedDevicesList";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

export function DevicesTabbedView() {
  const { agents, isLoading, refetch } = useVanguardAgents();

  const managedAgents = agents.filter(a => a.agent_type !== 'pi_appliance');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Vanguard Fleet</h2>
        <Badge variant="outline" className="border-cyan-500/30 text-white/60">
          {managedAgents.length} managed device{managedAgents.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <ManagedDevicesList agents={managedAgents} isLoading={isLoading} onRefresh={refetch} />
    </div>
  );
}
