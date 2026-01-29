import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Play,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Patch {
  id: string;
  kb_number: string;
  title: string;
  description: string;
  severity: "critical" | "important" | "moderate" | "low";
  category: "security" | "feature" | "driver" | "definition" | "other";
  size_mb: number;
  release_date: string;
  status: "available" | "approved" | "declined" | "installed" | "failed" | "pending_reboot";
  affected_devices: number;
  installed_devices: number;
  cve_ids?: string[];
}

export function PatchManagementPanel() {
  const { user } = useAuth();
  const [patches, setPatches] = useState<Patch[]>([]);
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("patches");
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPatches();
    }
  }, [user]);

  const loadPatches = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('vanguard_patches')
        .select('*')
        .eq('user_id', user.id)
        .order('release_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setPatches(data.map((p: any) => ({
          id: p.id,
          kb_number: p.kb_number,
          title: p.title,
          description: p.description || '',
          severity: p.severity,
          category: p.category,
          size_mb: p.size_mb || 0,
          release_date: p.release_date,
          status: p.status,
          affected_devices: p.affected_devices || 0,
          installed_devices: p.installed_devices || 0,
          cve_ids: p.cve_ids || []
        })));
      }
    } catch (error) {
      console.error('Error loading patches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatches = patches.filter((patch) => {
    const matchesSearch =
      patch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patch.kb_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || patch.severity === filterSeverity;
    const matchesStatus = filterStatus === "all" || patch.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const stats = {
    total: patches.length,
    critical: patches.filter((p) => p.severity === "critical" && p.status !== "installed").length,
    pending: patches.filter((p) => ["available", "approved"].includes(p.status)).length,
    installed: patches.filter((p) => p.status === "installed").length,
    failed: patches.filter((p) => p.status === "failed").length,
    pendingReboot: patches.filter((p) => p.status === "pending_reboot").length,
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPatches(filteredPatches.map((p) => p.id));
    } else {
      setSelectedPatches([]);
    }
  };

  const handleSelectPatch = (patchId: string, checked: boolean) => {
    if (checked) {
      setSelectedPatches([...selectedPatches, patchId]);
    } else {
      setSelectedPatches(selectedPatches.filter((id) => id !== patchId));
    }
  };

  const updatePatchStatus = async (ids: string[], newStatus: Patch['status']) => {
    try {
      const { error } = await (supabase as any)
        .from('vanguard_patches')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;

      setPatches(patches.map((p) =>
        ids.includes(p.id) ? { ...p, status: newStatus } : p
      ));
      setSelectedPatches([]);
      toast.success(`Patches ${newStatus}`);
    } catch (error) {
      console.error('Error updating patches:', error);
      toast.error('Failed to update patches');
    }
  };

  const handleApprove = () => {
    const toApprove = selectedPatches.filter(id => {
      const patch = patches.find(p => p.id === id);
      return patch && patch.status === 'available';
    });
    if (toApprove.length > 0) {
      updatePatchStatus(toApprove, 'approved');
    }
  };

  const handleDecline = () => {
    const toDecline = selectedPatches.filter(id => {
      const patch = patches.find(p => p.id === id);
      return patch && ['available', 'approved'].includes(patch.status);
    });
    if (toDecline.length > 0) {
      updatePatchStatus(toDecline, 'declined');
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success('Scan complete');
    setIsScanning(false);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    const toInstall = selectedPatches.filter(id => {
      const patch = patches.find(p => p.id === id);
      return patch && patch.status === 'approved';
    });
    if (toInstall.length > 0) {
      await updatePatchStatus(toInstall, 'installed');
    }
    setShowDeployDialog(false);
    setIsDeploying(false);
  };

  const getSeverityBadge = (severity: Patch["severity"]) => {
    const styles = {
      critical: "bg-red-500/20 text-red-500 border-red-500/30",
      important: "bg-orange-500/20 text-orange-500 border-orange-500/30",
      moderate: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
      low: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    };
    return (
      <Badge variant="outline" className={styles[severity]}>
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: Patch["status"]) => {
    const config = {
      available: { icon: Download, class: "bg-blue-500/20 text-blue-500", label: "Available" },
      approved: { icon: CheckCircle, class: "bg-green-500/20 text-green-500", label: "Approved" },
      declined: { icon: XCircle, class: "bg-gray-500/20 text-gray-500", label: "Declined" },
      installed: { icon: CheckCircle, class: "bg-emerald-500/20 text-emerald-500", label: "Installed" },
      failed: { icon: AlertTriangle, class: "bg-red-500/20 text-red-500", label: "Failed" },
      pending_reboot: { icon: RotateCcw, class: "bg-yellow-500/20 text-yellow-500", label: "Pending Reboot" },
    };
    const { icon: Icon, class: className, label } = config[status];
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Patches</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">{stats.critical}</p>
            <p className="text-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <Download className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
            <p className="text-2xl font-bold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.installed}</p>
            <p className="text-xs text-muted-foreground">Installed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4 text-center">
            <RotateCcw className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats.pendingReboot}</p>
            <p className="text-xs text-muted-foreground">Pending Reboot</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 mx-auto text-rose-500 mb-2" />
            <p className="text-2xl font-bold">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="patches">Patches</TabsTrigger>
          <TabsTrigger value="history">Deployment History</TabsTrigger>
        </TabsList>

        <TabsContent value="patches" className="space-y-4 mt-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patches..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="important">Important</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="installed">Installed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending_reboot">Pending Reboot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleScan} disabled={isScanning}>
                {isScanning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Scan for Updates
              </Button>
              {selectedPatches.length > 0 && (
                <>
                  <Button variant="outline" onClick={handleApprove}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve ({selectedPatches.length})
                  </Button>
                  <Button variant="outline" onClick={handleDecline}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button onClick={() => setShowDeployDialog(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Deploy Now
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Patches List */}
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={filteredPatches.length > 0 && selectedPatches.length === filteredPatches.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedPatches.length} of {filteredPatches.length} selected
                  </span>
                </div>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {filteredPatches.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{patches.length === 0 ? 'No patches tracked yet' : 'No patches match your filters'}</p>
                    </div>
                  ) : (
                    filteredPatches.map((patch) => (
                      <div
                        key={patch.id}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors",
                          selectedPatches.includes(patch.id) && "bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={selectedPatches.includes(patch.id)}
                          onCheckedChange={(checked) =>
                            handleSelectPatch(patch.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm text-cyan-500">
                              {patch.kb_number}
                            </span>
                            {getSeverityBadge(patch.severity)}
                            {getStatusBadge(patch.status)}
                            <Badge variant="outline" className="text-xs">
                              {patch.category}
                            </Badge>
                          </div>
                          <p className="font-medium truncate">{patch.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {patch.description}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{patch.installed_devices}/{patch.affected_devices}</p>
                          <p className="text-xs text-muted-foreground">devices</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Deployment history will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deploy Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Patches</DialogTitle>
            <DialogDescription>
              Deploy {selectedPatches.length} selected patches to target devices?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeployDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeploy} disabled={isDeploying}>
              {isDeploying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Deploy Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}