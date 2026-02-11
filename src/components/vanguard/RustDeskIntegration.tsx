import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { launchProtocolUrl } from '@/utils/launchProtocolUrl';
import { useAuth } from '@/hooks/useAuth';
import {
  Monitor,
  Play,
  Settings,
  Download,
  RefreshCw,
  ExternalLink,
  Copy,
  Wifi,
  WifiOff,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SUPABASE_URL = "https://nsyobmjpdpvesjwdphlh.supabase.co";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ModuleIntroBanner } from '@/components/vanguard/shared/ModuleInstructions';

interface Device {
  id: string;
  hostname: string;
  ip_address: string;
  rustdesk_id: string | null;
  status: string;
  last_seen: string;
  os_info: string;
}

export const RustDeskIntegration: React.FC = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [relayServer, setRelayServer] = useState('');
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDevices();
    }
  }, [user]);

  const loadDevices = async () => {
    try {
      // Load devices from vanguard_agents table
      const { data, error } = await (supabase
        .from('vanguard_agents') as any)
        .select('id, hostname, ip_address, rustdesk_id, status, last_seen_at, os_info')
        .eq('user_id', user?.id)
        .order('last_seen_at', { ascending: false });

      if (error) throw error;

      setDevices(data?.map((d: any) => ({
        ...d,
        last_seen: d.last_seen_at,
      })) || []);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRemoteSession = async (device: Device) => {
    if (!device.rustdesk_id) {
      toast.error('RustDesk not configured on this device');
      return;
    }

    setConnectingDevice(device.id);

    try {
      // Open RustDesk client with the device ID
      // This uses the rustdesk:// protocol handler
      const rustdeskId = String(device.rustdesk_id || '').replace(/\D/g, '');
      const rustdeskUrl = `rustdesk://${rustdeskId}`;

      launchProtocolUrl(rustdeskUrl);
      
      // Log the session attempt
      await (supabase
        .from('remote_sessions') as any)
        .insert({
          user_id: user?.id,
          device_id: device.id,
          session_type: 'rustdesk',
          status: 'initiated',
          started_at: new Date().toISOString(),
        });

      toast.success(`Connecting to ${device.hostname}...`, {
        description: 'RustDesk should open automatically. If not, install RustDesk and try again.',
      });
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start remote session');
    } finally {
      setConnectingDevice(null);
    }
  };

  const copyRustDeskId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('RustDesk ID copied to clipboard');
  };

  const installRustDeskOnDevice = async (deviceId: string) => {
    try {
      // Queue command to install RustDesk via existing table
      const { error } = await (supabase
        .from('device_commands') as any)
        .insert({
          device_id: deviceId,
          command_type: 'install_rustdesk',
          payload: { relay_server: relayServer || null },
          status: 'queued',
        });

      if (error) throw error;

      toast.success('RustDesk installation queued', {
        description: 'The agent will install RustDesk on next check-in',
      });
    } catch (error) {
      console.error('Error queuing install:', error);
      toast.error('Failed to queue installation');
    }
  };

  const downloadAgent = async () => {
    try {
      // Use edge function to generate agent
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/rmm-agent-ps?key=${encodeURIComponent('vanguard-key')}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!response.ok) throw new Error('Failed to generate agent');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'VanguardAgent.ps1';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Agent downloaded!', {
        description: 'Run with: powershell -ExecutionPolicy Bypass -File VanguardAgent.ps1 -Install',
      });
    } catch (error) {
      console.error('Error downloading agent:', error);
      toast.error('Failed to download agent');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const isOnline = (lastSeen: string) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeen) > fiveMinutesAgo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Remote Desktop</h2>
          <p className="text-muted-foreground">RustDesk integration for secure remote access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDevices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={downloadAgent}>
            <Download className="h-4 w-4 mr-2" />
            Download Agent
          </Button>
        </div>
      </div>

      {/* RustDesk Local Install Notice */}
      <ModuleIntroBanner
        title="RustDesk Required on Your Computer"
        description="To remote into devices, you need RustDesk installed on this computer so your browser can launch it."
        features={["Download from rustdesk.com"]}
        docsUrl="https://rustdesk.com/download"
        storageKey="rustdesk-local-install-notice"
        accentColor="orange"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">{devices.length}</p>
              </div>
              <Monitor className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-500">
                  {devices.filter(d => isOnline(d.last_seen)).length}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">RustDesk Ready</p>
                <p className="text-2xl font-bold text-blue-500">
                  {devices.filter(d => d.rustdesk_id).length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offline</p>
                <p className="text-2xl font-bold text-red-500">
                  {devices.filter(d => !isOnline(d.last_seen)).length}
                </p>
              </div>
              <WifiOff className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relay Server Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            RustDesk Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="relay">Custom Relay Server (Optional)</Label>
              <Input
                id="relay"
                placeholder="rs.yourdomain.com or leave empty for public relay"
                value={relayServer}
                onChange={(e) => setRelayServer(e.target.value)}
              />
            </div>
            <Button variant="outline">
              Save Configuration
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Using a self-hosted relay server provides better security and performance.
            <a
              href="https://rustdesk.com/docs/en/self-host/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary ml-1 hover:underline"
            >
              Learn more <ExternalLink className="h-3 w-3 inline" />
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>RustDesk ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No devices connected. Download and install the agent to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{device.hostname}</p>
                            <p className="text-xs text-muted-foreground">{device.os_info}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{device.ip_address}</TableCell>
                      <TableCell>
                        {device.rustdesk_id ? (
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {device.rustdesk_id}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyRustDeskId(device.rustdesk_id!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline">Not installed</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusColor(isOnline(device.last_seen) ? 'online' : 'offline')} text-white`}
                        >
                          {isOnline(device.last_seen) ? 'Online' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(device.last_seen).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {device.rustdesk_id ? (
                            <Button
                              size="sm"
                              onClick={() => startRemoteSession(device)}
                              disabled={connectingDevice === device.id || !isOnline(device.last_seen)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Install RustDesk
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Install RustDesk on {device.hostname}</DialogTitle>
                                  <DialogDescription>
                                    This will remotely install RustDesk on the device.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                  <div>
                                    <Label>Relay Server (Optional)</Label>
                                    <Input
                                      placeholder="Leave empty for public relay"
                                      value={relayServer}
                                      onChange={(e) => setRelayServer(e.target.value)}
                                    />
                                  </div>
                                  <Button
                                    className="w-full"
                                    onClick={() => installRustDeskOnDevice(device.id)}
                                  >
                                    Install RustDesk
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <h4 className="font-medium">Download Agent</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Download the PowerShell agent and run it on your target machines.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <h4 className="font-medium">Install Agent</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Run: <code className="bg-muted px-1">powershell -ExecutionPolicy Bypass -File VanguardAgent.ps1 -Install</code>
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <h4 className="font-medium">Connect</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Once registered, click "Connect" to start a remote session via RustDesk.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RustDeskIntegration;
