import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Monitor,
  Terminal,
  FolderOpen,
  Video,
  Eye,
  Download,
  Upload,
  Settings,
  Power,
  RotateCcw,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

const mockSessions: RemoteSession[] = [
  {
    id: "sess-1",
    device_id: "dev-1",
    device_name: "WKS-JOHN-PC",
    user: "admin@company.com",
    type: "rdp",
    status: "active",
    started_at: new Date(Date.now() - 45 * 60000).toISOString(),
    duration_seconds: 2700,
  },
  {
    id: "sess-2",
    device_id: "dev-2",
    device_name: "SRV-PROD-01",
    user: "tech@company.com",
    type: "terminal",
    status: "active",
    started_at: new Date(Date.now() - 15 * 60000).toISOString(),
    duration_seconds: 900,
  },
  {
    id: "sess-3",
    device_id: "dev-3",
    device_name: "WKS-SARAH-LAPTOP",
    user: "admin@company.com",
    type: "file_transfer",
    status: "paused",
    started_at: new Date(Date.now() - 60 * 60000).toISOString(),
    duration_seconds: 3600,
  },
];

const mockDevices: Device[] = [
  { id: "dev-1", name: "WKS-JOHN-PC", ip_address: "192.168.1.101", status: "online", os: "Windows 11 Pro", last_user: "john@company.com" },
  { id: "dev-2", name: "SRV-PROD-01", ip_address: "192.168.1.10", status: "online", os: "Windows Server 2022" },
  { id: "dev-3", name: "WKS-SARAH-LAPTOP", ip_address: "192.168.1.102", status: "online", os: "Windows 11 Pro", last_user: "sarah@company.com" },
  { id: "dev-4", name: "WKS-MIKE-PC", ip_address: "192.168.1.103", status: "offline", os: "Windows 10 Pro", last_user: "mike@company.com" },
  { id: "dev-5", name: "SRV-DB-01", ip_address: "192.168.1.11", status: "online", os: "Windows Server 2019" },
];

export function FleetRemoteAccess() {
  const [sessions, setSessions] = useState<RemoteSession[]>(mockSessions);
  const [devices] = useState<Device[]>(mockDevices);
  const [activeTab, setActiveTab] = useState("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

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
    setIsConnecting(`${deviceId}-${type}`);
    const device = devices.find((d) => d.id === deviceId);
    
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const newSession: RemoteSession = {
      id: `sess-${Date.now()}`,
      device_id: deviceId,
      device_name: device?.name || "Unknown",
      user: "current.user@company.com",
      type: type as RemoteSession["type"],
      status: "active",
      started_at: new Date().toISOString(),
      duration_seconds: 0,
    };
    
    setSessions([newSession, ...sessions]);
    setIsConnecting(null);
    setActiveTab("sessions");
  };

  const endSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const pauseSession = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId
          ? { ...s, status: s.status === "paused" ? "active" : "paused" }
          : s
      )
    );
  };

  const getSessionIcon = (type: RemoteSession["type"]) => {
    switch (type) {
      case "rdp": case "vnc": return <Monitor className="h-4 w-4" />;
      case "terminal": return <Terminal className="h-4 w-4" />;
      case "file_transfer": return <FolderOpen className="h-4 w-4" />;
      case "screen_share": return <Eye className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
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
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Active Technicians</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-cyan-500 mb-2" />
            <p className="text-2xl font-bold">2.5h</p>
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
                    {filteredDevices.map((device) => (
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
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                Connection History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { device: "WKS-JOHN-PC", type: "rdp", user: "admin@company.com", duration: "45 min", date: "Today, 10:30 AM" },
                  { device: "SRV-PROD-01", type: "terminal", user: "tech@company.com", duration: "15 min", date: "Today, 9:15 AM" },
                  { device: "WKS-SARAH-LAPTOP", type: "file_transfer", user: "admin@company.com", duration: "5 min", date: "Yesterday, 4:30 PM" },
                  { device: "SRV-DB-01", type: "rdp", user: "admin@company.com", duration: "2 hr", date: "Yesterday, 2:00 PM" },
                  { device: "WKS-MIKE-PC", type: "screen_share", user: "tech@company.com", duration: "30 min", date: "2 days ago" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {item.type === "rdp" && <Monitor className="h-4 w-4" />}
                        {item.type === "terminal" && <Terminal className="h-4 w-4" />}
                        {item.type === "file_transfer" && <FolderOpen className="h-4 w-4" />}
                        {item.type === "screen_share" && <Eye className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium">{item.device}</p>
                        <p className="text-xs text-muted-foreground">{item.type.toUpperCase()} • {item.user}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{item.duration}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
