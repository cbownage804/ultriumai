
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Network, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { NetworkScan } from "@/hooks/useSafeNet";

interface ScanHistoryProps {
  scans: NetworkScan[];
}

export const ScanHistory = ({ scans }: ScanHistoryProps) => {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatNetworkRanges = (ranges: string[]) => {
    if (ranges.length <= 2) return ranges.join(', ');
    return `${ranges.slice(0, 2).join(', ')} +${ranges.length - 2} more`;
  };

  const getScanIcon = (scanType: string) => {
    switch (scanType.toLowerCase()) {
      case 'discovery':
        return <Network className="h-4 w-4 text-blue-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'heartbeat':
        return <Activity className="h-4 w-4 text-green-500" />;
      default:
        return <Network className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Scan History</h2>
          <p className="text-muted-foreground">
            View detailed history of all network discovery scans
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {scans.map((scan) => (
          <Card key={scan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getScanIcon(scan.scan_type)}
                  <div>
                    <CardTitle className="text-lg capitalize">
                      {scan.scan_type} Scan
                    </CardTitle>
                    <CardDescription>
                      {scan.hostname && `From ${scan.hostname} • `}
                      Scanned {formatNetworkRanges(scan.network_ranges)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {scan.devices_found} devices
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(scan.scan_duration)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Scan Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scan.scanned_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Devices Found</p>
                  <p className="text-sm text-muted-foreground">
                    {scan.devices_found} devices
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDuration(scan.scan_duration)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Network Ranges</p>
                  <p className="text-sm text-muted-foreground">
                    {scan.network_ranges.length} range{scan.network_ranges.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Network Ranges Scanned:</p>
                <div className="flex flex-wrap gap-2">
                  {scan.network_ranges.map((range, index) => (
                    <Badge key={index} variant="outline" className="font-mono text-xs">
                      {range}
                    </Badge>
                  ))}
                </div>
              </div>

              {scan.results && Object.keys(scan.results).length > 0 && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Scan Results</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {scan.results.vulnerabilities_found && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span>{scan.results.vulnerabilities_found} vulnerabilities</span>
                      </div>
                    )}
                    {scan.results.open_ports && (
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-blue-500" />
                        <span>{scan.results.open_ports} open ports</span>
                      </div>
                    )}
                    {scan.results.services_discovered && (
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span>{scan.results.services_discovered} services</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {scans.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scans Performed</h3>
              <p className="text-muted-foreground text-center mb-4">
                Install a SafeNet connector to start network discovery scans
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
