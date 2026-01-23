import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Search, 
  Download,
  Zap,
  Loader2
} from "lucide-react";
import { useSafeOps, type RMMPatch } from "@/hooks/useSafeOps";

export const PatchManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPatch, setNewPatch] = useState<Partial<RMMPatch>>({
    title: '',
    description: '',
    category: 'security',
    severity: 'medium',
    reboot_required: false
  });

  const { 
    patches, 
    devices,
    isLoading, 
    createPatch, 
    updatePatch, 
    deployPatch,
    getPendingPatches,
    getCriticalPatches
  } = useSafeOps();

  const filteredPatches = patches.filter(patch => {
    const matchesSearch = patch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patch.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || patch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = getPendingPatches().length;
  const criticalCount = getCriticalPatches().length;
  const installedCount = patches.filter(p => p.status === 'installed').length;
  const complianceScore = patches.length > 0 
    ? Math.round((installedCount / patches.length) * 100) 
    : 100;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive/10 text-destructive";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "installed": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "installing": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "failed": return "bg-destructive/10 text-destructive";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleCreatePatch = async () => {
    await createPatch(newPatch);
    setIsCreateDialogOpen(false);
    setNewPatch({
      title: '',
      description: '',
      category: 'security',
      severity: 'medium',
      reboot_required: false
    });
  };

  const handleDeploy = async (patchId: string) => {
    await deployPatch(patchId);
  };

  const handleApprove = async (patchId: string) => {
    await updatePatch(patchId, { status: 'approved' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patch Management</h2>
          <p className="text-muted-foreground">
            AI-powered patch management with automated deployment and compliance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Patch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Patch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    value={newPatch.title}
                    onChange={(e) => setNewPatch({ ...newPatch, title: e.target.value })}
                    placeholder="Windows Security Update KB..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    value={newPatch.description || ''}
                    onChange={(e) => setNewPatch({ ...newPatch, description: e.target.value })}
                    placeholder="Describe the patch..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select 
                      value={newPatch.category}
                      onValueChange={(value) => setNewPatch({ ...newPatch, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                        <SelectItem value="firmware">Firmware</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Severity</Label>
                    <Select 
                      value={newPatch.severity}
                      onValueChange={(value) => setNewPatch({ ...newPatch, severity: value })}
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
                </div>
                <div className="space-y-2">
                  <Label>KB Article</Label>
                  <Input 
                    value={newPatch.kb_article || ''}
                    onChange={(e) => setNewPatch({ ...newPatch, kb_article: e.target.value })}
                    placeholder="KB5028185"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={newPatch.reboot_required}
                    onCheckedChange={(checked) => setNewPatch({ ...newPatch, reboot_required: checked })}
                  />
                  <Label>Reboot Required</Label>
                </div>
                <Button onClick={handleCreatePatch} className="w-full">
                  Create Patch
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Patches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting deployment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Patches</CardTitle>
            <Shield className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">Require immediate action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore}%</div>
            <p className="text-xs text-muted-foreground">Average across all devices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managed Devices</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">Available for patching</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patches" className="w-full">
        <TabsList>
          <TabsTrigger value="patches">Available Patches</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
          <TabsTrigger value="schedules">Deployment Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="patches">
          <Card>
            <CardHeader>
              <CardTitle>Patch Deployment</CardTitle>
              <CardDescription>
                Review and deploy security patches with AI-powered risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search patches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="installing">Installing</SelectItem>
                      <SelectItem value="installed">Installed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredPatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {patches.length === 0 ? 'No patches configured yet. Add your first patch above.' : 'No patches match your filters.'}
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Patch</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Severity</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Reboot</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPatches.map((patch) => (
                          <tr key={patch.id} className="border-b hover:bg-muted/50">
                            <td className="p-4">
                              <div>
                                <div className="font-medium">{patch.title}</div>
                                {patch.kb_article && (
                                  <div className="text-sm text-muted-foreground">
                                    {patch.kb_article}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4 capitalize">{patch.category}</td>
                            <td className="p-4">
                              <Badge className={getSeverityColor(patch.severity)}>
                                {patch.severity}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={getStatusColor(patch.status)}>
                                {patch.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {patch.reboot_required ? (
                                <Badge variant="outline">Required</Badge>
                              ) : (
                                <span className="text-muted-foreground">No</span>
                              )}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {patch.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleApprove(patch.id)}
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDeploy(patch.id)}
                                    >
                                      Deploy
                                    </Button>
                                  </>
                                )}
                                {patch.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeploy(patch.id)}
                                  >
                                    Deploy Now
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Dashboard</CardTitle>
              <CardDescription>
                Monitor patch compliance across all managed devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No devices available. Add devices to SafeOps to track compliance.
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium">Device</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">OS</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                          <th className="h-12 px-4 text-left align-middle font-medium">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.slice(0, 10).map((device) => (
                          <tr key={device.id} className="border-b hover:bg-muted/50">
                            <td className="p-4 font-medium">{device.hostname}</td>
                            <td className="p-4">{device.os_info || 'Unknown'}</td>
                            <td className="p-4">
                              <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                                {device.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {device.last_seen 
                                ? new Date(device.last_seen).toLocaleString()
                                : 'Never'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Schedules</CardTitle>
              <CardDescription>
                Configure automated patch deployment schedules and maintenance windows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-700 dark:text-green-400">Production Schedule</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">Critical patches: Every Tuesday 2:00 AM</p>
                  <p className="text-sm text-muted-foreground">Regular patches: First Sunday of month</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-700 dark:text-blue-400">Test Environment</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">All patches: Every Friday 6:00 PM</p>
                  <p className="text-sm text-muted-foreground">Validation: Weekend testing cycle</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
