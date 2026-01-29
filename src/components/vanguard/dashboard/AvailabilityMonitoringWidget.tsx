import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Server, Laptop, HelpCircle } from "lucide-react";

interface DeviceTypeRow {
  type: string;
  icon: React.ReactNode;
  online: number;
  offline: number;
}

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

  const deviceTypes: DeviceTypeRow[] = [
    {
      type: 'Server',
      icon: <Server className="h-4 w-4 text-muted-foreground" />,
      online: getDevicesByType('server').filter(isOnline).length,
      offline: getDevicesByType('server').filter(d => !isOnline(d)).length,
    },
    {
      type: 'Workstation',
      icon: <Monitor className="h-4 w-4 text-muted-foreground" />,
      online: getDevicesByType('workstation').filter(isOnline).length,
      offline: getDevicesByType('workstation').filter(d => !isOnline(d)).length,
    },
    {
      type: 'Laptop',
      icon: <Laptop className="h-4 w-4 text-muted-foreground" />,
      online: getDevicesByType('laptop').filter(isOnline).length,
      offline: getDevicesByType('laptop').filter(d => !isOnline(d)).length,
    },
  ];

  // Add "Other" for devices without a recognized type
  const knownTypes = ['server', 'workstation', 'laptop'];
  const otherDevices = devices.filter(d => !knownTypes.includes((d.device_type || '').toLowerCase()));
  if (otherDevices.length > 0) {
    deviceTypes.push({
      type: 'Other',
      icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
      online: otherDevices.filter(isOnline).length,
      offline: otherDevices.filter(d => !isOnline(d)).length,
    });
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          Availability monitoring
          <HelpCircle className="h-3 w-3" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">Device type</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2">Online</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2">Offline</th>
            </tr>
          </thead>
          <tbody>
            {deviceTypes.map((row) => (
              <tr key={row.type} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {row.icon}
                    <span className="text-sm">{row.type}</span>
                  </div>
                </td>
                <td className="text-center px-4 py-3">
                  {row.online > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="text-sm text-green-400">{row.online}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="text-center px-4 py-3">
                  {row.offline > 0 ? (
                    <span className="text-sm text-red-400">{row.offline}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
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
