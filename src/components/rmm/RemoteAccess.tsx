import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, 
  Terminal, 
  ExternalLink,
  Shield,
  Wifi,
  Clock,
  Construction,
  Rocket
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRemoteAccess } from "@/hooks/useRemoteAccess";

interface Device {
  id: string;
  hostname: string;
  ip_address?: string;
  device_type?: string;
  status: string;
  os_info?: string;
}

export const RemoteAccess = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const { user } = useAuth();
  const { sessions } = useRemoteAccess();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .select('*')
        .eq('status', 'online')
        .order('hostname');

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  };

  const activeSessions = sessions.filter(s => s.status === 'active').length;

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

      {/* Coming Soon Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-500/20 rounded-xl">
              <Construction className="h-10 w-10 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-xl">Remote Access Center</CardTitle>
                <Badge className="bg-amber-500 text-white">Coming Soon</Badge>
              </div>
              <CardDescription className="text-base">
                Live remote desktop, terminal, and file transfer capabilities are currently in development
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <Monitor className="h-8 w-8 text-muted-foreground mb-3" />
              <h4 className="font-semibold mb-1">Remote Desktop</h4>
              <p className="text-sm text-muted-foreground">
                Full visual control with mouse and keyboard support
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <Terminal className="h-8 w-8 text-muted-foreground mb-3" />
              <h4 className="font-semibold mb-1">Remote Terminal</h4>
              <p className="text-sm text-muted-foreground">
                PowerShell and command-line access for scripting
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <ExternalLink className="h-8 w-8 text-muted-foreground mb-3" />
              <h4 className="font-semibold mb-1">File Transfer</h4>
              <p className="text-sm text-muted-foreground">
                Secure file upload and download between devices
              </p>
            </div>
          </div>

          {/* What's Working Now */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-green-500" />
              <h4 className="font-semibold text-green-700">Available Now</h4>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Real-time device monitoring and health metrics
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Remote command execution via agent (PowerShell scripts)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Software inventory and system information
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Alerting based on CPU, memory, and disk thresholds
              </li>
            </ul>
          </div>

          {/* ETA */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Rocket className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Estimated Availability</p>
                <p className="text-sm text-muted-foreground">Q2 2026</p>
              </div>
            </div>
            <Button variant="outline" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Notify Me
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session History (read-only) */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Session History</CardTitle>
            <CardDescription>Previous remote access sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => {
                const device = devices.find(d => d.id === session.device_id);
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg opacity-60">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{device?.hostname || 'Unknown Device'}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {session.session_type}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(session.started_at).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};