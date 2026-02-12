import { useState, useEffect } from "react";
import { useVanguardLimits } from '@/hooks/useVanguardLimits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Monitor,
  Terminal,
  FolderOpen,
  Eye,
  Pause,
  Play,
  Users,
  Clock,
  Wifi,
  WifiOff,
  Loader2,
  Maximize2,
  X,
  Search,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface RemoteSession {
  id: string;
  device_id: string;
  device_name: string;
  user: string;
  type: "rdp" | "vnc" | "terminal" | "file_transfer" | "screen_share";
  status: "active" | "paused" | "disconnected";
  started_at: string;
  duration_seconds: number;
}

interface Device {
  id: string;
  name: string;
  ip_address: string;
  status: "online" | "offline";
  os: string;
  last_user?: string;
}

export function FleetRemoteAccess() {
  const { user } = useAuth();
  const { enforceLimit } = useVanguardLimits();
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load devices from vanguard_agents - using correct column names
      const { data: agentsData, error: agentsError } = await supabase
        .from('vanguard_agents')
        .select('id, name, ip_address, status, agent_type, last_heartbeat, device_id')
        .eq('user_id', user?.id)
        .order('last_heartbeat', { ascending: false });

      if (agentsError) throw agentsError;

      const mappedDevices: Device[] = (agentsData || []).map((agent: any) => ({
        id: agent.id,
        name: agent.name || agent.device_id || 'Unknown',
        ip_address: agent.ip_address ? String(agent.ip_address) : 'N/A',
        status: agent.status === 'online' ? 'online' : 'offline',
        os: agent.agent_type || 'Unknown OS',
        last_user: undefined,
      }));
      setDevices(mappedDevices);

      // Load active sessions from remote_sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('remote_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['active', 'paused', 'initiated'])
        .order('started_at', { ascending: false });

      if (!sessionsError && sessionsData) {
        const mappedSessions: RemoteSession[] = sessionsData.map((sess: any) => {
          const device = mappedDevices.find(d => d.id === sess.device_id);
          const durationSecs = sess.started_at 
            ? differenceInSeconds(new Date(), new Date(sess.started_at))
            : 0;
          return {
            id: sess.id,
            device_id: sess.device_id || '',
            device_name: device?.name || 'Unknown Device',
            user: 'current.user@company.com',
            type: (sess.session_type as RemoteSession["type"]) || 'rdp',
            status: sess.status === 'initiated' ? 'active' : (sess.status as RemoteSession["status"]),
            started_at: sess.started_at || new Date().toISOString(),
            duration_seconds: durationSecs,
          };
        });
        setSessions(mappedSessions);
      }
    } catch (err) {
      console.error('Failed to load remote access data:', err);
      toast.error('Failed to load remote access data');
    } finally {
      setIsLoading(false);
    }
  };

  const onlineDevices = devices.filter((d) => d.status === "online");
  const activeSessions = sessions.filter((s) => s.status !== "disconnected");

  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.ip_address.includes(searchQuery)
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleConnect = async (deviceId: string, type: string) => {
    // Enforce concurrent session limit
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    if (!enforceLimit('remoteSessions', activeSessions)) return;

    setIsConnecting(`${deviceId}-${type}`);
    const device = devices.find((d) => d.id === deviceId);

    try {
      // Create session record with required fields
      const sessionToken = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const { data: newSession, error } = await supabase
        .from('remote_sessions')
        .insert({
          user_id: user?.id,
          device_id: deviceId,
          session_type: type,
          session_token: sessionToken,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const session: RemoteSession = {
        id: newSession.id,
        device_id: deviceId,
        device_name: device?.name || "Unknown",
        user: "current.user@company.com",
        type: type as RemoteSession["type"],
        status: "active",
        started_at: new Date().toISOString(),
        duration_seconds: 0,
      };

      setSessions([session, ...sessions]);
      setActiveTab("sessions");
      toast.success(`Connected to ${device?.name}`);
    } catch (err) {
      console.error('Failed to start session:', err);
      toast.error('Failed to start remote session');
    } finally {
      setIsConnecting(null);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('remote_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter((s) => s.id !== sessionId));
      toast.success('Session ended');
    } catch (err) {
      console.error('Failed to end session:', err);
      toast.error('Failed to end session');
    }
  };

  const pauseSession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const newStatus = session?.status === "paused" ? "active" : "paused";
    
    try {
      const { error } = await supabase
        .from('remote_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(
        sessions.map((s) =>
          s.id === sessionId
            ? { ...s, status: newStatus }
            : s
        )
      );
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const getSessionIcon = (type: RemoteSession["type"]) => {
    switch (type) {
      case "rdp": case "vnc": return <Monitor className="h-4 w-4" />;
      case "terminal": return <Terminal className="h-4 w-4" />;
      case "file_transfer": return <FolderOpen className="h-4 w-4" />;
      case "screen_share": return <Eye className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Fleet Remote Access</h2>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <Wifi className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{onlineDevices.length}</p>
            <p className="text-xs text-muted-foreground">Online Devices</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Monitor className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{activeSessions.length}</p>
            <p className="text-xs text-muted-foreground">Active Sessions</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{devices.length}</p>
            <p className="text-xs text-muted-foreground">Total Devices</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-cyan-500 mb-2" />
            <p className="text-2xl font-bold">
              {activeSessions.length > 0 
                ? formatDuration(Math.round(activeSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / activeSessions.length))
                : '0m'}
            </p>
            <p className="text-xs text-muted-foreground">Avg Session Time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sessions">Active Sessions ({activeSessions.length})</TabsTrigger>
          <TabsTrigger value="devices">Quick Connect</TabsTrigger>
          <TabsTrigger value="history">Connection History</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-cyan-500" />
                Active Remote Sessions
              </CardTitle>
              <CardDescription>Manage your current remote connections</CardDescription>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active sessions</p>
                  <p className="text-sm">Start a new connection from the Quick Connect tab</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        session.status === "active"
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-yellow-500/5 border-yellow-500/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2 rounded-lg",
                          session.status === "active" ? "bg-green-500/20" : "bg-yellow-500/20"
                        )}>
                          {getSessionIcon(session.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.device_name}</p>
                            <Badge variant={session.status === "active" ? "default" : "secondary"}>
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.type.toUpperCase()} • Connected by {session.user}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {formatDuration(session.duration_seconds)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Started {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => pauseSession(session.id)}>
                            {session.status === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => endSession(session.id)}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-cyan-500" />
                Quick Connect to Device
              </CardTitle>
              <CardDescription>Select a device and connection type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search devices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {filteredDevices.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No devices found</p>
                        <p className="text-sm">Deploy agents to see devices here</p>
                      </div>
                    ) : (
                      filteredDevices.map((device) => (
                        <div
                          key={device.id}
                          className={cn(
                            "p-4 rounded-lg border",
                            device.status === "online" ? "bg-muted/30" : "bg-muted/10 opacity-60"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                device.status === "online" ? "bg-green-500/20" : "bg-gray-500/20"
                              )}>
                                {device.status === "online" ? (
                                  <Wifi className="h-5 w-5 text-green-500" />
                                ) : (
                                  <WifiOff className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{device.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {device.ip_address} • {device.os}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {device.status === "online" ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConnect(device.id, "rdp")}
                                    disabled={isConnecting === `${device.id}-rdp`}
                                  >
                                    {isConnecting === `${device.id}-rdp` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Monitor className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">RDP</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConnect(device.id, "terminal")}
                                    disabled={isConnecting === `${device.id}-terminal`}
                                  >
                                    {isConnecting === `${device.id}-terminal` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Terminal className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">Shell</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConnect(device.id, "file_transfer")}
                                    disabled={isConnecting === `${device.id}-file_transfer`}
                                  >
                                    {isConnecting === `${device.id}-file_transfer` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <FolderOpen className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">Files</span>
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="secondary">Offline</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <ConnectionHistory userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component for connection history
function ConnectionHistory({ userId }: { userId?: string }) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('remote_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ended')
        .order('ended_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case "rdp": case "vnc": return <Monitor className="h-4 w-4" />;
      case "terminal": return <Terminal className="h-4 w-4" />;
      case "file_transfer": return <FolderOpen className="h-4 w-4" />;
      case "screen_share": return <Eye className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-cyan-500" />
          Connection History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No connection history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const duration = item.started_at && item.ended_at
                ? formatDistanceToNow(new Date(item.started_at), { addSuffix: false })
                : 'N/A';
              
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getSessionIcon(item.session_type)}
                    </div>
                    <div>
                      <p className="font-medium">Device: {item.device_id?.substring(0, 8)}...</p>
                      <p className="text-sm text-muted-foreground">
                        {item.session_type?.toUpperCase() || 'RDP'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{duration}</p>
                    <p>{item.ended_at ? new Date(item.ended_at).toLocaleDateString() : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
