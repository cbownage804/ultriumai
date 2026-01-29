/**
 * Tabbed View for separating Pi Appliances from Windows Devices
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Monitor, Cpu } from "lucide-react";
import { WindowsDevicesList } from "./WindowsDevicesList";
import { PiAppliancesList } from "./PiAppliancesList";
import { useVanguardAgents } from "@/hooks/useVanguardAgents";

export function DevicesTabbedView() {
  const { agents, isLoading } = useVanguardAgents();

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

      <Tabs defaultValue="windows" className="w-full">
        <TabsList className="bg-black/40 border border-cyan-500/20 p-1 h-auto">
          <TabsTrigger 
            value="windows" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500 data-[state=active]:text-black gap-2 px-4 py-2"
          >
            <Monitor className="h-4 w-4" />
            Windows Devices
            <Badge variant="secondary" className="ml-1 bg-white/10 text-white/80">
              {windowsAgents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="pi" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-black gap-2 px-4 py-2"
          >
            <Cpu className="h-4 w-4" />
            Pi Appliances
            <Badge variant="secondary" className="ml-1 bg-white/10 text-white/80">
              {piAppliances.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="windows" className="mt-4">
          <WindowsDevicesList agents={windowsAgents} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="pi" className="mt-4">
          <PiAppliancesList agents={piAppliances} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
