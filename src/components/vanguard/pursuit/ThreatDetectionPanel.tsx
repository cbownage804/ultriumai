import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  Shield, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Terminal,
  FileWarning,
  Network,
  Database
} from "lucide-react";
import { useXDRThreats, useUpdateThreatStatus, XDRThreat } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";
import { ThreatDetailDialog } from "./ThreatDetailDialog";

const severityColors: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
  info: "bg-muted text-muted-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  detected: <AlertTriangle className="h-4 w-4 text-destructive" />,
  investigating: <Eye className="h-4 w-4 text-yellow-500" />,
  contained: <Shield className="h-4 w-4 text-blue-500" />,
  remediated: <CheckCircle className="h-4 w-4 text-green-500" />,
  false_positive: <XCircle className="h-4 w-4 text-muted-foreground" />,
};

const sourceIcons: Record<string, React.ReactNode> = {
  fim: <FileWarning className="h-4 w-4" />,
  registry: <Database className="h-4 w-4" />,
  network: <Network className="h-4 w-4" />,
  behavioral: <Terminal className="h-4 w-4" />,
  yara: <Shield className="h-4 w-4" />,
  threat_intel: <AlertTriangle className="h-4 w-4" />,
  edr: <Shield className="h-4 w-4" />,
};

export function ThreatDetectionPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedThreat, setSelectedThreat] = useState<XDRThreat | null>(null);
  
  const { data: threats, isLoading } = useXDRThreats({
    severity: severityFilter !== "all" ? severityFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const updateStatus = useUpdateThreatStatus();

  const filteredThreats = threats?.filter(threat => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      threat.threat_name.toLowerCase().includes(query) ||
      threat.process_name?.toLowerCase().includes(query) ||
      threat.file_path?.toLowerCase().includes(query) ||
      threat.mitre_technique?.toLowerCase().includes(query)
    );
  });

  const handleStatusChange = (threatId: string, newStatus: string) => {
    updateStatus.mutate({ threatId, status: newStatus });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search threats, processes, files, MITRE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="detected">Detected</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="contained">Contained</SelectItem>
                <SelectItem value="remediated">Remediated</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Threats List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Detected Threats
            {filteredThreats && (
              <Badge variant="secondary" className="ml-2">
                {filteredThreats.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading threats...
              </div>
            ) : !filteredThreats?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Shield className="h-8 w-8 mb-2 text-green-500" />
                <p>No threats detected</p>
                <p className="text-xs">Your endpoints are protected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreats.map((threat) => (
                  <div
                    key={threat.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedThreat(threat)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {statusIcons[threat.status]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{threat.threat_name}</span>
                            <Badge className={severityColors[threat.severity]}>
                              {threat.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {threat.threat_type}
                            </Badge>
                          </div>
                          
                          <div className="mt-1 text-sm text-muted-foreground">
                            {threat.agent?.name || "Unknown device"}
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {threat.mitre_technique && (
                              <Badge variant="secondary" className="font-mono">
                                {threat.mitre_technique}
                              </Badge>
                            )}
                            {threat.detection_source && (
                              <Badge variant="outline" className="gap-1">
                                {sourceIcons[threat.detection_source]}
                                {threat.detection_source}
                              </Badge>
                            )}
                            {threat.process_name && (
                              <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                                {threat.process_name}
                              </code>
                            )}
                          </div>

                          {threat.file_path && (
                            <div className="mt-1 text-xs text-muted-foreground font-mono truncate">
                              {threat.file_path}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(threat.created_at), { addSuffix: true })}
                        </div>
                        <Select
                          value={threat.status}
                          onValueChange={(value) => {
                            handleStatusChange(threat.id, value);
                          }}
                        >
                          <SelectTrigger 
                            className="h-8 w-[130px] text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="detected">Detected</SelectItem>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="contained">Contained</SelectItem>
                            <SelectItem value="remediated">Remediated</SelectItem>
                            <SelectItem value="false_positive">False Positive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Threat Detail Dialog */}
      <ThreatDetailDialog
        threat={selectedThreat}
        open={!!selectedThreat}
        onOpenChange={(open) => !open && setSelectedThreat(null)}
      />
    </div>
  );
}
