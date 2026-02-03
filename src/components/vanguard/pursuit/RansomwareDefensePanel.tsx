import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Skull, 
  Shield, 
  HardDrive, 
  FileWarning, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useXDRRansomwareEvents } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";

const eventTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  encryption_detected: { label: "Encryption Detected", icon: <FileWarning className="h-4 w-4" /> },
  honeypot_triggered: { label: "Honeypot Triggered", icon: <AlertTriangle className="h-4 w-4" /> },
  shadow_copy_attack: { label: "Shadow Copy Attack", icon: <HardDrive className="h-4 w-4" /> },
  mass_rename: { label: "Mass Rename", icon: <FileWarning className="h-4 w-4" /> },
  extension_change: { label: "Extension Change", icon: <FileWarning className="h-4 w-4" /> },
};

const statusColors: Record<string, string> = {
  detected: "bg-destructive",
  blocked: "bg-orange-500",
  contained: "bg-yellow-500",
  rolled_back: "bg-green-500",
};

export function RansomwareDefensePanel() {
  const [protectionSettings, setProtectionSettings] = useState({
    honeypotFiles: true,
    shadowCopyProtection: true,
    rapidEncryptionDetection: true,
    autoRollback: false,
    processIsolation: true,
  });

  const { data: events, isLoading } = useXDRRansomwareEvents();

  const stats = {
    total: events?.length || 0,
    blocked: events?.filter(e => e.status === "blocked").length || 0,
    rolledBack: events?.filter(e => e.status === "rolled_back").length || 0,
    filesRecovered: events?.reduce((sum, e) => sum + (e.files_recovered || 0), 0) || 0,
  };

  return (
    <div className="space-y-4">
      {/* Protection Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Skull className="h-4 w-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.blocked}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-green-500" />
              Rolled Back
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.rolledBack}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-primary" />
              Files Recovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.filesRecovered}</div>
          </CardContent>
        </Card>
      </div>

      {/* Protection Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ransomware Protection Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Honeypot Files</div>
                <div className="text-sm text-muted-foreground">
                  Deploy decoy files to detect ransomware early
                </div>
              </div>
              <Switch 
                checked={protectionSettings.honeypotFiles}
                onCheckedChange={(v) => setProtectionSettings({ ...protectionSettings, honeypotFiles: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Shadow Copy Protection</div>
                <div className="text-sm text-muted-foreground">
                  Prevent deletion of Volume Shadow Copies
                </div>
              </div>
              <Switch 
                checked={protectionSettings.shadowCopyProtection}
                onCheckedChange={(v) => setProtectionSettings({ ...protectionSettings, shadowCopyProtection: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Rapid Encryption Detection</div>
                <div className="text-sm text-muted-foreground">
                  Detect and stop mass file encryption
                </div>
              </div>
              <Switch 
                checked={protectionSettings.rapidEncryptionDetection}
                onCheckedChange={(v) => setProtectionSettings({ ...protectionSettings, rapidEncryptionDetection: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Auto-Rollback</div>
                <div className="text-sm text-muted-foreground">
                  Automatically restore files from VSS
                </div>
              </div>
              <Switch 
                checked={protectionSettings.autoRollback}
                onCheckedChange={(v) => setProtectionSettings({ ...protectionSettings, autoRollback: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <div className="font-medium">Process Isolation</div>
                <div className="text-sm text-muted-foreground">
                  Isolate suspicious encrypting processes
                </div>
              </div>
              <Switch 
                checked={protectionSettings.processIsolation}
                onCheckedChange={(v) => setProtectionSettings({ ...protectionSettings, processIsolation: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Skull className="h-5 w-5" />
            Ransomware Events
            {events && <Badge variant="secondary">{events.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading events...
              </div>
            ) : !events?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Shield className="h-8 w-8 mb-2 text-green-500" />
                <p>No ransomware events detected</p>
                <p className="text-xs">Your endpoints are protected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {eventTypeLabels[event.event_type]?.icon}
                          <span className="font-medium">
                            {eventTypeLabels[event.event_type]?.label || event.event_type}
                          </span>
                          <Badge className={statusColors[event.status]}>
                            {event.status}
                          </Badge>
                          <Badge variant="destructive">
                            {event.severity}
                          </Badge>
                        </div>
                        
                        <div className="mt-2 text-sm text-muted-foreground">
                          Device: {event.agent?.name || "Unknown"}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          {event.process_name && (
                            <div>
                              <span className="text-muted-foreground">Process: </span>
                              <code className="font-mono">{event.process_name}</code>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Files Affected: </span>
                            <span className="font-medium">{event.files_affected}</span>
                          </div>
                          {event.files_recovered && event.files_recovered > 0 && (
                            <div>
                              <span className="text-muted-foreground">Files Recovered: </span>
                              <span className="font-medium text-green-500">{event.files_recovered}</span>
                            </div>
                          )}
                        </div>

                        {event.rollback_available && event.status !== "rolled_back" && (
                          <Button variant="outline" size="sm" className="mt-3 gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Initiate Rollback
                          </Button>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
