import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Download, RefreshCw, Loader2, BarChart3, 
  Shield, Ticket, DollarSign, Building2, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface ReportData {
  generatedAt: string;
  reportType: string;
  dateRange: { start: string; end: string };
  summary: any;
  sections: Array<{
    title: string;
    type: string;
    chartType?: string;
    data: any;
  }>;
}

const COLORS = ['#22d3ee', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function ExecutiveReports() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<string>('executive');
  const [dateRange, setDateRange] = useState<string>('30');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchSavedReports();
    }
  }, [user]);

  const fetchSavedReports = async () => {
    const { data, error } = await supabase
      .from('bi_reports')
      .select('*')
      .eq('user_id', user?.id)
      .order('last_generated_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setSavedReports(data);
    }
  };

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date().toISOString();
      const startDate = subDays(new Date(), parseInt(dateRange)).toISOString();

      const { data, error } = await supabase.functions.invoke('generate-executive-report', {
        body: {
          reportType,
          dateRange: { start: startDate, end: endDate }
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setReportData(data.report);
      fetchSavedReports();
      toast.success('Report generated successfully');
    } catch (err: any) {
      console.error('Report generation error:', err);
      toast.error('Failed to generate report', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = () => {
    if (!reportData) return;

    const content = JSON.stringify(reportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const renderSummaryCard = (title: string, value: string | number, icon: React.ReactNode, color: string) => (
    <Card className={`bg-black/60 border-${color}-500/30`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">{title}</p>
            <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
          </div>
          <div className={`text-${color}-400/50`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  const renderChartSection = (section: any) => {
    if (!section.data || !Array.isArray(section.data) || section.data.length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          No data available for this section
        </div>
      );
    }

    if (section.chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={section.data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              nameKey={Object.keys(section.data[0])[0]}
            >
              {section.data.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee40' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={section.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey={Object.keys(section.data[0])[0]} stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #22d3ee40' }}
          />
          <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Executive Reports</h2>
            <p className="text-sm text-slate-400">Generate comprehensive business intelligence reports</p>
          </div>
        </div>
      </div>

      {/* Report Configuration */}
      <Card className="bg-black/60 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 text-lg">Generate Report</CardTitle>
          <CardDescription className="text-slate-400">
            Select report type and date range to generate insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px] border-cyan-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="executive">Executive Summary</SelectItem>
                  <SelectItem value="security">Security Report</SelectItem>
                  <SelectItem value="compliance">Compliance Report</SelectItem>
                  <SelectItem value="helpdesk">Helpdesk Report</SelectItem>
                  <SelectItem value="billing">Billing Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px] border-cyan-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-cyan-500/30">
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateReport} 
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-cyan-600"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><BarChart3 className="h-4 w-4 mr-2" />Generate Report</>
              )}
            </Button>

            {reportData && (
              <Button variant="outline" onClick={exportReport} className="border-cyan-500/30 text-cyan-400">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Display */}
      {reportData && (
        <div className="space-y-6">
          {/* Report Header */}
          <Card className="bg-black/60 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white capitalize">
                    {reportData.reportType} Report
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {format(new Date(reportData.dateRange.start), 'MMM d, yyyy')} - {format(new Date(reportData.dateRange.end), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Generated {format(new Date(reportData.generatedAt), 'MMM d, HH:mm')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          {reportData.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {reportType === 'executive' || reportType === 'security' ? (
                <>
                  {renderSummaryCard('Security Events', reportData.summary.security?.totalSecurityEvents || 0, <Shield className="h-8 w-8" />, 'red')}
                  {renderSummaryCard('Vulnerabilities', reportData.summary.security?.totalVulnerabilities || 0, <AlertTriangle className="h-8 w-8" />, 'orange')}
                </>
              ) : null}
              {reportType === 'executive' || reportType === 'helpdesk' ? (
                <>
                  {renderSummaryCard('Total Tickets', reportData.summary.helpdesk?.totalTickets || 0, <Ticket className="h-8 w-8" />, 'cyan')}
                  {renderSummaryCard('Avg Resolution', `${reportData.summary.helpdesk?.avgResolutionHours || 0}h`, <Clock className="h-8 w-8" />, 'purple')}
                </>
              ) : null}
              {reportType === 'executive' || reportType === 'billing' ? (
                <>
                  {renderSummaryCard('Billable Hours', reportData.summary.billing?.billableHours?.toFixed(1) || 0, <Clock className="h-8 w-8" />, 'green')}
                  {renderSummaryCard('Revenue', `$${reportData.summary.billing?.totalRevenue?.toFixed(0) || 0}`, <DollarSign className="h-8 w-8" />, 'emerald')}
                </>
              ) : null}
              {reportType === 'executive' || reportType === 'compliance' ? (
                <>
                  {renderSummaryCard('Compliance Score', `${reportData.summary.compliance?.overallScore || 0}%`, <Target className="h-8 w-8" />, 'blue')}
                  {renderSummaryCard('Total Scans', reportData.summary.compliance?.totalScans || 0, <Shield className="h-8 w-8" />, 'purple')}
                </>
              ) : null}
            </div>
          )}

          {/* Report Sections */}
          {reportData.sections && reportData.sections.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportData.sections.map((section, index) => (
                <Card key={index} className="bg-black/60 border-cyan-500/30">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {section.type === 'chart' || section.type === 'table' ? (
                      renderChartSection(section)
                    ) : section.type === 'summary' ? (
                      <div className="space-y-3">
                        {Object.entries(section.data || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700/50">
                            <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="text-white font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <pre className="text-xs text-slate-300 overflow-auto">
                        {JSON.stringify(section.data, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Reports */}
      {savedReports.length > 0 && (
        <Card className="bg-black/60 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    <div>
                      <p className="text-white text-sm font-medium">{report.report_name}</p>
                      <p className="text-slate-500 text-xs capitalize">{report.report_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-xs">
                      {report.last_generated_at && format(new Date(report.last_generated_at), 'MMM d, yyyy HH:mm')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setReportData(report.report_config)}
                      className="text-cyan-400"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
