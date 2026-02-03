import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Terminal, 
  FileText, 
  Network, 
  Brain, 
  Clock,
  User,
  HardDrive,
  Crosshair,
  Play,
  Ban,
  Trash2,
  Download
} from "lucide-react";
import { XDRThreat, useCreateResponseAction, useXDRTimeline } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow, format } from "date-fns";

interface ThreatDetailDialogProps {
  threat: XDRThreat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
  info: "bg-muted text-muted-foreground",
};

export function ThreatDetailDialog({ threat, open, onOpenChange }: ThreatDetailDialogProps) {
  const createAction = useCreateResponseAction();
  const { data: timeline } = useXDRTimeline(undefined, threat?.id);

  if (!threat) return null;

  const handleResponseAction = (actionType: string) => {
    createAction.mutate({
      agent_id: threat.agent_id,
      threat_id: threat.id,
      action_type: actionType,
      action_payload: { threat_id: threat.threat_id },
      initiated_by: "technician",
      requires_approval: actionType === "isolate",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Shield className="h-5 w-5" />
            {threat.threat_name}
            <Badge className={severityColors[threat.severity]}>
              {threat.severity}
            </Badge>
            <Badge variant="outline">{threat.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="response">Response</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Detection Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Threat ID</span>
                      <code className="font-mono text-xs">{threat.threat_id}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{threat.threat_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Source</span>
                      <Badge variant="secondary">{threat.detection_source}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Detected</span>
                      <span>{format(new Date(threat.created_at), "PPpp")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">MITRE ATT&CK</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {threat.mitre_tactic && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tactic</span>
                        <Badge variant="outline">{threat.mitre_tactic}</Badge>
                      </div>
                    )}
                    {threat.mitre_technique && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Technique</span>
                        <Badge variant="secondary" className="font-mono">
                          {threat.mitre_technique}
                        </Badge>
                      </div>
                    )}
                    {threat.mitre_subtechnique && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sub-technique</span>
                        <span className="font-mono text-xs">{threat.mitre_subtechnique}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* AI Analysis */}
              {threat.ai_analysis && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Analysis
                      {threat.ai_confidence && (
                        <Badge variant="secondary">
                          {Math.round(threat.ai_confidence * 100)}% confidence
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{threat.ai_analysis}</p>
                  </CardContent>
                </Card>
              )}

              {/* File Info */}
              {threat.file_path && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      File Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Path:</span>
                      <code className="ml-2 font-mono text-xs block mt-1 p-2 bg-muted rounded">
                        {threat.file_path}
                      </code>
                    </div>
                    {threat.file_hash && (
                      <div>
                        <span className="text-muted-foreground">Hash:</span>
                        <code className="ml-2 font-mono text-xs block mt-1 p-2 bg-muted rounded break-all">
                          {threat.file_hash}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="process" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Process Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Process Name</span>
                      <p className="font-mono">{threat.process_name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">PID</span>
                      <p className="font-mono">{threat.process_id || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parent Process</span>
                      <p className="font-mono">{threat.parent_process || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">User Account</span>
                      <p className="font-mono">{threat.user_account || "N/A"}</p>
                    </div>
                  </div>
                  
                  {threat.command_line && (
                    <div>
                      <span className="text-muted-foreground">Command Line</span>
                      <code className="block mt-1 p-3 bg-muted rounded font-mono text-xs overflow-x-auto">
                        {threat.command_line}
                      </code>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Network Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground">Source IP</span>
                      <p className="font-mono">{threat.source_ip || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Destination IP</span>
                      <p className="font-mono">{threat.destination_ip || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Destination Port</span>
                      <p className="font-mono">{threat.destination_port || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">DNS Query</span>
                      <p className="font-mono">{threat.dns_query || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Attack Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline?.length ? (
                    <div className="space-y-3">
                      {timeline.map((event, idx) => (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            {idx < timeline.length - 1 && (
                              <div className="w-0.5 h-full bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.event_time), "PPpp")}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              {typeof event.event_data === 'object' 
                                ? JSON.stringify(event.event_data, null, 2)
                                : event.event_data}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No timeline events recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="response" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crosshair className="h-4 w-4" />
                    Response Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="destructive" 
                      className="gap-2"
                      onClick={() => handleResponseAction("kill_process")}
                      disabled={!threat.process_id}
                    >
                      <Ban className="h-4 w-4" />
                      Kill Process
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleResponseAction("quarantine_file")}
                      disabled={!threat.file_path}
                    >
                      <Shield className="h-4 w-4" />
                      Quarantine File
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleResponseAction("isolate")}
                    >
                      <Network className="h-4 w-4" />
                      Isolate Device
                    </Button>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => handleResponseAction("collect_forensics")}
                    >
                      <Download className="h-4 w-4" />
                      Collect Forensics
                    </Button>
                    {threat.destination_ip && (
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => handleResponseAction("block_ip")}
                      >
                        <Ban className="h-4 w-4" />
                        Block IP
                      </Button>
                    )}
                    {threat.dns_query && (
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => handleResponseAction("block_domain")}
                      >
                        <Ban className="h-4 w-4" />
                        Block Domain
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Raw Event Data */}
              {threat.raw_event && (
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Raw Event Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs font-mono bg-muted p-3 rounded overflow-x-auto max-h-[200px]">
                      {JSON.stringify(threat.raw_event, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
