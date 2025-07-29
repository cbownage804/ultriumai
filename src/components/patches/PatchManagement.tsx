import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Search, 
  Filter,
  Download,
  Settings,
  Zap
} from "lucide-react";
import { toast } from "sonner";

export const PatchManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock data for demonstration
  const patches = [
    {
      id: "1",
      name: "Windows Security Update KB5028185",
      vendor: "Microsoft",
      severity: "critical",
      type: "security",
      cveIds: ["CVE-2023-36874", "CVE-2023-36873"],
      releaseDate: "2023-11-14",
      status: "pending",
      targetDevices: 25,
      installedDevices: 0,
      failedDevices: 0,
      aiRiskScore: 0.95,
      aiPriority: "immediate",
      description: "Critical security update addressing multiple vulnerabilities"
    },
    {
      id: "2", 
      name: "Adobe Acrobat Reader Update 23.008.20458",
      vendor: "Adobe",
      severity: "high",
      type: "security",
      cveIds: ["CVE-2023-44373"],
      releaseDate: "2023-11-10",
      status: "completed",
      targetDevices: 15,
      installedDevices: 15,
      failedDevices: 0,
      aiRiskScore: 0.75,
      aiPriority: "high",
      description: "Security update for PDF handling vulnerabilities"
    }
  ];

  const complianceData = [
    {
      hostname: "WS-001",
      osType: "Windows 11",
      lastScan: "2023-11-15T10:30:00Z",
      missingPatches: 3,
      criticalPatches: 1,
      complianceScore: 75,
      status: "non_compliant"
    },
    {
      hostname: "WS-002", 
      osType: "Windows 10",
      lastScan: "2023-11-15T10:25:00Z",
      missingPatches: 0,
      criticalPatches: 0,
      complianceScore: 100,
      status: "compliant"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "installing": return "bg-blue-100 text-blue-800";
      case "failed": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800";
      case "non_compliant": return "bg-red-100 text-red-800";
      case "partially_compliant": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeployPatch = (patchId: string) => {
    toast.success(`Deploying patch ${patchId}...`);
  };

  const handleApprovePatch = (patchId: string) => {
    toast.success(`Patch ${patchId} approved for deployment`);
  };

  const handleSchedulePatch = () => {
    toast.success("Patch scheduling interface coming soon!");
  };

  const handleGenerateReport = () => {
    toast.success("Generating compliance report...");
  };

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
          <Button onClick={handleGenerateReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleSchedulePatch}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule Patches
          </Button>
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
            <div className="text-2xl font-bold">{patches.filter(p => p.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting deployment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Patches</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patches.filter(p => p.severity === 'critical').length}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.5%</div>
            <p className="text-xs text-muted-foreground">
              Average across all devices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Recommendations</CardTitle>
            <Zap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Automated suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patches" className="w-full">
        <TabsList>
          <TabsTrigger value="patches">Available Patches</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
          <TabsTrigger value="schedules">Deployment Schedules</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
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
              {/* Search and Filter */}
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
                      <SelectItem value="installing">Installing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Patches Table */}
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Patch</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Vendor</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Severity</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">AI Risk</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Progress</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patches.map((patch) => (
                        <tr key={patch.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{patch.name}</div>
                              <div className="text-sm text-muted-foreground">
                                CVE: {patch.cveIds.join(", ")}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{patch.vendor}</td>
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
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">
                                {(patch.aiRiskScore * 100).toFixed(0)}%
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {patch.aiPriority}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {patch.installedDevices}/{patch.targetDevices} devices
                              {patch.failedDevices > 0 && (
                                <span className="text-red-600 ml-2">
                                  ({patch.failedDevices} failed)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {patch.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprovePatch(patch.id)}
                                    variant="outline"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleDeployPatch(patch.id)}
                                  >
                                    Deploy
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Device</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">OS</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Last Scan</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Missing Patches</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Critical</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Score</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceData.map((device, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{device.hostname}</td>
                          <td className="p-4">{device.osType}</td>
                          <td className="p-4">
                            {new Date(device.lastScan).toLocaleDateString()}
                          </td>
                          <td className="p-4">{device.missingPatches}</td>
                          <td className="p-4">
                            {device.criticalPatches > 0 ? (
                              <Badge className="bg-red-100 text-red-800">
                                {device.criticalPatches}
                              </Badge>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${device.complianceScore}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{device.complianceScore}%</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getComplianceColor(device.status)}>
                              {device.status.replace('_', ' ')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
              <p className="text-center text-muted-foreground py-8">
                Patch scheduling interface coming soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                Generate compliance and deployment reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Advanced reporting coming soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};