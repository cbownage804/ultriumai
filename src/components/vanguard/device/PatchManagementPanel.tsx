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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  Download,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Settings2,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";

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

interface PatchPolicy {
  id: string;
  name: string;
  auto_approve_critical: boolean;
  auto_approve_important: boolean;
  auto_approve_moderate: boolean;
  auto_approve_low: boolean;
  exclude_drivers: boolean;
  deployment_window_start: string;
  deployment_window_end: string;
  reboot_policy: "immediate" | "scheduled" | "user_choice" | "suppress";
  max_concurrent_installs: number;
}

// Mock patch data
const mockPatches: Patch[] = [
  {
    id: "1",
    kb_number: "KB5034441",
    title: "2024-01 Cumulative Update for Windows 11",
    description: "Cumulative security update addressing multiple vulnerabilities",
    severity: "critical",
    category: "security",
    size_mb: 456.2,
    release_date: "2024-01-09",
    status: "approved",
    affected_devices: 45,
    installed_devices: 32,
    cve_ids: ["CVE-2024-0001", "CVE-2024-0002", "CVE-2024-0003"],
  },
  {
    id: "2",
    kb_number: "KB5034467",
    title: "Security Update for Microsoft Defender",
    description: "Definition update for Windows Defender antimalware platform",
    severity: "critical",
    category: "definition",
    size_mb: 12.8,
    release_date: "2024-01-15",
    status: "installed",
    affected_devices: 50,
    installed_devices: 50,
    cve_ids: [],
  },
  {
    id: "3",
    kb_number: "KB5034123",
    title: "Servicing Stack Update for Windows Server 2022",
    description: "Required update for installing future security updates",
    severity: "important",
    category: "security",
    size_mb: 23.5,
    release_date: "2024-01-08",
    status: "available",
    affected_devices: 12,
    installed_devices: 0,
  },
  {
    id: "4",
    kb_number: "KB5034890",
    title: "Intel Network Adapter Driver Update",
    description: "Driver update for Intel I225-V Ethernet controllers",
    severity: "moderate",
    category: "driver",
    size_mb: 8.2,
    release_date: "2024-01-12",
    status: "declined",
    affected_devices: 18,
    installed_devices: 0,
  },
  {
    id: "5",
    kb_number: "KB5034555",
    title: ".NET Framework 4.8.1 Security Update",
    description: "Security improvements for .NET Framework runtime",
    severity: "important",
    category: "security",
    size_mb: 67.3,
    release_date: "2024-01-10",
    status: "pending_reboot",
    affected_devices: 38,
    installed_devices: 35,
    cve_ids: ["CVE-2024-0010"],
  },
  {
    id: "6",
    kb_number: "KB5034999",
    title: "Microsoft Office Security Update",
    description: "Addresses remote code execution vulnerabilities",
    severity: "critical",
    category: "security",
    size_mb: 145.6,
    release_date: "2024-01-14",
    status: "failed",
    affected_devices: 42,
    installed_devices: 38,
    cve_ids: ["CVE-2024-0015", "CVE-2024-0016"],
  },
];

const defaultPolicy: PatchPolicy = {
  id: "default",
  name: "Default Policy",
  auto_approve_critical: true,
  auto_approve_important: false,
  auto_approve_moderate: false,
  auto_approve_low: false,
  exclude_drivers: true,
  deployment_window_start: "02:00",
  deployment_window_end: "06:00",
  reboot_policy: "scheduled",
  max_concurrent_installs: 10,
};

export function PatchManagementPanel() {
  const [patches, setPatches] = useState<Patch[]>(mockPatches);
  const [selectedPatches, setSelectedPatches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("patches");
  const [policy, setPolicy] = useState<PatchPolicy>(defaultPolicy);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const filteredPatches = patches.filter((patch) => {
    const matchesSearch =
      patch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patch.kb_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || patch.severity === filterSeverity;
    const matchesStatus = filterStatus === "all" || patch.status === filterStatus;
    const matchesCategory = filterCategory === "all" || patch.category === filterCategory;
    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
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

  const handleApprove = () => {
    setPatches(
      patches.map((p) =>
        selectedPatches.includes(p.id) && p.status === "available"
          ? { ...p, status: "approved" as const }
          : p
      )
    );
    setSelectedPatches([]);
  };

  const handleDecline = () => {
    setPatches(
      patches.map((p) =>
        selectedPatches.includes(p.id) && ["available", "approved"].includes(p.status)
          ? { ...p, status: "declined" as const }
          : p
      )
    );
    setSelectedPatches([]);
  };

  const handleScan = async () => {
    setIsScanning(true);
    // Simulate scan
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsScanning(false);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setPatches(
      patches.map((p) =>
        selectedPatches.includes(p.id) && p.status === "approved"
          ? { ...p, status: "installed" as const, installed_devices: p.affected_devices }
          : p
      )
    );
    setSelectedPatches([]);
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
            <Clock className="h-6 w-6 mx-auto text-yellow-500 mb-2" />
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
          <TabsTrigger value="policy">Approval Policy</TabsTrigger>
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
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="definition">Definition</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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

          {/* Patches Table */}
          <Card>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3 bg-muted/30">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={
                      filteredPatches.length > 0 &&
                      selectedPatches.length === filteredPatches.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedPatches.length} of {filteredPatches.length} selected
                  </span>
                </div>
              </div>
              <ScrollArea className="h-[500px]">
                <div className="divide-y">
                  {filteredPatches.map((patch) => (
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
                        {patch.cve_ids && patch.cve_ids.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Shield className="h-3 w-3 text-red-500" />
                            <span className="text-xs text-red-500">
                              {patch.cve_ids.slice(0, 3).join(", ")}
                              {patch.cve_ids.length > 3 && ` +${patch.cve_ids.length - 3} more`}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">{patch.size_mb} MB</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(patch.release_date), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="text-sm">
                          {patch.installed_devices}/{patch.affected_devices} devices
                        </p>
                        <Progress
                          value={(patch.installed_devices / patch.affected_devices) * 100}
                          className="h-1.5 mt-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policy" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-cyan-500" />
                Patch Approval Policy
              </CardTitle>
              <CardDescription>
                Configure automatic approval rules and deployment windows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Auto-Approval Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Critical Patches</span>
                      </div>
                      <Checkbox
                        checked={policy.auto_approve_critical}
                        onCheckedChange={(checked) =>
                          setPolicy({ ...policy, auto_approve_critical: checked as boolean })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Important Patches</span>
                      </div>
                      <Checkbox
                        checked={policy.auto_approve_important}
                        onCheckedChange={(checked) =>
                          setPolicy({ ...policy, auto_approve_important: checked as boolean })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Moderate Patches</span>
                      </div>
                      <Checkbox
                        checked={policy.auto_approve_moderate}
                        onCheckedChange={(checked) =>
                          setPolicy({ ...policy, auto_approve_moderate: checked as boolean })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Low Priority Patches</span>
                      </div>
                      <Checkbox
                        checked={policy.auto_approve_low}
                        onCheckedChange={(checked) =>
                          setPolicy({ ...policy, auto_approve_low: checked as boolean })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Exclude Driver Updates</span>
                      </div>
                      <Checkbox
                        checked={policy.exclude_drivers}
                        onCheckedChange={(checked) =>
                          setPolicy({ ...policy, exclude_drivers: checked as boolean })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Deployment Window</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Start Time</label>
                      <Input
                        type="time"
                        value={policy.deployment_window_start}
                        onChange={(e) =>
                          setPolicy({ ...policy, deployment_window_start: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">End Time</label>
                      <Input
                        type="time"
                        value={policy.deployment_window_end}
                        onChange={(e) =>
                          setPolicy({ ...policy, deployment_window_end: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Reboot Policy</label>
                    <Select
                      value={policy.reboot_policy}
                      onValueChange={(v) =>
                        setPolicy({ ...policy, reboot_policy: v as PatchPolicy["reboot_policy"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate Reboot</SelectItem>
                        <SelectItem value="scheduled">Scheduled Reboot</SelectItem>
                        <SelectItem value="user_choice">User Choice</SelectItem>
                        <SelectItem value="suppress">Suppress Reboot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Max Concurrent Installs
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={policy.max_concurrent_installs}
                      onChange={(e) =>
                        setPolicy({ ...policy, max_concurrent_installs: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Policy</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-cyan-500" />
                Deployment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: "2024-01-15 03:00", patches: 12, success: 11, failed: 1 },
                  { date: "2024-01-08 03:00", patches: 8, success: 8, failed: 0 },
                  { date: "2024-01-01 03:00", patches: 15, success: 14, failed: 1 },
                  { date: "2023-12-25 03:00", patches: 6, success: 6, failed: 0 },
                ].map((deployment, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Calendar className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="font-medium">{deployment.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {deployment.patches} patches deployed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-green-500">
                          {deployment.success} successful
                        </p>
                        {deployment.failed > 0 && (
                          <p className="text-sm text-red-500">{deployment.failed} failed</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deploy Dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Patches Now</DialogTitle>
            <DialogDescription>
              You are about to deploy {selectedPatches.length} patches to affected devices.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-4">
              <p className="text-sm text-yellow-600">
                Patches will be installed immediately, bypassing the scheduled deployment window.
                Devices may require a reboot.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Patches:</p>
              <div className="space-y-1">
                {patches
                  .filter((p) => selectedPatches.includes(p.id))
                  .map((patch) => (
                    <div key={patch.id} className="text-sm text-muted-foreground">
                      • {patch.kb_number} - {patch.title}
                    </div>
                  ))}
              </div>
            </div>
          </div>
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
