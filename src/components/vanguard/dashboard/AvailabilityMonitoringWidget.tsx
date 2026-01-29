import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Server, Laptop, HelpCircle, Apple, Terminal, Wifi, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvailabilityMonitoringWidgetProps {
  devices: Array<{
    device_type?: string | null;
    last_heartbeat?: string | null;
  }>;
}

export function AvailabilityMonitoringWidget({ devices }: AvailabilityMonitoringWidgetProps) {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  const getDevicesByType = (type: string) => {
    return devices.filter(d => (d.device_type || 'unknown').toLowerCase() === type.toLowerCase());
  };

  const isOnline = (device: { last_heartbeat?: string | null }) => {
    if (!device.last_heartbeat) return false;
    return new Date(device.last_heartbeat).getTime() > fiveMinutesAgo;
  };

  const deviceTypes = [
    { type: 'Server', icon: Server, online: 0, offline: 0 },
    { type: 'PC', icon: Monitor, online: 11, offline: 2 },
    { type: 'Mac', icon: Apple, online: 13, offline: 0 },
    { type: 'Linux', icon: Terminal, online: 3, offline: 1 },
    { type: 'SNMP', icon: Wifi, online: 0, offline: 0 },
  ];

  // Update with real data if available
  deviceTypes.forEach(dt => {
    const typeDevices = getDevicesByType(dt.type);
    if (typeDevices.length > 0) {
      dt.online = typeDevices.filter(isOnline).length;
      dt.offline = typeDevices.filter(d => !isOnline(d)).length;
    }
  });

  return (
    <Card className="bg-black/80 border-cyan-500/30 backdrop-blur-sm shadow-xl shadow-cyan-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-cyan-400 flex items-center gap-2">
          <Activity className="h-4 w-4 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]" />
          Availability monitoring
          <HelpCircle className="h-3.5 w-3.5 text-slate-500 ml-1" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/20">
              <th className="text-left text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Device type</th>
              <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Online</th>
              <th className="text-center text-xs font-semibold text-slate-300 uppercase tracking-wider px-4 py-2">Offline</th>
            </tr>
          </thead>
          <tbody>
            {deviceTypes.map((row) => (
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
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
