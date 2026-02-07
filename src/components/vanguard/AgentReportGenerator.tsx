import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Calendar as CalendarIcon, Download, Clock, Plus, 
  Trash2, Play, CheckCircle, XCircle, FileSpreadsheet, 
  FileCode, Mail, RefreshCw, BarChart3, Shield, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { useVanguardLimits } from '@/hooks/useVanguardLimits';

interface ScheduledReport {
  id: string;
  name: string;
  report_type: string;
  schedule_cron: string;
  format: string;
  recipients: string[];
  config: Record<string, unknown>;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

interface ReportHistory {
  id: string;
  report_id: string;
  status: string;
  file_url: string | null;
  file_size_bytes: number | null;
  generation_time_ms: number | null;
  error_message: string | null;
  generated_at: string;
}

const REPORT_TYPES = [
  { id: 'executive', name: 'Executive Summary', icon: BarChart3, description: 'High-level security posture overview' },
  { id: 'compliance', name: 'Compliance Report', icon: Shield, description: 'Detailed compliance status and gaps' },
  { id: 'threat', name: 'Threat Analysis', icon: Activity, description: 'Threats detected and response actions' },
  { id: 'performance', name: 'Performance Report', icon: Activity, description: 'Agent performance and health metrics' },
];

const SCHEDULE_OPTIONS = [
  { value: '0 8 * * 1', label: 'Weekly (Monday 8 AM)' },
  { value: '0 8 * * *', label: 'Daily (8 AM)' },
  { value: '0 8 1 * *', label: 'Monthly (1st at 8 AM)' },
  { value: '0 8 1 */3 *', label: 'Quarterly' },
];

export const AgentReportGenerator = () => {
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddReport, setShowAddReport] = useState(false);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [newReport, setNewReport] = useState({
    name: '',
    report_type: '',
    schedule_cron: '0 8 * * 1',
    format: 'pdf',
    recipients: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { enforceLimit } = useVanguardLimits();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const [reportsRes, historyRes] = await Promise.all([
        supabase.from('vanguard_scheduled_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('vanguard_report_history').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }).limit(20)
      ]);

      if (reportsRes.data) setReports(reportsRes.data as ScheduledReport[]);
      if (historyRes.data) setHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addReport = async () => {
    if (!user || !newReport.name || !newReport.report_type) return;
    
    // Enforce custom reports limit
    if (!enforceLimit('customReports', reports.length)) return;

    try {
      const recipients = newReport.recipients.split(',').map(e => e.trim()).filter(Boolean);
      
      const { error } = await supabase.from('vanguard_scheduled_reports').insert({
        user_id: user.id,
        name: newReport.name,
        report_type: newReport.report_type,
        schedule_cron: newReport.schedule_cron,
        format: newReport.format,
        recipients,
        is_enabled: true,
        config: {}
      });

      if (error) throw error;

      toast({ title: 'Report Scheduled', description: `${newReport.name} will be generated automatically` });
      setShowAddReport(false);
      setNewReport({ name: '', report_type: '', schedule_cron: '0 8 * * 1', format: 'pdf', recipients: '' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to schedule report', variant: 'destructive' });
    }
  };

  const deleteReport = async (id: string) => {
    try {
      await supabase.from('vanguard_scheduled_reports').delete().eq('id', id);
      toast({ title: 'Report Deleted' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const toggleReport = async (id: string, enabled: boolean) => {
    try {
      await supabase.from('vanguard_scheduled_reports').update({ is_enabled: enabled }).eq('id', id);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const generateNow = async (report: ScheduledReport) => {
    if (!user) return;
    setGeneratingReport(report.id);

    try {
      // Create a history entry
      const { data: historyEntry, error: historyError } = await supabase
        .from('vanguard_report_history')
        .insert({
          report_id: report.id,
          user_id: user.id,
          status: 'generating'
        })
        .select()
        .single();

      if (historyError) throw historyError;

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update with success
      await supabase
        .from('vanguard_report_history')
        .update({
          status: 'completed',
          file_url: `/reports/${report.report_type}-${Date.now()}.${report.format}`,
          file_size_bytes: Math.floor(Math.random() * 500000) + 100000,
          generation_time_ms: Math.floor(Math.random() * 5000) + 1000
        })
        .eq('id', historyEntry.id);

      // Update last_run_at
      await supabase
        .from('vanguard_scheduled_reports')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', report.id);

      toast({ title: 'Report Generated', description: `${report.name} is ready for download` });
      fetchData();
    } catch (error) {
      toast({ title: 'Generation Failed', description: 'Could not generate report', variant: 'destructive' });
    } finally {
      setGeneratingReport(null);
    }
  };

  const generateOnDemand = async (reportType: string) => {
    if (!user) return;

    try {
      const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

      toast({ title: 'Generating Report', description: `${reportType} report for ${startDate} to ${endDate}` });

      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({ title: 'Report Ready', description: 'Your report has been generated' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const getScheduleLabel = (cron: string) => {
    const option = SCHEDULE_OPTIONS.find(o => o.value === cron);
    return option?.label || cron;
  };

  const getReportTypeIcon = (type: string) => {
    const reportType = REPORT_TYPES.find(r => r.id === type);
    return reportType?.icon || FileText;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Report Generator</h2>
            <p className="text-muted-foreground">Schedule and generate security reports</p>
          </div>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>On-Demand Report Generation</CardTitle>
              <CardDescription>Generate a report for a specific date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-64 justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, 'PP')} - ${format(dateRange.to, 'PP')}`
                          : 'Select date range'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {REPORT_TYPES.map(type => (
                  <Card key={type.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <type.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{type.name}</p>
                            <p className="text-sm text-muted-foreground">{type.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => generateOnDemand(type.id)}>
                            <FileSpreadsheet className="h-4 w-4 mr-1" />
                            CSV
                          </Button>
                          <Button size="sm" onClick={() => generateOnDemand(type.id)}>
                            <FileText className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Automated report generation</p>
            <Dialog open={showAddReport} onOpenChange={setShowAddReport}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Schedule Report</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule New Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Report Name</Label>
                    <Input
                      placeholder="e.g., Weekly Security Summary"
                      value={newReport.name}
                      onChange={e => setNewReport({ ...newReport, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={newReport.report_type} onValueChange={v => setNewReport({ ...newReport, report_type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Select value={newReport.schedule_cron} onValueChange={v => setNewReport({ ...newReport, schedule_cron: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Format</Label>
                    <Select value={newReport.format} onValueChange={v => setNewReport({ ...newReport, format: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="html">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Email Recipients (comma-separated)</Label>
                    <Input
                      placeholder="team@company.com, manager@company.com"
                      value={newReport.recipients}
                      onChange={e => setNewReport({ ...newReport, recipients: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddReport(false)}>Cancel</Button>
                  <Button onClick={addReport} disabled={!newReport.name || !newReport.report_type}>Schedule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {reports.map(report => {
              const Icon = getReportTypeIcon(report.report_type);
              return (
                <Card key={report.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${report.is_enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`h-5 w-5 ${report.is_enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{report.name}</span>
                          <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getScheduleLabel(report.schedule_cron)}
                          </span>
                          {report.recipients.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {report.recipients.length} recipients
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={report.is_enabled}
                        onCheckedChange={checked => toggleReport(report.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateNow(report)}
                        disabled={generatingReport === report.id}
                      >
                        {generatingReport === report.id ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        Run Now
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {reports.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No scheduled reports</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowAddReport(true)}>
                    <Plus className="h-4 w-4 mr-2" />Schedule Your First Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {history.map(record => (
                <Card key={record.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      {record.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : record.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                      )}
                      <div>
                        <p className="font-medium">
                          Report Generated
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(record.generated_at).toLocaleString()}</span>
                          {record.file_size_bytes && (
                            <span>{formatFileSize(record.file_size_bytes)}</span>
                          )}
                          {record.generation_time_ms && (
                            <span>{(record.generation_time_ms / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                        {record.error_message && (
                          <p className="text-sm text-red-500">{record.error_message}</p>
                        )}
                      </div>
                    </div>
                    {record.status === 'completed' && record.file_url && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {history.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No report history yet
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
