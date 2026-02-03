import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  HardDrive, 
  Download, 
  Clock, 
  FileText, 
  Database,
  Activity,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { useXDRForensics } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow, format } from "date-fns";

const collectionTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  memory_dump: { label: "Memory Dump", icon: <Database className="h-4 w-4" /> },
  process_snapshot: { label: "Process Snapshot", icon: <Activity className="h-4 w-4" /> },
  event_logs: { label: "Event Logs", icon: <FileText className="h-4 w-4" /> },
  registry_export: { label: "Registry Export", icon: <Database className="h-4 w-4" /> },
  file_collection: { label: "File Collection", icon: <HardDrive className="h-4 w-4" /> },
  timeline: { label: "Timeline", icon: <Clock className="h-4 w-4" /> },
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  collecting: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function ForensicsPanel() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { data: forensics, isLoading } = useXDRForensics();

  const filteredForensics = forensics?.filter(f => {
    if (typeFilter === "all") return true;
    return f.collection_type === typeFilter;
  });

  const stats = {
    total: forensics?.length || 0,
    completed: forensics?.filter(f => f.status === "completed").length || 0,
    pending: forensics?.filter(f => f.status === "pending" || f.status === "collecting").length || 0,
    totalSize: forensics?.reduce((sum, f) => sum + (f.file_size_bytes || 0), 0) || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Total Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.totalSize)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Collection Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(collectionTypeLabels).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Forensic Collections
            {filteredForensics && (
              <Badge variant="secondary">{filteredForensics.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading collections...
              </div>
            ) : !filteredForensics?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <HardDrive className="h-8 w-8 mb-2" />
                <p>No forensic collections</p>
                <p className="text-xs">Collections are created during incident response</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredForensics.map((collection) => (
                  <div
                    key={collection.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {collectionTypeLabels[collection.collection_type]?.icon}
                          <span className="font-medium">
                            {collectionTypeLabels[collection.collection_type]?.label || collection.collection_type}
                          </span>
                          <div className="flex items-center gap-1">
                            {statusIcons[collection.status]}
                            <Badge variant="outline">{collection.status}</Badge>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          {collection.file_size_bytes && (
                            <div>
                              <span className="text-muted-foreground">Size: </span>
                              <span>{formatBytes(collection.file_size_bytes)}</span>
                            </div>
                          )}
                          {collection.collected_at && (
                            <div>
                              <span className="text-muted-foreground">Collected: </span>
                              <span>{format(new Date(collection.collected_at), "PPp")}</span>
                            </div>
                          )}
                          {collection.file_hash && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Hash: </span>
                              <code className="font-mono text-xs">{collection.file_hash}</code>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(collection.created_at), { addSuffix: true })}
                        </span>
                        {collection.status === "completed" && collection.storage_url && (
                          <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        )}
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
