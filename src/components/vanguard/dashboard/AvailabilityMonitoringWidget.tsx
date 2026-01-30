import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Server, Laptop, Apple, Terminal, Wifi, Activity, Shield, Cpu } from "lucide-react";

interface AvailabilityMonitoringWidgetProps {
  devices: Array<{
    device_type?: string | null;
    agent_type?: 'windows' | 'pi_appliance';
    os_info?: string | null;
    last_heartbeat?: string | null;
  }>;
}

export function AvailabilityMonitoringWidget({ devices }: AvailabilityMonitoringWidgetProps) {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  const isOnline = (device: { last_heartbeat?: string | null }) => {
    if (!device.last_heartbeat) return false;
    return new Date(device.last_heartbeat).getTime() > fiveMinutesAgo;
  };

  // Separate Recon Units (pi_appliance) from Windows/other agents
  const reconUnits = devices.filter(d => d.agent_type === 'pi_appliance');
  const standardAgents = devices.filter(d => d.agent_type !== 'pi_appliance');

  // Categorize standard agents by device type / OS
  const getDeviceCategory = (device: { device_type?: string | null; os_info?: string | null }) => {
    const type = (device.device_type || '').toLowerCase();
    const os = (device.os_info || '').toLowerCase();
    
    if (type === 'server' || os.includes('server')) return 'Server';
    if (os.includes('mac') || os.includes('darwin')) return 'Mac';
    if (os.includes('linux') && !os.includes('darwin')) return 'Linux';
    if (type === 'snmp' || type === 'network') return 'SNMP';
    // Default to PC for Windows or unknown
    return 'PC';
  };

  // Calculate stats for each category
  const deviceCategories = [
    { type: 'Server', icon: Server },
    { type: 'PC', icon: Monitor },
    { type: 'Mac', icon: Apple },
    { type: 'Linux', icon: Terminal },
    { type: 'SNMP', icon: Wifi },
  ].map(cat => {
    const categoryDevices = standardAgents.filter(d => getDeviceCategory(d) === cat.type);
    return {
      ...cat,
      online: categoryDevices.filter(isOnline).length,
      offline: categoryDevices.filter(d => !isOnline(d)).length,
      total: categoryDevices.length,
    };
  }).filter(cat => cat.total > 0); // Only show categories with devices

  // Calculate Recon Unit stats
  const reconStats = {
    online: reconUnits.filter(isOnline).length,
    offline: reconUnits.filter(d => !isOnline(d)).length,
    total: reconUnits.length,
  };

  // If no real devices, show empty state
  const hasDevices = devices.length > 0;

  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-purple-500/10">
      <CardHeader className="pb-2 border-b border-purple-500/10">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Activity className="h-4 w-4 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]" />
          Availability monitoring
          <span className="ml-auto h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-lg shadow-purple-500/50" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {!hasDevices ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No devices registered yet.
            <br />
            <span className="text-cyan-400/60">Install an agent to get started.</span>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan-500/20">
                <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Device type</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Online</th>
                <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Offline</th>
              </tr>
            </thead>
            <tbody>
              {/* Recon Units section - show first if any exist */}
              {reconStats.total > 0 && (
                <tr className="border-b border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-purple-300 font-medium">Recon Units</span>
                    </div>
                  </td>
                  <td className="text-center px-4 py-2.5">
                    {reconStats.online > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-green-400/30 shadow-lg shadow-green-500/50 animate-pulse" />
                        <span className="text-sm text-green-400 font-semibold">{reconStats.online}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">-</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-2.5">
                    {reconStats.offline > 0 ? (
                      <span className="text-sm text-red-400 font-semibold">{reconStats.offline}</span>
                    ) : (
                      <span className="text-sm text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              )}
              
              {/* Standard agent categories */}
              {deviceCategories.map((row) => (
                <tr key={row.type} className="border-b border-cyan-500/10 last:border-0 hover:bg-cyan-500/10 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <row.icon className="h-4 w-4 text-cyan-400" />
                      <span className="text-sm text-slate-200">{row.type}</span>
                    </div>
                  </td>
                  <td className="text-center px-4 py-2.5">
                    {row.online > 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-green-400/30 shadow-lg shadow-green-500/50 animate-pulse" />
                        <span className="text-sm text-green-400 font-semibold">{row.online}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">-</span>
                    )}
                  </td>
                  <td className="text-center px-4 py-2.5">
                    {row.offline > 0 ? (
                      <span className="text-sm text-red-400 font-semibold">{row.offline}</span>
                    ) : (
                      <span className="text-sm text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {/* If only Recon units exist, show a summary row */}
              {deviceCategories.length === 0 && reconStats.total === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500 text-sm">
                    No devices to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
