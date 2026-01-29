import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  Clock,
  Plus,
  Play,
  Mail,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Server,
  Package,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useHorizonStats } from "@/hooks/useHorizonStats";
import { format, subDays } from "date-fns";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "executive" | "technical" | "compliance" | "inventory";
  sections: string[];
  schedule?: {
    frequency: "daily" | "weekly" | "monthly";
    recipients: string[];
    enabled: boolean;
  };
  lastGenerated?: string;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: "executive-summary",
    name: "Executive Summary",
    description: "High-level overview of fleet health and key metrics",
    type: "executive",
    sections: ["Fleet Overview", "Health Score Trend", "Top Issues", "Recommendations"],
    schedule: { frequency: "weekly", recipients: ["cto@company.com"], enabled: true },
    lastGenerated: subDays(new Date(), 7).toISOString(),
  },
  {
    id: "device-inventory",
    name: "Device Inventory Report",
    description: "Complete list of all managed devices with specifications",
    type: "inventory",
    sections: ["Device List", "Hardware Specs", "Software Inventory", "Agent Versions"],
    lastGenerated: subDays(new Date(), 1).toISOString(),
  },
  {
    id: "patch-compliance",
    name: "Patch Compliance Report",
    description: "Detailed patch status and compliance metrics",
    type: "compliance",
    sections: ["Compliance Score", "Missing Patches", "Pending Updates", "Patch History"],
    schedule: { frequency: "monthly", recipients: ["security@company.com"], enabled: true },
    lastGenerated: subDays(new Date(), 30).toISOString(),
  },
  {
    id: "performance-analysis",
    name: "Performance Analysis",
    description: "Deep dive into resource utilization and trends",
    type: "technical",
    sections: ["CPU Trends", "Memory Usage", "Disk Utilization", "Network I/O", "Alerts Summary"],
    lastGenerated: subDays(new Date(), 3).toISOString(),
  },
  {
    id: "security-posture",
    name: "Security Posture Report",
    description: "Security status including AV, patches, and vulnerabilities",
    type: "compliance",
    sections: ["Security Score", "AV Status", "Missing Patches", "Vulnerabilities", "Recommendations"],
    schedule: { frequency: "weekly", recipients: ["ciso@company.com"], enabled: true },
    lastGenerated: subDays(new Date(), 7).toISOString(),
  },
];

const TYPE_CONFIG = {
  executive: { icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
  technical: { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-500/10" },
  compliance: { icon: Shield, color: "text-green-500", bg: "bg-green-500/10" },
  inventory: { icon: Server, color: "text-orange-500", bg: "bg-orange-500/10" },
};

export function RMMReportingDashboard() {
  const { stats, devices } = useHorizonStats();
  const [reports, setReports] = useState<ReportTemplate[]>(REPORT_TEMPLATES);
  const [generating, setGenerating] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");

  const generateReport = async (report: ReportTemplate, format: "pdf" | "csv" | "excel") => {
    setGenerating(report.id);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update last generated
    setReports(prev => prev.map(r => 
      r.id === report.id ? { ...r, lastGenerated: new Date().toISOString() } : r
    ));
    
    setGenerating(null);
    toast.success(`${report.name} generated successfully`, {
      description: `Report exported as ${format.toUpperCase()}`,
    });
  };

  const toggleSchedule = (reportId: string) => {
    setReports(prev => prev.map(r => 
      r.id === reportId && r.schedule 
        ? { ...r, schedule: { ...r.schedule, enabled: !r.schedule.enabled } }
        : r
    ));
    toast.success("Schedule updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-500" />
            RMM Reporting
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate and schedule comprehensive reports
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Custom Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Build a custom report with specific sections
                </DialogDescription>
              </DialogHeader>
              {/* Custom report builder would go here */}
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Custom report builder coming soon</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats for Reports */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server className="h-4 w-4" />
              <span className="text-sm">Total Devices</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalDevices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-sm">Patch Compliance</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.patchCompliance}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Active Alerts</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeAlerts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="text-sm">AV Coverage</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stats.totalDevices > 0 
                ? Math.round((stats.devicesWithAV / stats.totalDevices) * 100) 
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map(report => {
              const config = TYPE_CONFIG[report.type];
              const Icon = config.icon;
              const isGenerating = generating === report.id;
              
              return (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{report.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {report.description}
                          </CardDescription>
                        </div>
                      </div>
                      {report.schedule && (
                        <Badge variant={report.schedule.enabled ? "default" : "secondary"}>
                          {report.schedule.frequency}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Sections */}
                    <div className="flex flex-wrap gap-1">
                      {report.sections.map(section => (
                        <Badge key={section} variant="outline" className="text-xs">
                          {section}
                        </Badge>
                      ))}
                    </div>

                    {/* Last Generated */}
                    {report.lastGenerated && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last generated: {format(new Date(report.lastGenerated), "MMM d, yyyy")}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button 
                        size="sm" 
                        onClick={() => generateReport(report, "pdf")}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Generate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateReport(report, "csv")}
                        disabled={isGenerating}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        CSV
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generateReport(report, "excel")}
                        disabled={isGenerating}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      {report.schedule && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedReport(report);
                            setScheduleOpen(true);
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>
                Reports configured for automatic delivery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reports.filter(r => r.schedule).map(report => (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${TYPE_CONFIG[report.type].bg} ${TYPE_CONFIG[report.type].color}`}>
                        {(() => { const Icon = TYPE_CONFIG[report.type].icon; return <Icon className="h-4 w-4" />; })()}
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{report.schedule?.frequency}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.schedule?.recipients.length} recipient(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={report.schedule?.enabled}
                      onCheckedChange={() => toggleSchedule(report.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs follow similar pattern... */}
        <TabsContent value="executive" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {reports.filter(r => r.type === "executive").map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => generateReport(report, "pdf")}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {reports.filter(r => r.type === "technical").map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => generateReport(report, "pdf")}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {reports.filter(r => r.type === "compliance").map(report => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => generateReport(report, "pdf")}>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report: {selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Configure automatic report generation and delivery
            </DialogDescription>
          </DialogHeader>
          {selectedReport?.schedule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select defaultValue={selectedReport.schedule.frequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recipients (comma-separated)</Label>
                <Input 
                  defaultValue={selectedReport.schedule.recipients.join(", ")}
                  placeholder="email@company.com"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch defaultChecked={selectedReport.schedule.enabled} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setScheduleOpen(false);
              toast.success("Schedule updated");
            }}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
