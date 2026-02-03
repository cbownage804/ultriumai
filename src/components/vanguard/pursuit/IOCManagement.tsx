import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, Search, Trash2, Upload, Download } from "lucide-react";
import { useXDRIOCs, useCreateIOC, XDRIOC } from "@/hooks/usePursuitXDR";
import { formatDistanceToNow } from "date-fns";

const iocTypeLabels: Record<string, string> = {
  hash_md5: "MD5 Hash",
  hash_sha1: "SHA1 Hash",
  hash_sha256: "SHA256 Hash",
  ip: "IP Address",
  domain: "Domain",
  url: "URL",
  email: "Email",
  file_path: "File Path",
  registry_key: "Registry Key",
};

export function IOCManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIOC, setNewIOC] = useState({
    ioc_type: "hash_sha256",
    ioc_value: "",
    threat_name: "",
    severity: "medium",
    description: "",
  });

  const { data: iocs, isLoading } = useXDRIOCs();
  const createIOC = useCreateIOC();

  const filteredIOCs = iocs?.filter(ioc => {
    if (typeFilter !== "all" && ioc.ioc_type !== typeFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ioc.ioc_value.toLowerCase().includes(query) ||
      ioc.threat_name?.toLowerCase().includes(query)
    );
  });

  const handleAddIOC = () => {
    if (!newIOC.ioc_type || !newIOC.ioc_value) return;
    createIOC.mutate(newIOC as any, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewIOC({
          ioc_type: "hash_sha256",
          ioc_value: "",
          threat_name: "",
          severity: "medium",
          description: "",
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search IOCs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(iocTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add IOC
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Indicator of Compromise</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={newIOC.ioc_type} 
                      onValueChange={(v) => setNewIOC({ ...newIOC, ioc_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(iocTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      placeholder="e.g., 44d88612fea8a8f36de82e1278abb02f"
                      value={newIOC.ioc_value}
                      onChange={(e) => setNewIOC({ ...newIOC, ioc_value: e.target.value })}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Threat Name (optional)</Label>
                    <Input
                      placeholder="e.g., Emotet Trojan"
                      value={newIOC.threat_name}
                      onChange={(e) => setNewIOC({ ...newIOC, threat_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select 
                      value={newIOC.severity} 
                      onValueChange={(v) => setNewIOC({ ...newIOC, severity: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Additional context..."
                      value={newIOC.description}
                      onChange={(e) => setNewIOC({ ...newIOC, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddIOC} className="w-full">
                    Add IOC
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IOC List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Indicators of Compromise
            {filteredIOCs && (
              <Badge variant="secondary">{filteredIOCs.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading IOCs...
              </div>
            ) : !filteredIOCs?.length ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Target className="h-8 w-8 mb-2" />
                <p>No IOCs found</p>
                <p className="text-xs">Add indicators to start threat matching</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredIOCs.map((ioc) => (
                  <div
                    key={ioc.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{iocTypeLabels[ioc.ioc_type]}</Badge>
                          <Badge 
                            className={
                              ioc.severity === "critical" ? "bg-destructive" :
                              ioc.severity === "high" ? "bg-orange-500" :
                              ioc.severity === "medium" ? "bg-yellow-500" :
                              "bg-blue-500"
                            }
                          >
                            {ioc.severity}
                          </Badge>
                          {ioc.matches_count > 0 && (
                            <Badge variant="secondary">
                              {ioc.matches_count} matches
                            </Badge>
                          )}
                        </div>
                        <code className="text-sm font-mono block mt-1 truncate">
                          {ioc.ioc_value}
                        </code>
                        {ioc.threat_name && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {ioc.threat_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(ioc.created_at), { addSuffix: true })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
