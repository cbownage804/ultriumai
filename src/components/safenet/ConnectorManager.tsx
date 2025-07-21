
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSafeNet } from "@/hooks/useSafeNet";
import { 
  Activity, 
  Download, 
  RefreshCw, 
  Settings,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

export const ConnectorManager = () => {
  const { connectors, refreshData, isLoading } = useSafeNet();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getLastSeenText = (lastHeartbeat?: string) => {
    if (!lastHeartbeat) return 'Never';
    
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SafeNet Connectors</h2>
          <p className="text-muted-foreground">
            Manage your SafeNet network discovery connectors
          </p>
        </div>
        <Button onClick={refreshData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {connectors.map((connector) => (
          <Card key={connector.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(connector.status)}
                  <div>
                    <CardTitle className="text-lg">{connector.connector_name}</CardTitle>
                    <CardDescription>
                      {connector.client_name || 'No client name specified'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={connector.status === 'active' ? 'default' : 'secondary'}>
                    {connector.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Connector Key</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {connector.connector_key.slice(0, 16)}...
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-sm text-muted-foreground">
                    {connector.version || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Heartbeat</p>
                  <p className="text-sm text-muted-foreground">
                    {getLastSeenText(connector.last_heartbeat)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connector.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm text-muted-foreground capitalize">
                      {connector.status}
                    </span>
                  </div>
                </div>
              </div>

              {connector.system_info && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">System Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {connector.system_info.hostname && (
                      <div>
                        <span className="font-medium">Hostname:</span> {connector.system_info.hostname}
                      </div>
                    )}
                    {connector.system_info.os && (
                      <div>
                        <span className="font-medium">OS:</span> {connector.system_info.os}
                      </div>
                    )}
                    {connector.system_info.version && (
                      <div>
                        <span className="font-medium">Agent Version:</span> {connector.system_info.version}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {connector.network_info && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Network Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {connector.network_info.local_ip && (
                      <div>
                        <span className="font-medium">Local IP:</span> {connector.network_info.local_ip}
                      </div>
                    )}
                    {connector.network_info.gateway && (
                      <div>
                        <span className="font-medium">Gateway:</span> {connector.network_info.gateway}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {connectors.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Connectors Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Download and install a SafeNet connector to start network discovery
              </p>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Download Connector
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
