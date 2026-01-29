import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Monitor, 
  Laptop, 
  Tablet, 
  Cloud, 
  HardDrive,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceTypeBreakdownProps {
  devices: Array<{
    id: string;
    name: string;
    config: Record<string, unknown>;
    status: string;
  }>;
}

interface DeviceTypeCount {
  type: string;
  formFactor: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export function DeviceTypeBreakdown({ devices }: DeviceTypeBreakdownProps) {
  // Parse device types from config
  const deviceTypes = devices.reduce((acc, device) => {
    const deviceType = (device.config?.device_type as string) || 'Workstation';
    const formFactor = (device.config?.form_factor as string) || 'Desktop';
    const isVM = (device.config?.is_virtual_machine as boolean) || false;
    
    // Count by device type (Server vs Workstation)
    const typeKey = isVM ? 'Virtual Machine' : deviceType;
    acc.byType[typeKey] = (acc.byType[typeKey] || 0) + 1;
    
    // Count by form factor (Laptop vs Desktop)
    if (!isVM && deviceType !== 'Server') {
      acc.byFormFactor[formFactor] = (acc.byFormFactor[formFactor] || 0) + 1;
    }
    
    return acc;
  }, { byType: {} as Record<string, number>, byFormFactor: {} as Record<string, number> });

  const typeIcons: Record<string, React.ReactNode> = {
    'Server': <Server className="h-5 w-5" />,
    'Domain Controller': <Server className="h-5 w-5" />,
    'Workstation': <Monitor className="h-5 w-5" />,
    'Virtual Machine': <Cloud className="h-5 w-5" />,
  };

  const formFactorIcons: Record<string, React.ReactNode> = {
    'Laptop': <Laptop className="h-5 w-5" />,
    'Desktop': <Monitor className="h-5 w-5" />,
    'Tablet': <Tablet className="h-5 w-5" />,
    'All-in-One': <Monitor className="h-5 w-5" />,
    'Rack Server': <HardDrive className="h-5 w-5" />,
  };

  const typeColors: Record<string, string> = {
    'Server': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    'Domain Controller': 'text-red-500 bg-red-500/10 border-red-500/20',
    'Workstation': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    'Virtual Machine': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  };

  const formFactorColors: Record<string, string> = {
    'Laptop': 'text-green-500 bg-green-500/10 border-green-500/20',
    'Desktop': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    'Tablet': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    'All-in-One': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    'Rack Server': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  };

  const totalDevices = devices.length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Device Types */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-500" />
            Device Types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(deviceTypes.byType).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No device type data available
            </p>
          ) : (
            Object.entries(deviceTypes.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    typeColors[type] || 'bg-muted/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {typeIcons[type] || <Monitor className="h-5 w-5" />}
                    <span className="font-medium">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((count / totalDevices) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Form Factors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Laptop className="h-4 w-4 text-green-500" />
            Form Factors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(deviceTypes.byFormFactor).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No form factor data available
            </p>
          ) : (
            Object.entries(deviceTypes.byFormFactor)
              .sort((a, b) => b[1] - a[1])
              .map(([factor, count]) => (
                <div
                  key={factor}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    formFactorColors[factor] || 'bg-muted/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {formFactorIcons[factor] || <Monitor className="h-5 w-5" />}
                    <span className="font-medium">{factor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{count}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((count / Math.max(Object.values(deviceTypes.byFormFactor).reduce((a, b) => a + b, 0), 1)) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
