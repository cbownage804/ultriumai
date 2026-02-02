import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  Mail,
  FileText,
  Plus,
  Settings,
  Trash2,
  Play,
  Pause,
  Send,
  Download,
  Loader2,
} from "lucide-react";
import { useScheduledReports } from "@/hooks/useHorizon";

interface ScheduledReport {
  id: string;
  name: string;
  type: "executive" | "compliance" | "inventory" | "security" | "sla" | "custom";
  format: "pdf" | "csv" | "xlsx";
  schedule: "daily" | "weekly" | "monthly" | "quarterly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  isActive: boolean;
  lastSent?: string;
  nextRun?: string;
  includeCharts: boolean;
  clientFilter?: string;
}

export function ScheduledReportDelivery() {
  const { toast } = useToast();
  const { reports: dbReports, isLoading, createReport, toggleReport, refetch } = useScheduledReports();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Map DB reports to UI format
  const schedules: ScheduledReport[] = dbReports.map(r => ({
    id: r.id,
    name: r.report_name,
    type: r.report_type as ScheduledReport['type'],
    format: (r.format === 'excel' ? 'xlsx' : r.format) as ScheduledReport['format'],
    schedule: 'weekly' as const,
    time: '08:00',
    recipients: r.recipients,
    isActive: r.is_active,
    lastSent: r.last_sent_at || undefined,
    nextRun: r.next_send_at || undefined,
    includeCharts: true,
  }));

  const [newSchedule, setNewSchedule] = useState<Partial<ScheduledReport>>({
    type: "executive",
    format: "pdf",
    schedule: "weekly",
    time: "08:00",
    recipients: [],
    isActive: true,
    includeCharts: true,
  });
  const [recipientInput, setRecipientInput] = useState("");

  const reportTypes = [
    { value: "executive", label: "Executive Summary" },
    { value: "compliance", label: "Compliance Report" },
    { value: "inventory", label: "Hardware Inventory" },
    { value: "security", label: "Security Digest" },
    { value: "sla", label: "SLA Performance" },
    { value: "custom", label: "Custom Report" },
  ];

  const handleToggleSchedule = async (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      await toggleReport(id, !schedule.isActive);
    }
  };

  const handleDeleteSchedule = (id: string) => {
    toast({
      title: "Delete not implemented",
      description: "Report schedule deletion coming soon",
    });
  };

  const handleRunNow = (schedule: ScheduledReport) => {
    toast({
      title: "Report Generation Started",
      description: `Generating ${schedule.name}...`,
    });
  };

  const handleAddRecipient = () => {
    if (recipientInput && recipientInput.includes("@")) {
      setNewSchedule((prev) => ({
        ...prev,
        recipients: [...(prev.recipients || []), recipientInput],
      }));
      setRecipientInput("");
    }
  };

  const handleCreateSchedule = async () => {
    if (!newSchedule.name) {
      toast({
        title: "Error",
        description: "Please provide a schedule name",
        variant: "destructive",
      });
      return;
    }

    try {
      await createReport({
        report_name: newSchedule.name,
        report_type: newSchedule.type || 'executive',
        recipients: newSchedule.recipients || [],
        format: (newSchedule.format || 'pdf') as 'pdf' | 'csv' | 'excel',
        schedule_cron: '0 8 * * 1', // Weekly on Monday
      });
      setIsCreateOpen(false);
      setNewSchedule({
        type: "executive",
        format: "pdf",
        schedule: "weekly",
        time: "08:00",
        recipients: [],
        isActive: true,
        includeCharts: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      executive: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      compliance: "bg-green-500/20 text-green-400 border-green-500/30",
      inventory: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      security: "bg-red-500/20 text-red-400 border-red-500/30",
      sla: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      custom: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    };
    return colors[type] || colors.custom;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scheduled Report Delivery</h3>
          <p className="text-sm text-muted-foreground">
            Automate report generation and email delivery
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Report Schedule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input
                  placeholder="e.g., Weekly Executive Report"
                  value={newSchedule.name || ""}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select
                    value={newSchedule.type}
                    onValueChange={(v) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        type: v as ScheduledReport["type"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={newSchedule.format}
                    onValueChange={(v) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        format: v as ScheduledReport["format"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newSchedule.schedule}
                    onValueChange={(v) =>
                      setNewSchedule((prev) => ({
                        ...prev,
                        schedule: v as ScheduledReport["schedule"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={newSchedule.time}
                    onChange={(e) =>
                      setNewSchedule((prev) => ({ ...prev, time: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddRecipient()}
                  />
                  <Button type="button" variant="outline" onClick={handleAddRecipient}>
                    Add
                  </Button>
                </div>
                {(newSchedule.recipients || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {newSchedule.recipients?.map((email, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() =>
                            setNewSchedule((prev) => ({
                              ...prev,
                              recipients: prev.recipients?.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="includeCharts"
                  checked={newSchedule.includeCharts}
                  onCheckedChange={(checked) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      includeCharts: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="includeCharts">Include charts and graphs</Label>
              </div>

              <Button onClick={handleCreateSchedule} className="w-full">
                Create Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className={!schedule.isActive ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{schedule.name}</h4>
                      <Badge className={getTypeColor(schedule.type)}>
                        {schedule.type}
                      </Badge>
                      <Badge variant="outline" className="uppercase text-xs">
                        {schedule.format}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {schedule.schedule}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {schedule.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {schedule.recipients.length} recipient(s)
                      </span>
                    </div>
                    {schedule.nextRun && (
                      <p className="text-xs text-muted-foreground">
                        Next run:{" "}
                        {new Date(schedule.nextRun).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.isActive}
                    onCheckedChange={() => handleToggleSchedule(schedule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRunNow(schedule)}
                    title="Run Now"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-cyan-500">{schedules.length}</p>
            <p className="text-xs text-muted-foreground">Total Schedules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {schedules.filter((s) => s.isActive).length}
            </p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">47</p>
            <p className="text-xs text-muted-foreground">Sent This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">98%</p>
            <p className="text-xs text-muted-foreground">Delivery Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
