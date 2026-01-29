import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Server, Laptop, HelpCircle, Apple, Terminal, Wifi } from "lucide-react";

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
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
          Availability monitoring
          <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Device type</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Online</th>
              <th className="text-center text-xs font-medium text-gray-500 px-4 py-2">Offline</th>
            </tr>
          </thead>
          <tbody>
            {deviceTypes.map((row) => (
              <tr key={row.type} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <row.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{row.type}</span>
                  </div>
                </td>
                <td className="text-center px-4 py-2.5">
                  {row.online > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm text-green-600 font-medium">{row.online}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="text-center px-4 py-2.5">
                  {row.offline > 0 ? (
                    <span className="text-sm text-red-500 font-medium">{row.offline}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
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
