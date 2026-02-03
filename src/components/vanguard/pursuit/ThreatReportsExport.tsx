import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { 
  FileText, Download, Calendar as CalendarIcon, FileCode, 
  FileSpreadsheet, Shield, Loader2, Share2, Clock
} from "lucide-react";

type ExportType = "pdf" | "csv" | "stix" | "json";
type ReportType = "threat_summary" | "ioc_list" | "incident_report" | "executive";

const exportTypes: { value: ExportType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "pdf", label: "PDF Report", icon: <FileText className="h-4 w-4" />, description: "Printable threat report with charts" },
  { value: "csv", label: "CSV Export", icon: <FileSpreadsheet className="h-4 w-4" />, description: "IOC list for SIEM import" },
  { value: "stix", label: "STIX 2.1", icon: <Share2 className="h-4 w-4" />, description: "Threat sharing bundle" },
  { value: "json", label: "JSON Data", icon: <FileCode className="h-4 w-4" />, description: "Raw threat data with statistics" },
];

const reportTypes: { value: ReportType; label: string }[] = [
  { value: "threat_summary", label: "Threat Summary" },
  { value: "ioc_list", label: "IOC List" },
  { value: "incident_report", label: "Incident Report" },
  { value: "executive", label: "Executive Summary" },
];

const severityFilters = ["critical", "high", "medium", "low"];

export function ThreatReportsExport() {
  const [exportType, setExportType] = useState<ExportType>("pdf");
  const [reportType, setReportType] = useState<ReportType>("threat_summary");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(["critical", "high"]);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch(
        `https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/xdr-report-export`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            export_type: exportType,
            report_type: reportType,
            filters: {
              date_from: dateRange.from.toISOString(),
              date_to: dateRange.to.toISOString(),
              severity: selectedSeverities,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
        `xdr-report-${format(new Date(), "yyyy-MM-dd")}.${exportType === "stix" ? "json" : exportType}`;

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return filename;
    },
    onSuccess: (filename) => {
      toast.success(`Report exported: ${filename}`);
    },
    onError: (error: Error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const toggleSeverity = (severity: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  return (
    <Card className="bg-card/50 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Threat Reports & Export
        </CardTitle>
        <CardDescription>
          Generate PDF reports, export IOCs, and share threat intelligence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {exportTypes.map((type) => (
            <div
              key={type.value}
              onClick={() => setExportType(type.value)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                exportType === type.value
                  ? "bg-primary/20 border-primary"
                  : "bg-white/5 border-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {type.icon}
                <span className="font-medium">{type.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          ))}
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.from, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => date && setDateRange((prev) => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <span className="self-center">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(dateRange.to, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => date && setDateRange((prev) => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Last 7 days", days: 7 },
                { label: "Last 30 days", days: 30 },
                { label: "Last 90 days", days: 90 },
              ].map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDateRange({
                      from: subDays(new Date(), preset.days),
                      to: new Date(),
                    })
                  }
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Severity Filters</Label>
              <div className="grid grid-cols-2 gap-2">
                {severityFilters.map((severity) => (
                  <div
                    key={severity}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-white/10"
                  >
                    <Checkbox
                      id={severity}
                      checked={selectedSeverities.includes(severity)}
                      onCheckedChange={() => toggleSeverity(severity)}
                    />
                    <Label htmlFor={severity} className="flex items-center gap-2 cursor-pointer">
                      <Badge
                        className={
                          severity === "critical"
                            ? "bg-red-500"
                            : severity === "high"
                            ? "bg-orange-500"
                            : severity === "medium"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }
                      >
                        {severity}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Info */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Export includes:</h4>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>• Threat details with MITRE ATT&CK mapping</li>
                      <li>• AI analysis and recommendations</li>
                      <li>• Response actions taken</li>
                      <li>• Statistical breakdown by severity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || selectedSeverities.length === 0}
          className="w-full"
          size="lg"
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate {exportTypes.find((t) => t.value === exportType)?.label}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
