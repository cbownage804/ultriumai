import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Monitor, 
  Terminal, 
  Server, 
  Play, 
  Square, 
  Clock,
  ExternalLink,
  Shield,
  Wifi
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Device {
  id: string;
  hostname: string;
  ip_address?: string;
  device_type?: string;
  status: string;
  os_info?: string;
}

interface RemoteSession {
  id: string;
  hostname: string;
  session_type: string;
  session_status: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
}

export const RemoteAccess = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [sessionType, setSessionType] = useState<'rdp' | 'vnc' | 'ssh' | 'web_terminal'>('rdp');
  const [loading, setLoading] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadDevices();
    loadSessions();
  }, []);

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('rmm_endpoints')
        .select('*')
        .eq('status', 'online')
        .order('hostname');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const loadSessions = async () => {
    try {
      // Mock data for demo - replace with actual remote session tracking
      const mockSessions: RemoteSession[] = [
        {
          id: '1',
          hostname: 'DEMO-PC-01',
          session_type: 'rdp',
          session_status: 'active',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          duration_seconds: 3600
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const startRemoteSession = async () => {
    if (!selectedDevice || !user) return;

    setLoading(true);
    try {
      const device = devices.find(d => d.id === selectedDevice);
      if (!device) throw new Error('Device not found');

      // Create session record (mock for demo)
      const session = {
        id: crypto.randomUUID(),
        hostname: device.hostname,
        session_type: sessionType,
        session_status: 'active',
        started_at: new Date().toISOString()
      };
      
      // In real implementation, this would create a database record
      console.log('Creating remote session:', session);

      // Mock successful session creation

      // Simulate remote connection (in real implementation, this would connect to actual remote service)
      await simulateRemoteConnection(device, sessionType);

      toast({
        title: "Remote Session Started",
        description: `Connected to ${device.hostname} via ${sessionType.toUpperCase()}`
      });

      setShowNewSession(false);
      setSelectedDevice('');
      loadSessions();
    } catch (error) {
      console.error('Failed to start remote session:', error);
      toast({
        title: "Connection Failed",
        description: "Could not establish remote connection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateRemoteConnection = async (device: Device, type: string) => {
    // In a real implementation, this would:
    // 1. Establish actual remote connection based on type
    // 2. Handle authentication
    // 3. Open remote desktop/terminal window
    // 4. Monitor connection status
    
    console.log(`Simulating ${type} connection to ${device.hostname} (${device.ip_address})`);
    
    // For demo purposes, just wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const endSession = async (sessionId: string) => {
    try {
      // Mock ending session
      console.log('Ending session:', sessionId);
      
      toast({
        title: "Session Ended",
        description: "Remote session has been disconnected"
      });

      loadSessions();
    } catch (error) {
      console.error('Failed to end session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive"
      });
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'rdp': return <Monitor className="h-4 w-4" />;
      case 'vnc': return <Monitor className="h-4 w-4" />;
      case 'ssh': return <Terminal className="h-4 w-4" />;
      case 'web_terminal': return <Terminal className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const activeSessions = sessions.filter(s => s.session_status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">{activeSessions}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Devices</p>
                <p className="text-2xl font-bold text-blue-600">{devices.length}</p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-purple-600">{sessions.length}</p>
              </div>
              <ExternalLink className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remote Access Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Remote Access Center
              </CardTitle>
              <CardDescription>
                Connect to devices remotely for support and management
              </CardDescription>
            </div>
            <Dialog open={showNewSession} onOpenChange={setShowNewSession}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/90">
                  <Play className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start Remote Session</DialogTitle>
                  <DialogDescription>
                    Connect to a device for remote support
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Device</Label>
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a device" />
                      </SelectTrigger>
                      <SelectContent>
                        {devices.map((device) => (
                          <SelectItem key={device.id} value={device.id}>
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4" />
                              {device.hostname} ({device.ip_address})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Connection Type</Label>
                    <Select value={sessionType} onValueChange={(value: any) => setSessionType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rdp">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Remote Desktop (RDP)
                          </div>
                        </SelectItem>
                        <SelectItem value="vnc">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            VNC
                          </div>
                        </SelectItem>
                        <SelectItem value="ssh">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            SSH
                          </div>
                        </SelectItem>
                        <SelectItem value="web_terminal">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            Web Terminal
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={startRemoteSession} 
                      disabled={!selectedDevice || loading}
                      className="flex-1"
                    >
                      {loading ? "Connecting..." : "Connect"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewSession(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active">Active Sessions</TabsTrigger>
              <TabsTrigger value="history">Session History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {sessions.filter(s => s.session_status === 'active').map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSessionIcon(session.session_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.hostname}</span>
                        <Badge variant="outline">
                          {session.session_type.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(session.session_status)}>
                          {session.session_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(session.started_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => endSession(session.id)}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ))}

              {sessions.filter(s => s.session_status === 'active').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active remote sessions</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSessionIcon(session.session_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.hostname}</span>
                        <Badge variant="outline">
                          {session.session_type.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(session.session_status)}>
                          {session.session_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.started_at).toLocaleString()}
                        {session.ended_at && ` - ${new Date(session.ended_at).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Duration: {formatDuration(session.duration_seconds)}</p>
                  </div>
                </div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No session history</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};