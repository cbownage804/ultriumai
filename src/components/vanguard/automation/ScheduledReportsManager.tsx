import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, Calendar, Clock, Mail, Download, Play, 
  Pause, Settings, Plus, Trash2, RefreshCw, Send,
  BarChart3, PieChart, TrendingUp, Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  schedule: string;
  recipients: string[];
  lastRun?: string;
  nextRun: string;
  enabled: boolean;
  format: string;
}

export function ScheduledReportsManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    {
      id: '1',
      name: 'Weekly Performance Summary',
      type: 'performance',
      schedule: 'Weekly - Monday 8:00 AM',
      recipients: ['admin@company.com', 'manager@company.com'],
      lastRun: '2024-01-22 08:00',
      nextRun: '2024-01-29 08:00',
      enabled: true,
      format: 'PDF'
    },
    {
      id: '2',
      name: 'Monthly Client Report',
      type: 'client',
      schedule: 'Monthly - 1st 9:00 AM',
      recipients: ['clients@company.com'],
      lastRun: '2024-01-01 09:00',
      nextRun: '2024-02-01 09:00',
      enabled: true,
      format: 'PDF + Excel'
    },
    {
      id: '3',
      name: 'Daily SLA Dashboard',
      type: 'sla',
      schedule: 'Daily - 6:00 AM',
      recipients: ['ops@company.com'],
      lastRun: '2024-01-28 06:00',
      nextRun: '2024-01-29 06:00',
      enabled: false,
      format: 'Email'
    },
    {
      id: '4',
      name: 'Quarterly Executive Review',
      type: 'executive',
      schedule: 'Quarterly - 1st 10:00 AM',
      recipients: ['ceo@company.com', 'cto@company.com'],
      lastRun: '2024-01-01 10:00',
      nextRun: '2024-04-01 10:00',
      enabled: true,
      format: 'PDF'
    }
  ]);

  const generateReport = async (reportType: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-report-generator', {
        body: {
          reportType,
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-28'
          },
          reportConfig: {
            sections: ['summary', 'tickets', 'performance', 'trends'],
            metrics: ['resolution_time', 'csat', 'sla_compliance'],
            groupBy: 'technician'
          },
          recipientList: ['admin@company.com']
        }
      });

      if (error) throw error;

      if (data?.success && data.report) {
        setGeneratedReport(data.report);
        toast({
          title: "Report Generated",
          description: `${data.report.report_title} is ready`,
        });
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReport = (reportId: string) => {
    setScheduledReports(reports =>
      reports.map(r => r.id === reportId ? { ...r, enabled: !r.enabled } : r)
    );
    toast({
      title: "Schedule Updated",
      description: "Report schedule has been updated"
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <BarChart3 className="h-5 w-5" />;
      case 'client': return <Users className="h-5 w-5" />;
      case 'sla': return <Clock className="h-5 w-5" />;
      case 'executive': return <TrendingUp className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scheduled">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate Now</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  <CardTitle>Scheduled Reports</CardTitle>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </div>
              <CardDescription>
                Automated reports delivered to your inbox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scheduledReports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 border rounded-lg ${report.enabled ? '' : 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        report.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{report.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {report.schedule}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {report.recipients.length} recipients
                          </span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{report.format}</Badge>
                          {report.lastRun && (
                            <Badge variant="secondary">Last: {report.lastRun}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Next run:</p>
                        <p className="font-medium">{report.nextRun}</p>
                      </div>
                      <Switch
                        checked={report.enabled}
                        onCheckedChange={() => toggleReport(report.id)}
                      />
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Report Generator</CardTitle>
                <CardDescription>
                  Generate reports on-demand with AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select defaultValue="performance">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance Summary</SelectItem>
                      <SelectItem value="client">Client Report</SelectItem>
                      <SelectItem value="sla">SLA Analysis</SelectItem>
                      <SelectItem value="executive">Executive Summary</SelectItem>
                      <SelectItem value="technician">Technician Performance</SelectItem>
                      <SelectItem value="trends">Trend Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Input type="date" defaultValue="2024-01-01" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Input type="date" defaultValue="2024-01-28" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Output Format</label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="both">PDF + Excel</SelectItem>
                      <SelectItem value="email">Email Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => generateReport('performance')} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            {generatedReport && (
              <Card>
                <CardHeader>
                  <CardTitle>{generatedReport.report_title}</CardTitle>
                  <CardDescription>
                    Generated: {generatedReport.generated_at}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {generatedReport.executive_summary && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Executive Summary</h4>
                      <ul className="text-sm space-y-1">
                        {generatedReport.executive_summary.highlights?.map((h: string, idx: number) => (
                          <li key={idx}>• {h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {generatedReport.kpi_dashboard && (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(generatedReport.kpi_dashboard).map(([key, val]: [string, any]) => (
                        <div key={key} className="p-3 border rounded-lg text-center">
                          <p className="text-2xl font-bold">{val.value}</p>
                          <p className="text-xs text-muted-foreground">
                            {key.replace(/_/g, ' ')}
                          </p>
                          {val.change && (
                            <Badge variant={val.trend === 'up' ? 'default' : 'destructive'} className="mt-1">
                              {val.change > 0 ? '+' : ''}{val.change}%
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Send className="h-4 w-4 mr-2" />
                      Email Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: 'Weekly Performance', icon: BarChart3, description: 'Ticket metrics, resolution times, team performance' },
              { name: 'Monthly Executive', icon: TrendingUp, description: 'High-level KPIs, trends, strategic insights' },
              { name: 'Client Summary', icon: Users, description: 'Per-client metrics, SLA compliance, satisfaction' },
              { name: 'SLA Compliance', icon: Clock, description: 'Breach analysis, at-risk tickets, compliance trends' },
              { name: 'Technician Report', icon: Users, description: 'Individual performance, utilization, feedback' },
              { name: 'Trend Analysis', icon: PieChart, description: 'Issue patterns, seasonal trends, predictions' }
            ].map((template) => (
              <Card key={template.name} className="hover:border-primary transition-colors cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <template.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
